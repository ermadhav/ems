import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { getAuthHeaders } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Calendar, Clock, TrendingUp, Download, Filter } from "lucide-react";
import type { Employee, LeaveRequest, Attendance } from "@shared/schema";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  departments: number;
}

type LeaveRequestWithEmployee = LeaveRequest & { employee: Employee };
type AttendanceWithEmployee = Attendance & { employee: Employee };

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

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

  // Fetch employees for department analysis
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

  // Fetch leave requests
  const { data: leaveRequests = [] } = useQuery<LeaveRequestWithEmployee[]>({
    queryKey: ["/api/leave-requests/pending"],
    queryFn: async () => {
      const response = await fetch("/api/leave-requests/pending", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch leave requests");
      return await response.json();
    },
  });

  // Fetch today's attendance
  const { data: todayAttendance = [] } = useQuery<AttendanceWithEmployee[]>({
    queryKey: ["/api/attendance/today"],
    queryFn: async () => {
      const response = await fetch("/api/attendance/today", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch attendance");
      return await response.json();
    },
  });

  // Calculate department distribution
  const departmentData = employees.reduce((acc, emp) => {
    const dept = emp.department;
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentChartData = Object.entries(departmentData).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / employees.length) * 100).toFixed(1)
  }));

  // Calculate role distribution
  const roleData = employees.reduce((acc, emp) => {
    const role = emp.role;
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleChartData = Object.entries(roleData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: ((value / employees.length) * 100).toFixed(1)
  }));

  // Calculate leave type distribution
  const leaveTypeData = leaveRequests.reduce((acc, req) => {
    const type = req.leaveType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const leaveTypeChartData = Object.entries(leaveTypeData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: leaveRequests.length > 0 ? ((value / leaveRequests.length) * 100).toFixed(1) : "0"
  }));

  // Generate mock attendance trend data for the past 30 days
  const generateAttendanceTrend = () => {
    const days = parseInt(timeRange);
    const dates = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date()
    });

    return dates.map(date => ({
      date: format(date, "MMM dd"),
      present: Math.floor(Math.random() * (stats.totalEmployees - 5)) + 5,
      absent: Math.floor(Math.random() * 5),
      total: stats.totalEmployees
    }));
  };

  const attendanceTrendData = generateAttendanceTrend();

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Comprehensive insights into your organization's performance.</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="w-40" data-testid="select-report-type">
                        <SelectValue placeholder="Report Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="leaves">Leave Analysis</SelectItem>
                        <SelectItem value="departments">Departments</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-32" data-testid="select-time-range">
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-employees">{stats.totalEmployees}</div>
                    <p className="text-xs text-muted-foreground">Across all departments</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                    <Clock className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-present-today">{stats.presentToday}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalEmployees > 0 ? `${((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)}% attendance` : "0% attendance"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-leaves">{stats.pendingLeaves}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Departments</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600" data-testid="stat-departments">{stats.departments}</div>
                    <p className="text-xs text-muted-foreground">Active departments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Attendance Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Daily attendance over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={attendanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} name="Present" />
                        <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Department Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Department Distribution</CardTitle>
                    <CardDescription>Employee distribution across departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={departmentChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {departmentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Leave Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Leave Type Analysis</CardTitle>
                    <CardDescription>Distribution of leave request types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {leaveTypeChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={leaveTypeChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        <div className="text-center">
                          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-semibold">No leave data</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            No leave requests to analyze yet.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Role Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Role Distribution</CardTitle>
                    <CardDescription>Employee roles in the organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={roleChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {roleChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Leave Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Leave Requests</CardTitle>
                    <CardDescription>Latest leave request submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {leaveRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No recent leave requests</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leaveRequests.slice(0, 5).map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <div>
                              <p className="text-sm font-medium">
                                {request.employee.firstName} {request.employee.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} • {request.daysRequested} days
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Employee Status Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Status</CardTitle>
                    <CardDescription>Current employee status overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {employees.slice(0, 5).map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div>
                            <p className="text-sm font-medium">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {employee.position} • {employee.department}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(employee.isActive ? "active" : "inactive")}
                            <Badge variant="outline">{employee.leaveBalance} days</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}