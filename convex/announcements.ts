import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const postAnnouncement = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.string(),
    imageUrl: v.optional(v.string()),
    postedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("announcements", {
      ...args,
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
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
