import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const postMark = mutation({
  args: {
    studentId: v.id("users"),
    subjectId: v.id("subjects"),
    testType: v.string(),
    score: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("marks")
      .withIndex("by_student_subject", (q) => q.eq("studentId", args.studentId).eq("subjectId", args.subjectId))
      .filter(q => q.eq(q.field("testType"), args.testType))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { score: args.score, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("marks", { ...args, updatedAt: Date.now() });
    }
  },
});

export const postBulkMarks = mutation({
  args: {
    subjectId: v.id("subjects"),
    testType: v.string(),
    marks: v.array(v.object({ studentId: v.id("users"), score: v.string() })),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    for (const entry of args.marks) {
      const existing = await ctx.db
        .query("marks")
        .withIndex("by_student_subject", (q) => q.eq("studentId", entry.studentId).eq("subjectId", args.subjectId))
        .filter(q => q.eq(q.field("testType"), args.testType))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { score: entry.score, updatedAt: timestamp });
      } else {
        await ctx.db.insert("marks", { 
          studentId: entry.studentId, 
          subjectId: args.subjectId, 
          testType: args.testType, 
          score: entry.score, 
          updatedAt: timestamp 
        });
      }
    }
  },
});

export const getMarksBySubjectAndTest = query({
  args: { subjectId: v.id("subjects"), testType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marks")
      .filter(q => 
        q.and(
          q.eq(q.field("subjectId"), args.subjectId),
          q.eq(q.field("testType"), args.testType)
        )
      )
      .collect();
  },
});

export const getMarksForStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_student_subject", (q) => q.eq("studentId", args.studentId))
      .collect();
    
    return await Promise.all(marks.map(async (m) => {
      const subject = await ctx.db.get(m.subjectId);
      return { ...m, subjectName: subject?.name, subjectCode: subject?.code };
    }));
  },
});

export const getRecentUpdates = query({
  handler: async (ctx) => {
    const recent = await ctx.db
      .query("marks")
      .withIndex("by_updatedAt")
      .order("desc")
      .take(10);

    const updates = await Promise.all(recent.map(async (m) => {
      const subject = await ctx.db.get(m.subjectId);
      if (!subject) return null;
      
      // Shorten Subject Name (First letter of each word)
      const shortenedSubject = subject.name.split(' ').map(w => w[0]).join('').toUpperCase();
      // Shorten Test Type
      const shortenedTest = m.testType.replace('Slip Test', 'ST').replace('Internal', 'INT').replace('Model Exam', 'Model');
      
      return {
        id: m._id,
        display: `${shortenedSubject} ${shortenedTest}`,
        time: m.updatedAt,
      };
    }));

    // Filter out duplicates of same subject/test updates
    return updates.filter((v, i, a) => v && a.findIndex(t => t?.display === v?.display) === i).slice(0, 5);
  },
});
