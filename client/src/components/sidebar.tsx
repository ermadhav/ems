import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Clock, 
  Calendar, 
  User, 
  Users, 
  CalendarCheck, 
  BarChart3, 
  Settings,
  ShieldQuestion,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const employeeNavItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", active: location === "/dashboard" },
    { href: "/attendance", icon: Clock, label: "Attendance", active: location === "/attendance" },
    { href: "/leaves", icon: Calendar, label: "Leave Requests", active: location === "/leaves" },
    { href: "/profile", icon: User, label: "Profile", active: location === "/profile" },
  ];

  const adminNavItems = [
    { href: "/admin", icon: BarChart3, label: "Dashboard", active: location === "/admin" },
    { href: "/admin/employees", icon: Users, label: "Employees", active: location === "/admin/employees" },
    { href: "/admin/leave-requests", icon: CalendarCheck, label: "Leave Requests", active: location === "/admin/leave-requests" },
    { href: "/admin/reports", icon: BarChart3, label: "Reports", active: location === "/admin/reports" },
    { href: "/admin/settings", icon: Settings, label: "Settings", active: location === "/admin/settings" },
  ];

  const navItems = user?.role === "admin" ? adminNavItems : employeeNavItems;

  return (
    <div className={cn("hidden lg:flex lg:flex-shrink-0", className)}>
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 pb-4">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center space-x-2">
              {user?.role === "admin" ? (
                <ShieldQuestion className="text-primary text-2xl" />
              ) : (
                <User className="text-primary text-2xl" />
              )}
              <div>
                <p className="text-sm font-medium" data-testid="text-username">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      item.active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 px-2">
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="button-sidebar-logout"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
