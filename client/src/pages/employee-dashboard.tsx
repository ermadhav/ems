import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MetricCard from "@/components/metric-card";
import LeaveRequestForm from "@/components/leave-request-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Calendar, Coffee, Hourglass } from "lucide-react";
import type { Attendance, LeaveRequest } from "@shared/schema";


async function handleCheckIn() {
  await fetch("/api/attendance/checkin", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's attendance
  const { data: todayAttendance } = useQuery<Attendance | null>({
    queryKey: ["/api/attendance/my"],
    queryFn: async () => {
      const response = await fetch("/api/attendance/my", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return null;
      return await response.json();
    },
  });

  // Fetch leave requests
  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/my"],
    queryFn: async () => {
      const response = await fetch("/api/leave-requests/my", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      return await response.json();
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attendance/checkin");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checked in successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attendance/checkout");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checked out successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isCheckedIn = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;
  const isCheckedOut = todayAttendance?.checkOutTime;
  const pendingLeaves = leaveRequests.filter(leave => leave.status === "pending").length;
  const hoursToday = todayAttendance?.hoursWorked || 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="relative z-0 flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold">
                  Welcome back, <span data-testid="text-employee-name">{user?.firstName}</span>!
                </h1>
                <p className="text-muted-foreground">Here's what's happening with your account today.</p>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="Today's Status"
                  value={isCheckedOut ? "Completed" : isCheckedIn ? "Present" : "Not Checked In"}
                  icon={Check}
                  iconColor="text-accent"
                  valueColor={isCheckedOut ? "text-accent" : isCheckedIn ? "text-accent" : "text-muted-foreground"}
                />
                
                <MetricCard
                  title="Hours Today"
                  value={hoursToday}
                  icon={Clock}
                  iconColor="text-primary"
                />
                
                <MetricCard
                  title="Leave Balance"
                  value={user?.leaveBalance || 0}
                  icon={Calendar}
                  iconColor="text-yellow-600"
                />
                
                <MetricCard
                  title="Pending Requests"
                  value={pendingLeaves}
                  icon={Hourglass}
                  iconColor="text-yellow-600"
                  valueColor="text-yellow-600"
                />
              </div>

              {/* Attendance and Leave Request Forms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Quick Check-in */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Check-in</h3>
                  <div className="space-y-4">
                    {todayAttendance ? (
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div>
                          <p className="font-medium">Check-in Time</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-checkin-time">
                            {todayAttendance.checkInTime 
                              ? format(new Date(todayAttendance.checkInTime), "hh:mm a")
                              : "Not checked in"
                            }
                          </p>
                          {todayAttendance.checkOutTime && (
                            <>
                              <p className="font-medium mt-2">Check-out Time</p>
                              <p className="text-sm text-muted-foreground" data-testid="text-checkout-time">
                                {format(new Date(todayAttendance.checkOutTime), "hh:mm a")}
                              </p>
                            </>
                          )}
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100" data-testid="status-present">
                          {isCheckedOut ? "Completed" : "Present"}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div>
                          <p className="font-medium">Not Checked In</p>
                          <p className="text-sm text-muted-foreground">Click check-in to start your day</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      {!isCheckedIn && !isCheckedOut && (
                        <Button 
                          onClick={() => checkInMutation.mutate()}
                          disabled={checkInMutation.isPending}
                          className="flex-1"
                          data-testid="button-checkin"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {checkInMutation.isPending ? "Checking in..." : "Check In"}
                        </Button>
                      )}
                      
                      {isCheckedIn && (
                        <Button 
                          onClick={() => checkOutMutation.mutate()}
                          disabled={checkOutMutation.isPending}
                          className="flex-1"
                          data-testid="button-checkout"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {checkOutMutation.isPending ? "Checking out..." : "Check Out"}
                        </Button>
                      )}
                      
                      <Button variant="outline" className="flex-1" data-testid="button-break">
                        <Coffee className="mr-2 h-4 w-4" />
                        Break
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Leave Request Form */}
                <LeaveRequestForm />
              </div>

              {/* Recent Leave Requests */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Leave Requests</h3>
                {leaveRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-requests">
                    No leave requests found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dates</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Days</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {leaveRequests.map((leave) => (
                          <tr key={leave.id} data-testid={`row-leave-${leave.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize">
                              {leave.leaveType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {leave.daysRequested}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(leave.status)}
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
