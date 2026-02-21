import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    password: v.optional(v.string()), 
    role: v.string(), // "hod", "ahod", "staff", "student"
    registrationNo: v.optional(v.string()),
    dob: v.optional(v.string()),
    mobileNo: v.optional(v.string()),
    parentMobileNo: v.optional(v.string()),
    email: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    address: v.optional(v.string()),
    startDate: v.optional(v.string()), // For attendance calculation start
  })
  .index("by_registrationNo", ["registrationNo"])
  .index("by_name", ["name"])
  .index("by_role", ["role"]),
  
  subjects: defineTable({
    name: v.string(),
    code: v.string(),
    semester: v.number(),
    staffId: v.optional(v.id("users")),
  })
  .index("by_semester", ["semester"])
  .index("by_staff", ["staffId"]),

  marks: defineTable({
    studentId: v.id("users"),
    subjectId: v.id("subjects"),
    testType: v.string(), 
    score: v.string(),
    updatedAt: v.number(),
  })
  .index("by_student_subject", ["studentId", "subjectId"])
  .index("by_updatedAt", ["updatedAt"]),

  attendance: defineTable({
    studentId: v.id("users"),
    subjectId: v.optional(v.id("subjects")),
    date: v.string(), 
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("leave"), v.literal("od"), v.literal("holiday")),
  })
  .index("by_student_date", ["studentId", "date"])
  .index("by_date", ["date"]),

  batches: defineTable({
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
  })
  .index("by_name", ["name"]),

  enrollments: defineTable({
    studentId: v.id("users"),
    batchId: v.id("batches"),
    semester: v.number(),
    status: v.union(v.literal("active"), v.literal("promoted")),
  })
  .index("by_studentId", ["studentId"]),

  results: defineTable({
    studentId: v.id("users"),
    semester: v.number(),
    gpa: v.string(), // Manually entered GPA
    grades: v.array(v.object({
      subjectId: v.id("subjects"),
      grade: v.string(), // O, A+, A, B+, B, C+, C, Arrear
    })),
    updatedAt: v.number(),
  })
  .index("by_student_semester", ["studentId", "semester"]),

  announcements: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.string(), 
    imageUrl: v.optional(v.string()),
    eventUrl: v.optional(v.string()),
    postedBy: v.string(),
    createdAt: v.number(),
  })
  .index("by_createdAt", ["createdAt"]),

  notifications: defineTable({
    userId: v.optional(v.id("users")), // Optional for global alerts
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("announcement"), v.literal("mark"), v.literal("attendance")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_createdAt", ["createdAt"]),
});
