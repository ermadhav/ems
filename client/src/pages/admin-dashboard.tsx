import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MetricCard from "@/components/metric-card";
import EmployeeForm from "@/components/employee-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Check, Hourglass, Building, Plus, Edit, Trash2 } from "lucide-react";
import type { Employee, LeaveRequest, Attendance } from "@shared/schema";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  departments: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  // Fetch dashboard stats
  const { data: stats = { totalEmployees: 0, presentToday: 0, pendingLeaves: 0, departments: 0 } } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return await response.json();
    },
  });

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      return await response.json();
    },
  });

  // Fetch pending leave requests
  const { data: pendingLeaves = [] } = useQuery<(LeaveRequest & { employee: Employee })[]>({
    queryKey: ["/api/leave-requests/pending"],
    queryFn: async () => {
      const response = await fetch("/api/leave-requests/pending", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch pending leaves");
      return await response.json();
    },
  });

  // Fetch today's attendance
  const { data: todayAttendance = [] } = useQuery<(Attendance & { employee: Employee })[]>({
    queryKey: ["/api/attendance/today"],
    queryFn: async () => {
      const response = await fetch("/api/attendance/today", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch attendance");
      return await response.json();
    },
  });

  // Employee mutations
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/employees", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Employee created successfully" });
      setIsEmployeeDialogOpen(false);
      setSelectedEmployee(null);
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/employees/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Employee updated successfully" });
      setIsEmployeeDialogOpen(false);
      setSelectedEmployee(null);
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/employees/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Employee deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  // Leave request mutations
  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: string; status: "approved" | "rejected"; comments?: string }) => {
      const response = await apiRequest("PUT", `/api/leave-requests/${id}/status`, {
        status,
        reviewComments: comments,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Leave request updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update leave request",
        variant: "destructive",
      });
    },
  });

  const handleEmployeeSubmit = (data: any) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case "present":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Present</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="relative z-0 flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your organization's workforce and operations.</p>
              </div>

              {/* Admin Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="Total Employees"
                  value={stats.totalEmployees}
                  icon={Users}
                  iconColor="text-primary"
                />
                
                <MetricCard
                  title="Present Today"
                  value={stats.presentToday}
                  icon={Check}
                  iconColor="text-accent"
                  valueColor="text-accent"
                />
                
                <MetricCard
                  title="Pending Leaves"
                  value={stats.pendingLeaves}
                  icon={Hourglass}
                  iconColor="text-yellow-600"
                  valueColor="text-yellow-600"
                />
                
                <MetricCard
                  title="Departments"
                  value={stats.departments}
                  icon={Building}
                  iconColor="text-purple-600"
                />
              </div>

              {/* Employee Management & Leave Requests */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Employee Management */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Employee Management</h3>
                    <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => setSelectedEmployee(null)}
                          data-testid="button-add-employee"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Employee
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedEmployee ? "Edit Employee" : "Add Employee"}
                          </DialogTitle>
                        </DialogHeader>
                        <EmployeeForm
                          employee={selectedEmployee || undefined}
                          onSubmit={handleEmployeeSubmit}
                          onCancel={() => {
                            setIsEmployeeDialogOpen(false);
                            setSelectedEmployee(null);
                          }}
                          isLoading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-3">
                    {employees.slice(0, 5).map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {getInitials(employee.firstName, employee.lastName)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium" data-testid={`text-employee-${employee.id}`}>
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{employee.position}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsEmployeeDialogOpen(true);
                            }}
                            data-testid={`button-edit-${employee.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            data-testid={`button-delete-${employee.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Leave Requests */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Pending Leave Requests</h3>
                  <div className="space-y-4">
                    {pendingLeaves.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4" data-testid="text-no-pending-leaves">
                        No pending leave requests
                      </p>
                    ) : (
                      pendingLeaves.map((leave) => (
                        <div key={leave.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">
                                {leave.employee.firstName} {leave.employee.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {leave.leaveType} • {leave.daysRequested} days
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                            {getStatusBadge(leave.status)}
                          </div>
                          {leave.reason && (
                            <p className="text-sm text-muted-foreground mb-3">{leave.reason}</p>
                          )}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-accent text-accent-foreground hover:bg-accent/90"
                              onClick={() => updateLeaveStatusMutation.mutate({ 
                                id: leave.id, 
                                status: "approved" 
                              })}
                              disabled={updateLeaveStatusMutation.isPending}
                              data-testid={`button-approve-${leave.id}`}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateLeaveStatusMutation.mutate({ 
                                id: leave.id, 
                                status: "rejected" 
                              })}
                              disabled={updateLeaveStatusMutation.isPending}
                              data-testid={`button-reject-${leave.id}`}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Today's Attendance */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">Today's Attendance</h3>
                {todayAttendance.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-attendance">
                    No attendance records for today
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Check In</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Check Out</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {todayAttendance.map((record) => (
                          <tr key={record.id} data-testid={`row-attendance-${record.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-xs font-medium text-primary">
                                    {getInitials(record.employee.firstName, record.employee.lastName)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {record.employee.firstName} {record.employee.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{record.employee.position}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {record.employee.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {record.checkInTime ? format(new Date(record.checkInTime), "hh:mm a") : "--"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {record.checkOutTime ? format(new Date(record.checkOutTime), "hh:mm a") : "--"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(record.checkOutTime ? "completed" : record.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
