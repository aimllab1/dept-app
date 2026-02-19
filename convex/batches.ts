import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createBatch = mutation({
  args: {
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
    loggedInUserRole: v.string(), // For authorization
  },
  handler: async (ctx, args) => {
    // Authorization check: Only HODs can create batches
    if (args.loggedInUserRole !== "hod") {
      throw new Error("Only HODs can create new batches.");
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
