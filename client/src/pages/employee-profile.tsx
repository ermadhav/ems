import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Building, Calendar, Shield, Edit, Save, X } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function EmployeeProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    position: user?.position || "",
    department: user?.department || "",
  });

  // Fetch full user profile
  const { data: profile, isLoading } = useQuery<Employee>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return await response.json();
    },
    initialData: user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/employees/${profile?.id}`, data);
      return await response.json();
    },
    onSuccess: (updatedProfile) => {
      toast({ 
        title: "Success", 
        description: "Profile updated successfully" 
      });
      setIsEditing(false);
      // updateUser(updatedProfile); // This functionality would need to be implemented
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || "",
      position: profile?.position || "",
      department: profile?.department || "",
    });
    setIsEditing(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <Shield className="h-3 w-3 mr-1" />
        Administrator
      </Badge>
    ) : (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        Employee
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Profile not found</div>
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
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="text-muted-foreground">Manage your personal information and account settings.</p>
              </div>

              {/* Profile Header */}
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-6">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-medium text-primary">
                        {getInitials(profile.firstName, profile.lastName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold" data-testid="profile-name">
                            {profile.firstName} {profile.lastName}
                          </h2>
                          <p className="text-muted-foreground" data-testid="profile-position">
                            {profile.position} • {profile.department}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            {getRoleBadge(profile.role)}
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => setIsEditing(!isEditing)}
                          variant={isEditing ? "outline" : "default"}
                          data-testid="button-edit-profile"
                        >
                          {isEditing ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal" data-testid="tab-personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="employment" data-testid="tab-employment">Employment</TabsTrigger>
                  <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
                </TabsList>

                {/* Personal Information */}
                <TabsContent value="personal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Your basic personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          {isEditing ? (
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              data-testid="input-first-name"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-secondary rounded-md" data-testid="display-first-name">
                              {profile.firstName}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          {isEditing ? (
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              data-testid="input-last-name"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-secondary rounded-md" data-testid="display-last-name">
                              {profile.lastName}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          {isEditing ? (
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              data-testid="input-email"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-secondary rounded-md flex items-center" data-testid="display-email">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              {profile.email}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isEditing && (
                        <>
                          <Separator />
                          <div className="flex justify-end space-x-3">
                            <Button 
                              variant="outline" 
                              onClick={handleCancel}
                              data-testid="button-cancel-edit"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSave}
                              disabled={updateProfileMutation.isPending}
                              data-testid="button-save-profile"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Employment Information */}
                <TabsContent value="employment" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Employment Details</CardTitle>
                      <CardDescription>Your role and department information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="position">Position</Label>
                          {isEditing ? (
                            <Input
                              id="position"
                              value={formData.position}
                              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                              data-testid="input-position"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-secondary rounded-md" data-testid="display-position">
                              {profile.position}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          {isEditing ? (
                            <Input
                              id="department"
                              value={formData.department}
                              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                              data-testid="input-department"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-secondary rounded-md flex items-center" data-testid="display-department">
                              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                              {profile.department}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Employee Role</Label>
                          <div className="px-3 py-2 bg-secondary rounded-md">
                            {getRoleBadge(profile.role)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Leave Balance</Label>
                          <div className="px-3 py-2 bg-secondary rounded-md" data-testid="display-leave-balance">
                            {profile.leaveBalance} days remaining
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Join Date</Label>
                          <div className="px-3 py-2 bg-secondary rounded-md flex items-center" data-testid="display-join-date">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(new Date(profile.createdAt), "MMMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <>
                          <Separator />
                          <div className="flex justify-end space-x-3">
                            <Button 
                              variant="outline" 
                              onClick={handleCancel}
                              data-testid="button-cancel-employment"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSave}
                              disabled={updateProfileMutation.isPending}
                              data-testid="button-save-employment"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Account Settings */}
                <TabsContent value="account" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>Manage your account preferences and security</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium">Account Status</Label>
                          <div className="mt-1">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Active Account
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your account is active and in good standing
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label className="text-base font-medium">Password</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Last updated: Never
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" disabled>
                            Change Password
                          </Button>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label className="text-base font-medium">Data Export</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Download a copy of your personal data
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" disabled>
                            Request Data Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}