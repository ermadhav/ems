import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Login from "@/pages/login";
import EmployeeDashboard from "@/pages/employee-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminEmployees from "@/pages/admin-employees";
import AdminLeaveRequests from "@/pages/admin-leave-requests";
import AdminReports from "@/pages/admin-reports";
import AdminSettings from "@/pages/admin-settings";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/">
          {isAuthenticated && user ? (
            user.role === "admin" ? <AdminDashboard /> : <EmployeeDashboard />
          ) : (
            <Login />
          )}
        </Route>
        
        <Route path="/dashboard">
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/employees">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminEmployees />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/leave-requests">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLeaveRequests />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/reports">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminReports />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/settings">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminSettings />
          </ProtectedRoute>
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
