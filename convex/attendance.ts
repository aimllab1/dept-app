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
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("leave"), v.literal("od")),
  },
  handler: async (ctx, args) => {
    const existingRecord = await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) =>
        q.eq("studentId", args.studentId).eq("date", args.date)
      )
      .unique();

    if (existingRecord) {
      await ctx.db.patch(existingRecord._id, { status: args.status });
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
    
    if (args.month) {
      return await q
        .filter(q => 
          q.and(
            q.gte(q.field("date"), `${args.month}-01`),
            q.lte(q.field("date"), `${args.month}-31`)
          )
        )
        .collect();
    }
    
    return await q.collect();
  },
});

export const getAttendanceByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    // De-duplicate to only keep the latest record for each student
    const latestMap = new Map();
    records.sort((a, b) => a._creationTime - b.creationTime); // Process in order of creation
    records.forEach(r => {
      latestMap.set(r.studentId, r);
    });
    
    return Array.from(latestMap.values());
  },
});
