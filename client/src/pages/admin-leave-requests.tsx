import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, Clock, CheckCircle, XCircle, Eye, Filter } from "lucide-react";
import type { Employee, LeaveRequest } from "@shared/schema";

type LeaveRequestWithEmployee = LeaveRequest & { employee: Employee };

export default function AdminLeaveRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState("");

  // Fetch all leave requests
  const { data: allLeaveRequests = [], isLoading } = useQuery<LeaveRequestWithEmployee[]>({
    queryKey: ["/api/leave-requests/all"],
    queryFn: async () => {
      // Since there's no /all endpoint, we'll fetch pending and need to create an endpoint
      // For now, let's use the pending endpoint and extend it
      const response = await fetch("/api/leave-requests/pending", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch leave requests");
      return await response.json();
    },
  });

  // Fetch pending leave requests
  const { data: pendingLeaveRequests = [] } = useQuery<LeaveRequestWithEmployee[]>({
    queryKey: ["/api/leave-requests/pending"],
    queryFn: async () => {
      const response = await fetch("/api/leave-requests/pending", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch pending leave requests");
      return await response.json();
    },
  });

  // Update leave request status mutation
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
      setIsDetailsDialogOpen(false);
      setSelectedRequest(null);
      setReviewComments("");
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/all"] });
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

  const handleQuickAction = (request: LeaveRequestWithEmployee, status: "approved" | "rejected") => {
    updateLeaveStatusMutation.mutate({ 
      id: request.id, 
      status,
      comments: status === "rejected" ? "Quick rejection via admin panel" : undefined
    });
  };

  const handleDetailedReview = (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    
    updateLeaveStatusMutation.mutate({ 
      id: selectedRequest.id, 
      status,
      comments: reviewComments.trim() || undefined
    });
  };

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Filter requests
  const filteredRequests = pendingLeaveRequests.filter(request => {
    const matchesSearch = 
      request.employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.leaveType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats
  const stats = {
    total: pendingLeaveRequests.length,
    pending: pendingLeaveRequests.filter(req => req.status === "pending").length,
    approved: pendingLeaveRequests.filter(req => req.status === "approved").length,
    rejected: pendingLeaveRequests.filter(req => req.status === "rejected").length,
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold">Leave Request Management</h1>
                <p className="text-muted-foreground">Review and manage employee leave requests.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-total-requests">{stats.total}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-requests">{stats.pending}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-approved-requests">{stats.approved}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600" data-testid="stat-rejected-requests">{stats.rejected}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Search & Filter</CardTitle>
                  <CardDescription>Find specific leave requests quickly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by employee name or reason..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                          data-testid="input-request-search"
                        />
                      </div>
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-32" data-testid="select-status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full md:w-32" data-testid="select-type-filter">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sick">Sick</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Requests List */}
              <Card>
                <CardHeader>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>
                    Showing {filteredRequests.length} of {pendingLeaveRequests.length} requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold">No leave requests found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pendingLeaveRequests.length === 0 
                          ? "No leave requests have been submitted yet." 
                          : "Try adjusting your search or filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredRequests.map((request) => (
                        <div key={request.id} className="border border-border rounded-lg p-6" data-testid={`card-request-${request.id}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {getInitials(request.employee.firstName, request.employee.lastName)}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold" data-testid={`text-employee-name-${request.id}`}>
                                  {request.employee.firstName} {request.employee.lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {request.employee.position} • {request.employee.department}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getLeaveTypeBadge(request.leaveType)}
                              {getStatusBadge(request.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Duration</p>
                              <p className="text-sm">
                                {format(new Date(request.startDate), "MMM dd")} - {format(new Date(request.endDate), "MMM dd, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">{request.daysRequested} days</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                              <p className="text-sm">{format(new Date(request.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Employee Balance</p>
                              <p className="text-sm">{request.employee.leaveBalance} days remaining</p>
                            </div>
                          </div>

                          {request.reason && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                              <p className="text-sm bg-secondary p-3 rounded-md">{request.reason}</p>
                            </div>
                          )}

                          {request.status === "pending" && (
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleQuickAction(request, "approved")}
                                  disabled={updateLeaveStatusMutation.isPending}
                                  data-testid={`button-quick-approve-${request.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Quick Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleQuickAction(request, "rejected")}
                                  disabled={updateLeaveStatusMutation.isPending}
                                  data-testid={`button-quick-reject-${request.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Quick Reject
                                </Button>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setReviewComments("");
                                    }}
                                    data-testid={`button-detailed-review-${request.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Detailed Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Review Leave Request</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm font-medium mb-2">Add Review Comments (Optional)</p>
                                      <Textarea
                                        placeholder="Add any comments about this decision..."
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        rows={3}
                                        data-testid="textarea-review-comments"
                                      />
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleDetailedReview("approved")}
                                        disabled={updateLeaveStatusMutation.isPending}
                                        data-testid="button-detailed-approve"
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleDetailedReview("rejected")}
                                        disabled={updateLeaveStatusMutation.isPending}
                                        data-testid="button-detailed-reject"
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}

                          {request.status !== "pending" && request.reviewComments && (
                            <div className="pt-4 border-t border-border">
                              <p className="text-sm font-medium text-muted-foreground mb-1">Review Comments</p>
                              <p className="text-sm bg-secondary p-3 rounded-md">{request.reviewComments}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}