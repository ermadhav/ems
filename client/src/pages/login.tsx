import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoginPending, loginError, isAuthenticated, user } = useAuth();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  const onSubmit = async (data: LoginCredentials) => {
    try {
      
      await login(data);
      console.log(data);
    } catch (error) {
      // Error handling is done in the useAuth hook
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary">
            <Users className="text-primary-foreground text-xl" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Sign in to your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Employee Management System
          </p>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-8 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {loginError.message || "Invalid credentials"}
                  </AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john.doe@company.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••"
                        {...field}
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoginPending}
                data-testid="button-signin"
              >
                {isLoginPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Demo System - Contact your administrator for credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
