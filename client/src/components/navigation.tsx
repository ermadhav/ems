import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (location === "/") return null;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={user?.role === "admin" ? "/admin" : "/dashboard"}>
              <div className="flex items-center space-x-2 cursor-pointer">
                <Users className="text-primary text-2xl" />
                <span className="font-bold text-xl">EmpMS</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
