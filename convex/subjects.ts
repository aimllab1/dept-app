import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addSubject = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    semester: v.number(),
    staffId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subjects", args);
  },
});

export const updateSubject = mutation({
  args: {
    id: v.id("subjects"),
    name: v.string(),
    code: v.string(),
    semester: v.number(),
    staffId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, ...details } = args;
    await ctx.db.patch(id, details);
  },
});

export const removeSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getSubjects = query({
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return await Promise.all(subjects.map(async (s) => {
      const staff = s.staffId ? await ctx.db.get(s.staffId) : null;
      return { ...s, staffName: staff?.name || "Unassigned" };
    }));
  },
});

export const getSubjectsByStaff = query({
  args: { staffId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subjects")
      .withIndex("by_staff", (q) => q.eq("staffId", args.staffId))
      .collect();
  },
});
