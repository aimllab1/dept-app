import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});

export const getGlobalNotifications = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("notifications")
      .filter((q) => q.and(
        q.eq(q.field("userId"), undefined),
        q.eq(q.field("isRead"), false)
      ))
      .order("desc")
      .take(5);
  },
});

export const createNotification = mutation({
  args: {
    userId: v.optional(v.id("users")),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("announcement"), v.literal("mark"), v.literal("attendance")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});
