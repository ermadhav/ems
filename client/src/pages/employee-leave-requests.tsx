import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
// LeaveRequestForm will be created inline since the existing one has different interface
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, CheckCircle, XCircle, Hourglass } from "lucide-react";
import type { LeaveRequest } from "@shared/schema";

const leaveRequestSchema = z.object({
  leaveType: z.enum(["sick", "vacation", "personal", "emergency"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

function LeaveRequestFormInline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: "vacation",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: LeaveRequestFormData) => {
      const response = await apiRequest("POST", "/api/leave-requests", {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Leave request submitted successfully" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeaveRequestFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="leaveType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Reason for leave..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </Form>
  );
}

export default function EmployeeLeaveRequests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch user's leave requests
  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/my"],
    queryFn: async () => {
      const response = await fetch("/api/leave-requests/my", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch leave requests");
      return await response.json();
    },
  });

  // Submit leave request mutation
  const submitLeaveRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/leave-requests", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Leave request submitted successfully" 
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  const handleSubmitLeaveRequest = (data: any) => {
    submitLeaveRequestMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Hourglass className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors = {
      sick: "bg-red-50 text-red-700 border-red-200",
      vacation: "bg-blue-50 text-blue-700 border-blue-200",
      personal: "bg-purple-50 text-purple-700 border-purple-200",
      emergency: "bg-orange-50 text-orange-700 border-orange-200",
    };
    
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  // Calculate stats
  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(req => req.status === "pending").length,
    approved: leaveRequests.filter(req => req.status === "approved").length,
    rejected: leaveRequests.filter(req => req.status === "rejected").length,
    balance: user?.leaveBalance || 0,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading leave requests...</div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Leave Requests</h1>
                    <p className="text-muted-foreground">Submit and track your leave requests.</p>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-new-leave-request">
                        <Plus className="h-4 w-4 mr-2" />
                        New Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Submit Leave Request</DialogTitle>
                      </DialogHeader>
                      <LeaveRequestFormInline />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
                    <Calendar className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-leave-balance">
                      {stats.balance}
                    </div>
                    <p className="text-xs text-muted-foreground">days remaining</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-requests">
                      {stats.total}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-requests">
                      {stats.pending}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-approved-requests">
                      {stats.approved}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600" data-testid="stat-rejected-requests">
                      {stats.rejected}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Requests List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Leave Requests</CardTitle>
                  <CardDescription>
                    {leaveRequests.length === 0 
                      ? "You haven't submitted any leave requests yet." 
                      : `Showing ${leaveRequests.length} leave request${leaveRequests.length !== 1 ? 's' : ''}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leaveRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No leave requests</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Get started by submitting your first leave request.
                      </p>
                      <div className="mt-6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button data-testid="button-first-leave-request">
                              <Plus className="h-4 w-4 mr-2" />
                              Submit Leave Request
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Submit Leave Request</DialogTitle>
                            </DialogHeader>
                            <LeaveRequestFormInline />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leaveRequests.map((request) => (
                        <div key={request.id} className="border border-border rounded-lg p-6" data-testid={`card-request-${request.id}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                {getLeaveTypeBadge(request.leaveType)}
                                {getStatusBadge(request.status)}
                              </div>
                              <h3 className="text-lg font-semibold">
                                {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Submitted on {format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{request.daysRequested}</p>
                              <p className="text-sm text-muted-foreground">days</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                              <p className="text-sm">{format(new Date(request.startDate), "EEEE, MMM dd, yyyy")}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">End Date</p>
                              <p className="text-sm">{format(new Date(request.endDate), "EEEE, MMM dd, yyyy")}</p>
                            </div>
                          </div>

                          {request.reason && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                              <p className="text-sm bg-secondary p-3 rounded-md">{request.reason}</p>
                            </div>
                          )}

                          {request.status !== "pending" && (
                            <div className="pt-4 border-t border-border">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {request.status === "approved" ? "Approved" : "Rejected"}
                                    {request.reviewedAt && ` on ${format(new Date(request.reviewedAt), "MMM dd, yyyy")}`}
                                  </p>
                                  {request.reviewComments && (
                                    <p className="text-sm mt-1 bg-secondary p-3 rounded-md">
                                      {request.reviewComments}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leave Policy Information */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Leave Policy</CardTitle>
                  <CardDescription>Important information about leave requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Annual Leave Allocation</p>
                        <p className="text-sm text-muted-foreground">You have {stats.balance} days remaining for this year</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Advance Notice</p>
                        <p className="text-sm text-muted-foreground">Submit requests at least 2 weeks in advance for planned leave</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Approval Process</p>
                        <p className="text-sm text-muted-foreground">Requests are reviewed by your supervisor and HR team</p>
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