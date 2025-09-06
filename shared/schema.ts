import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["employee", "admin"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);
export const leaveTypeEnum = pgEnum("leave_type", ["sick", "vacation", "personal", "emergency"]);

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  role: roleEnum("role").default("employee").notNull(),
  leaveBalance: integer("leave_balance").default(20).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  hoursWorked: integer("hours_worked").default(0),
  status: text("status").default("present").notNull(), // present, absent, on_break
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("pending").notNull(),
  reviewedBy: varchar("reviewed_by").references(() => employees.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  daysRequested: integer("days_requested").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const employeesRelations = relations(employees, ({ many, one }) => ({
  attendance: many(attendance),
  leaveRequests: many(leaveRequests),
  reviewedLeaves: many(leaveRequests, { relationName: "reviewer" }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  employee: one(employees, {
    fields: [attendance.employeeId],
    references: [employees.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  reviewer: one(employees, {
    fields: [leaveRequests.reviewedBy],
    references: [employees.id],
    relationName: "reviewer",
  }),
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewComments: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateLeaveStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewComments: z.string().optional(),
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type UpdateLeaveStatus = z.infer<typeof updateLeaveStatusSchema>;
