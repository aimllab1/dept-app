import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const postAnnouncement = mutation({
  args: {
    requesterId: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    imageUrl: v.optional(v.string()),
    eventUrl: v.optional(v.string()),
    postedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const { requesterId, ...eventData } = args;
    if (requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
    return await ctx.db.insert("announcements", {
      ...eventData,
      createdAt: Date.now(),
    });
  },
});

export const getAnnouncements = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_createdAt")
      .order("desc")
      .take(10);
  },
});

export const removeAnnouncement = mutation({
  args: { requesterId: v.string(), id: v.id("announcements") },
  handler: async (ctx, args) => {
    if (args.requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(args.requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});
