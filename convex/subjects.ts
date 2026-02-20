import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addSubject = mutation({
  args: {
    requesterId: v.string(),
    name: v.string(),
    code: v.string(),
    semester: v.number(),
    staffId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { requesterId, ...subjectData } = args;
    if (requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
    return await ctx.db.insert("subjects", subjectData);
  },
});

export const updateSubject = mutation({
  args: {
    requesterId: v.string(),
    id: v.id("subjects"),
    name: v.string(),
    code: v.string(),
    semester: v.number(),
    staffId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { requesterId, id, ...details } = args;
    if (requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
    await ctx.db.patch(id, details);
  },
});

export const removeSubject = mutation({
  args: { requesterId: v.string(), id: v.id("subjects") },
  handler: async (ctx, args) => {
    if (args.requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(args.requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
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

export const getSubjectsBySemester = query({
  args: { semester: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("subjects").withIndex("by_semester", q => q.eq("semester", args.semester)).collect();
  }
});
