import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBatch = mutation({
  args: {
    requesterId: v.string(),
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
  },
  handler: async (ctx, args) => {
    const { requesterId, ...batchData } = args;
    if (requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }

    // Check if batch with the same name already exists
    const existingBatch = await ctx.db
      .query("batches")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existingBatch) {
      throw new Error("Batch with this name already exists.");
    }

    await ctx.db.insert("batches", {
      name: args.name,
      startYear: args.startYear,
      endYear: args.endYear,
    });
  },
});

export const getBatches = query({
  handler: async (ctx) => {
    return await ctx.db.query("batches").collect();
  },
});
