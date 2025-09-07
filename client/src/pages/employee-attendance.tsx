import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, LogOut, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Attendance } from "@shared/schema";

export default function EmployeeAttendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch today's attendance
  const { data: todayAttendance, isLoading } = useQuery<Attendance | null>({
    queryKey: ["/api/attendance/my"],
    queryFn: async () => {
      const response = await fetch("/api/attendance/my", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch attendance");
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
        title: "Checked In", 
        description: "You have successfully checked in for today." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
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
        title: "Checked Out", 
        description: "You have successfully checked out for today." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  const getCurrentTime = () => {
    return format(new Date(), "hh:mm a");
  };

  const getWorkingHours = () => {
    if (!todayAttendance?.checkInTime) return "0h 0m";
    
    const checkIn = new Date(todayAttendance.checkInTime);
    const checkOut = todayAttendance.checkOutTime 
      ? new Date(todayAttendance.checkOutTime) 
      : new Date();
    
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getStatusInfo = () => {
    if (!todayAttendance) {
      return {
        status: "Not Checked In",
        color: "text-muted-foreground",
        icon: AlertTriangle,
        bgColor: "bg-yellow-50 border-yellow-200",
        canCheckIn: true,
        canCheckOut: false,
      };
    }

    if (!todayAttendance.checkOutTime) {
      return {
        status: "Checked In",
        color: "text-green-600",
        icon: CheckCircle2,
        bgColor: "bg-green-50 border-green-200",
        canCheckIn: false,
        canCheckOut: true,
      };
    }

    return {
      status: "Day Complete",
      color: "text-blue-600",
      icon: CheckCircle2,
      bgColor: "bg-blue-50 border-blue-200",
      canCheckIn: false,
      canCheckOut: false,
    };
  };

  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading attendance...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="relative z-0 flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold">Attendance</h1>
                <p className="text-muted-foreground">Track your daily attendance and working hours.</p>
              </div>

              {/* Current Status Card */}
              <Card className={`mb-8 ${statusInfo.bgColor}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <statusInfo.icon className={`h-6 w-6 ${statusInfo.color}`} />
                      <div>
                        <CardTitle className={statusInfo.color}>{statusInfo.status}</CardTitle>
                        <CardDescription>
                          Today, {format(new Date(), "EEEE, MMMM dd, yyyy")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {getCurrentTime()}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Time</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Check In Time</p>
                      <p className="text-lg font-semibold" data-testid="text-checkin-time">
                        {todayAttendance?.checkInTime 
                          ? format(new Date(todayAttendance.checkInTime), "hh:mm a")
                          : "--:--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Check Out Time</p>
                      <p className="text-lg font-semibold" data-testid="text-checkout-time">
                        {todayAttendance?.checkOutTime 
                          ? format(new Date(todayAttendance.checkOutTime), "hh:mm a")
                          : "--:--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Working Hours</p>
                      <p className="text-lg font-semibold" data-testid="text-working-hours">
                        {getWorkingHours()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <Button
                      onClick={() => checkInMutation.mutate()}
                      disabled={!statusInfo.canCheckIn || checkInMutation.isPending}
                      className="flex-1"
                      data-testid="button-checkin"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Check In
                    </Button>
                    <Button
                      onClick={() => checkOutMutation.mutate()}
                      disabled={!statusInfo.canCheckOut || checkOutMutation.isPending}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-checkout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Check Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Today's Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="status-badge">
                      <Badge className={statusInfo.color.includes('green') ? 'bg-green-100 text-green-800' : 
                                       statusInfo.color.includes('blue') ? 'bg-blue-100 text-blue-800' :
                                       'bg-yellow-100 text-yellow-800'}>
                        {statusInfo.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hours Today</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="hours-today">
                      {getWorkingHours()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target: 8h 0m
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Break Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0h 0m</div>
                    <p className="text-xs text-muted-foreground">
                      No breaks recorded
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common attendance-related actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h3 className="font-semibold mb-2">Need Help?</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Contact HR if you're having trouble with attendance tracking or need to report issues.
                      </p>
                      <Button variant="outline" size="sm">
                        Contact HR
                      </Button>
                    </div>
                    
                    <div className="p-4 border border-border rounded-lg">
                      <h3 className="font-semibold mb-2">View History</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Check your attendance history and working hours for previous days.
                      </p>
                      <Button variant="outline" size="sm" disabled>
                        View History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Guidelines */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Attendance Guidelines</CardTitle>
                  <CardDescription>Important information about attendance policies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Standard Working Hours</p>
                        <p className="text-sm text-muted-foreground">8 hours per day, Monday to Friday</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Check-in Window</p>
                        <p className="text-sm text-muted-foreground">Please check in within 15 minutes of your start time</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Late Check-in</p>
                        <p className="text-sm text-muted-foreground">Late arrivals should be reported to your supervisor</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}