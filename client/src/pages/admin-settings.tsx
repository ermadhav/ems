import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Users, Bell, Database, Download } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // System Settings State
  const [defaultLeaveBalance, setDefaultLeaveBalance] = useState("20");
  const [workingHours, setWorkingHours] = useState("8");
  const [timeZone, setTimeZone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MM/dd/yyyy");
  
  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leaveRequestNotifications, setLeaveRequestNotifications] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  
  // Security Settings State
  const [sessionTimeout, setSessionTimeout] = useState("24");
  const [passwordComplexity, setPasswordComplexity] = useState("medium");
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [auditLogging, setAuditLogging] = useState(true);

  const handleSaveSystemSettings = () => {
    // In a real app, this would make an API call to save settings
    toast({
      title: "Settings Saved",
      description: "System settings have been updated successfully.",
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Notifications Updated",
      description: "Notification preferences have been saved.",
    });
  };

  const handleSaveSecuritySettings = () => {
    toast({
      title: "Security Settings Updated",
      description: "Security configuration has been saved.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export is being prepared. You'll receive an email when it's ready.",
    });
  };

  const handleBackupDatabase = () => {
    toast({
      title: "Backup Initiated",
      description: "Database backup has been started. This may take a few minutes.",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="relative z-0 flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold">System Settings</h1>
                <p className="text-muted-foreground">Manage your organization's system configuration and preferences.</p>
              </div>

              <Tabs defaultValue="system" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="system" data-testid="tab-system">
                    <Settings className="h-4 w-4 mr-2" />
                    System
                  </TabsTrigger>
                  <TabsTrigger value="notifications" data-testid="tab-notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="security" data-testid="tab-security">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="data" data-testid="tab-data">
                    <Database className="h-4 w-4 mr-2" />
                    Data
                  </TabsTrigger>
                </TabsList>

                {/* System Settings */}
                <TabsContent value="system" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>Configure basic system parameters and defaults</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="leave-balance">Default Leave Balance (Days)</Label>
                          <Input
                            id="leave-balance"
                            type="number"
                            value={defaultLeaveBalance}
                            onChange={(e) => setDefaultLeaveBalance(e.target.value)}
                            min="0"
                            max="365"
                            data-testid="input-leave-balance"
                          />
                          <p className="text-xs text-muted-foreground">
                            Annual leave days assigned to new employees
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="working-hours">Standard Working Hours</Label>
                          <Input
                            id="working-hours"
                            type="number"
                            value={workingHours}
                            onChange={(e) => setWorkingHours(e.target.value)}
                            min="1"
                            max="24"
                            data-testid="input-working-hours"
                          />
                          <p className="text-xs text-muted-foreground">
                            Expected daily working hours
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Default Time Zone</Label>
                          <Select value={timeZone} onValueChange={setTimeZone}>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">Eastern Time</SelectItem>
                              <SelectItem value="America/Chicago">Central Time</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                              <SelectItem value="Europe/London">London</SelectItem>
                              <SelectItem value="Europe/Paris">Paris</SelectItem>
                              <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="date-format">Date Format</Label>
                          <Select value={dateFormat} onValueChange={setDateFormat}>
                            <SelectTrigger data-testid="select-date-format">
                              <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                              <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                              <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                              <SelectItem value="MMM dd, yyyy">MMM dd, yyyy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-end">
                        <Button onClick={handleSaveSystemSettings} data-testid="button-save-system">
                          Save System Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Control when and how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive general system notifications via email
                            </p>
                          </div>
                          <Switch
                            id="email-notifications"
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                            data-testid="switch-email-notifications"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="leave-notifications">Leave Request Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when employees submit leave requests
                            </p>
                          </div>
                          <Switch
                            id="leave-notifications"
                            checked={leaveRequestNotifications}
                            onCheckedChange={setLeaveRequestNotifications}
                            data-testid="switch-leave-notifications"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="attendance-alerts">Attendance Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive alerts for attendance irregularities
                            </p>
                          </div>
                          <Switch
                            id="attendance-alerts"
                            checked={attendanceAlerts}
                            onCheckedChange={setAttendanceAlerts}
                            data-testid="switch-attendance-alerts"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="weekly-reports">Weekly Reports</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive weekly summary reports via email
                            </p>
                          </div>
                          <Switch
                            id="weekly-reports"
                            checked={weeklyReports}
                            onCheckedChange={setWeeklyReports}
                            data-testid="switch-weekly-reports"
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-end">
                        <Button onClick={handleSaveNotificationSettings} data-testid="button-save-notifications">
                          Save Notification Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Configuration</CardTitle>
                      <CardDescription>Manage security policies and authentication settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="session-timeout">Session Timeout (Hours)</Label>
                          <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                            <SelectTrigger data-testid="select-session-timeout">
                              <SelectValue placeholder="Select timeout" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Hour</SelectItem>
                              <SelectItem value="4">4 Hours</SelectItem>
                              <SelectItem value="8">8 Hours</SelectItem>
                              <SelectItem value="24">24 Hours</SelectItem>
                              <SelectItem value="168">1 Week</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password-complexity">Password Complexity</Label>
                          <Select value={passwordComplexity} onValueChange={setPasswordComplexity}>
                            <SelectTrigger data-testid="select-password-complexity">
                              <SelectValue placeholder="Select complexity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low (6+ characters)</SelectItem>
                              <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                              <SelectItem value="high">High (12+ chars, symbols, numbers)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                            <p className="text-sm text-muted-foreground">
                              Require 2FA for all administrator accounts
                            </p>
                          </div>
                          <Switch
                            id="two-factor"
                            checked={twoFactorAuth}
                            onCheckedChange={setTwoFactorAuth}
                            data-testid="switch-two-factor"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="audit-logging">Audit Logging</Label>
                            <p className="text-sm text-muted-foreground">
                              Log all administrative actions and changes
                            </p>
                          </div>
                          <Switch
                            id="audit-logging"
                            checked={auditLogging}
                            onCheckedChange={setAuditLogging}
                            data-testid="switch-audit-logging"
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-end">
                        <Button onClick={handleSaveSecuritySettings} data-testid="button-save-security">
                          Save Security Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Data Management */}
                <TabsContent value="data" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Export</CardTitle>
                        <CardDescription>Export your organization's data for backup or analysis</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm">
                            Export includes all employee data, attendance records, and leave requests.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Data will be exported in CSV format and emailed to your admin account.
                          </p>
                        </div>
                        <Button 
                          onClick={handleExportData} 
                          variant="outline" 
                          className="w-full"
                          data-testid="button-export-data"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Database Backup</CardTitle>
                        <CardDescription>Create a backup of your system database</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm">
                            Create a complete backup of your database for disaster recovery.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Backup will be stored securely and can be restored if needed.
                          </p>
                        </div>
                        <Button 
                          onClick={handleBackupDatabase} 
                          variant="outline" 
                          className="w-full"
                          data-testid="button-backup-database"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Create Backup
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>System Information</CardTitle>
                      <CardDescription>Current system status and configuration details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">System Version</p>
                          <p className="text-sm text-muted-foreground">v1.0.0</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Database Status</p>
                          <p className="text-sm text-green-600">Connected</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Last Backup</p>
                          <p className="text-sm text-muted-foreground">Never</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Admin User</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Environment</p>
                          <p className="text-sm text-muted-foreground">Development</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Uptime</p>
                          <p className="text-sm text-muted-foreground">2h 45m</p>
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