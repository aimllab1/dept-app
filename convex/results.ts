import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addUniversityResult = mutation({
  args: {
    studentId: v.id("users"),
    semester: v.number(),
    gpa: v.string(),
    grades: v.array(v.object({
      subjectId: v.id("subjects"),
      grade: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("results")
      .withIndex("by_student_semester", (q) => q.eq("studentId", args.studentId).eq("semester", args.semester))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { gpa: args.gpa, grades: args.grades, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("results", { ...args, updatedAt: Date.now() });
    }
  },
});

export const getResultsForStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("results")
      .withIndex("by_student_semester", (q) => q.eq("studentId", args.studentId))
      .collect();
    
    return await Promise.all(results.map(async (r) => {
      const detailedGrades = await Promise.all(r.grades.map(async (g) => {
        const subject = await ctx.db.get(g.subjectId);
        return { ...g, subjectName: subject?.name, subjectCode: subject?.code };
      }));
      return { ...r, grades: detailedGrades };
    }));
  },
});
