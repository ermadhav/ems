import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken, setAuthToken, removeAuthToken, getAuthHeaders } from "@/lib/auth";
import type { Employee, LoginCredentials } from "@shared/schema";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<Employee | null>({
    queryKey: ["/api/auth/me"],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            removeAuthToken();
            setIsAuthenticated(false);
            return null;
          }
          throw new Error("Failed to fetch user");
        }
        return await response.json();
      } catch (error) {
        removeAuthToken();
        setIsAuthenticated(false);
        return null;
      }
    },
    
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setIsAuthenticated(true);
      queryClient.setQueryData(["/api/auth/me"], data.employee);
    },
  });

  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    queryClient.clear();
    window.location.href = "/";
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoginPending: loginMutation.isPending,
    logout,
  };
}
