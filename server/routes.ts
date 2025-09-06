import { response, type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertEmployeeSchema, 
  insertAttendanceSchema, 
  insertLeaveRequestSchema,
  updateLeaveStatusSchema
} from "@shared/schema";
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  authenticateToken, 
  requireRole,
  type AuthRequest 
} from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const employee = await storage.getEmployeeByEmail(email);
      if (!employee) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await comparePassword(password, employee.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(employee);
      const { password: _, ...employeeData } = employee;

      res.json({ 
        token, 
        employee: employeeData 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const employee = await storage.getEmployee(req.user!.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const { password: _, ...employeeData } = employee;
      res.json(employeeData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Employee routes
  app.get("/api/employees", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const employeesWithoutPasswords = employees.map(({ password, ...emp }) => emp);
      res.json(employeesWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/employees", authenticateToken, requireRole(["admin"]), async (req, res) => {
    
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const hashedPassword = await hashPassword(employeeData.password);
      
      const employee = await storage.createEmployee({
        ...employeeData,
        password: hashedPassword,
      });

      const { password: _, ...employeeResponse } = employee;
      res.status(201).json(employeeResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      const employee = await storage.updateEmployee(id, updateData);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const { password: _, ...employeeResponse } = employee;
      res.json(employeeResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEmployee(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attendance routes
  app.post("/api/attendance/checkin", authenticateToken, async (req: AuthRequest, res) => {
    console.log("Hello", authenticateToken)
    try {
      const employeeId = req.user!.id;
      const today = new Date();
      
      // Check if already checked in today
      const existingAttendance = await storage.getEmployeeAttendance(employeeId, today);
      if (existingAttendance) {
        return res.status(400).json({ message: "Already checked in today" });
      }

      const attendance = await storage.createAttendance({
        employeeId,
        date: today,
        checkInTime: today,
        status: "present",
      });

      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attendance/checkout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const employeeId = req.user!.id;
      const today = new Date();
      
      const existingAttendance = await storage.getEmployeeAttendance(employeeId, today);
      if (!existingAttendance) {
        return res.status(400).json({ message: "No check-in found for today" });
      }

      if (existingAttendance.checkOutTime) {
        return res.status(400).json({ message: "Already checked out today" });
      }

      const checkOutTime = new Date();
      const hoursWorked = existingAttendance.checkInTime 
        ? Math.round((checkOutTime.getTime() - existingAttendance.checkInTime.getTime()) / (1000 * 60 * 60) * 10) / 10
        : 0;

      const updatedAttendance = await storage.updateAttendance(existingAttendance.id, {
        checkOutTime,
        hoursWorked,
      });

      res.json(updatedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance/today", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const todayAttendance = await storage.getTodayAttendance();
      res.json(todayAttendance);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance/my", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const employeeId = req.user!.id;
      const today = new Date();
      const attendance = await storage.getEmployeeAttendance(employeeId, today);
      res.json(attendance || null);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Leave request routes
  app.post("/api/leave-requests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const leaveData = insertLeaveRequestSchema.parse({
        ...req.body,
        employeeId: req.user!.id,
      });

      // Calculate days requested
      const startDate = new Date(leaveData.startDate);
      const endDate = new Date(leaveData.endDate);
      const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const leaveRequest = await storage.createLeaveRequest({
        ...leaveData,
        daysRequested,
      });

      res.status(201).json(leaveRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid leave request data" });
    }
  });

  app.get("/api/leave-requests/my", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const employeeId = req.user!.id;
      const leaveRequests = await storage.getEmployeeLeaveRequests(employeeId);
      res.json(leaveRequests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leave-requests/pending", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const pendingRequests = await storage.getPendingLeaveRequests();
      res.json(pendingRequests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/leave-requests/:id/status", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const statusUpdate = updateLeaveStatusSchema.parse(req.body);
      
      const updatedRequest = await storage.updateLeaveRequestStatus(id, {
        ...statusUpdate,
        reviewedBy: req.user!.id,
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid status update data" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
