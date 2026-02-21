import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const cleanupDuplicateAttendance = mutation({
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("attendance").collect();
    const seen = new Set();
    let deletedCount = 0;

    // Sort by creation time so we keep the latest one if we process backwards, 
    // or keep the first one if we process forwards. Let's keep the latest.
    allRecords.sort((a, b) => b._creationTime - a._creationTime);

    for (const record of allRecords) {
      const key = `${record.studentId}-${record.date}`;
      if (seen.has(key)) {
        await ctx.db.delete(record._id);
        deletedCount++;
      } else {
        seen.add(key);
      }
    }
    return `Cleaned up ${deletedCount} duplicate records.`;
  }
});

export const markAttendance = mutation({
  args: {
    studentId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("leave"), v.literal("od"), v.literal("holiday")),
  },
  handler: async (ctx, args) => {
    const existingRecords = await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) =>
        q.eq("studentId", args.studentId).eq("date", args.date)
      )
      .collect();

    if (existingRecords.length > 0) {
      // Keep the newest record and remove any accidental duplicates.
      existingRecords.sort((a, b) => b._creationTime - a._creationTime);
      const [latestRecord, ...duplicates] = existingRecords;
      await ctx.db.patch(latestRecord._id, { status: args.status });
      for (const duplicate of duplicates) {
        await ctx.db.delete(duplicate._id);
      }
    } else {
      await ctx.db.insert("attendance", {
        studentId: args.studentId,
        date: args.date,
        status: args.status,
      });
    }
  },
});

export const getAttendanceForStudent = query({
  args: { 
    studentId: v.id("users"),
    month: v.optional(v.string()) // YYYY-MM
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) => q.eq("studentId", args.studentId));

    const records = args.month
      ? await q
        .filter(q => 
          q.and(
            q.gte(q.field("date"), `${args.month}-01`),
            q.lte(q.field("date"), `${args.month}-31`)
          )
        )
        .collect()
      : await q.collect();

    // De-duplicate by date and keep the latest write.
    const latestByDate = new Map();
    for (const record of records) {
      const previous = latestByDate.get(record.date);
      if (!previous || record._creationTime > previous._creationTime) {
        latestByDate.set(record.date, record);
      }
    }

    return Array.from(latestByDate.values());
  },
});

export const getAttendanceByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    // De-duplicate to only keep the latest record for each student.
    const latestMap = new Map();
    for (const record of records) {
      const previous = latestMap.get(record.studentId);
      if (!previous || record._creationTime > previous._creationTime) {
        latestMap.set(record.studentId, record);
      }
    }
    
    return Array.from(latestMap.values());
  },
});
