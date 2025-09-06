import type { Employee } from "@shared/schema";
import { log } from "console";

const TOKEN_KEY = "auth_token";



export function getAuthToken(): string | null {
  console.log(TOKEN_KEY);
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function logout(): void {
  removeAuthToken();
  window.location.href = "/";
}
