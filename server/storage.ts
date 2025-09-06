import { 
  employees, 
  attendance, 
  leaveRequests,
  type Employee, 
  type InsertEmployee,
  type Attendance,
  type InsertAttendance,
  type LeaveRequest,
  type InsertLeaveRequest,
  type UpdateLeaveStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  getAllEmployees(): Promise<Employee[]>;
  
  // Attendance operations
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getEmployeeAttendance(employeeId: string, date?: Date): Promise<Attendance | undefined>;
  getTodayAttendance(): Promise<(Attendance & { employee: Employee })[]>;
  updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined>;
  
  // Leave request operations
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<(LeaveRequest & { employee: Employee })[]>;
  updateLeaveRequestStatus(id: string, updates: UpdateLeaveStatus & { reviewedBy: string }): Promise<LeaveRequest | undefined>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    pendingLeaves: number;
    departments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values({
        ...employee,
        updatedAt: new Date(),
      })
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        ...employee,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee || undefined;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount > 0;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isActive, true));
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return newAttendance;
  }

  async getEmployeeAttendance(employeeId: string, date?: Date): Promise<Attendance | undefined> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [attendanceRecord] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, employeeId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      );
    return attendanceRecord || undefined;
  }

  async getTodayAttendance(): Promise<(Attendance & { employee: Employee })[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        hoursWorked: attendance.hoursWorked,
        status: attendance.status,
        createdAt: attendance.createdAt,
        employee: employees,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeId, employees.id))
      .where(
        and(
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      );
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined> {
    const [updatedAttendance] = await db
      .update(attendance)
      .set(updates)
      .where(eq(attendance.id, id))
      .returning();
    return updatedAttendance || undefined;
  }

  async createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const [newLeaveRequest] = await db
      .insert(leaveRequests)
      .values({
        ...leaveRequest,
        updatedAt: new Date(),
      })
      .returning();
    return newLeaveRequest;
  }

  async getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, employeeId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getPendingLeaveRequests(): Promise<(LeaveRequest & { employee: Employee })[]> {
    return await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        reviewedBy: leaveRequests.reviewedBy,
        reviewedAt: leaveRequests.reviewedAt,
        reviewComments: leaveRequests.reviewComments,
        daysRequested: leaveRequests.daysRequested,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        employee: employees,
      })
      .from(leaveRequests)
      .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .where(eq(leaveRequests.status, "pending"))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async updateLeaveRequestStatus(id: string, updates: UpdateLeaveStatus & { reviewedBy: string }): Promise<LeaveRequest | undefined> {
    const [updatedLeaveRequest] = await db
      .update(leaveRequests)
      .set({
        ...updates,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updatedLeaveRequest || undefined;
  }

  async getDashboardStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    pendingLeaves: number;
    departments: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalEmployeesResult] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.isActive, true));

    const [presentTodayResult] = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay),
          eq(attendance.status, "present")
        )
      );

    const [pendingLeavesResult] = await db
      .select({ count: count() })
      .from(leaveRequests)
      .where(eq(leaveRequests.status, "pending"));

    const departmentsResult = await db
      .selectDistinct({ department: employees.department })
      .from(employees)
      .where(eq(employees.isActive, true));

    return {
      totalEmployees: totalEmployeesResult.count,
      presentToday: presentTodayResult.count,
      pendingLeaves: pendingLeavesResult.count,
      departments: departmentsResult.length,
    };
  }
}

export const storage = new DatabaseStorage();
