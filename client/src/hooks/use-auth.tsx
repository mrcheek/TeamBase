import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { calculateProfileCompletion } from "@shared/schema";

type AuthUser = Omit<User, "password">;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  profileCompletion: number;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { fullName: string; phone: string }) => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", { phone, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { fullName: string; phone: string }) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const profileCompletion = user ? calculateProfileCompletion(user) : 0;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        profileCompletion,
        login: async (phone, password) => {
          await loginMutation.mutateAsync({ phone, password });
        },
        register: async (data) => {
          await registerMutation.mutateAsync(data);
        },
        updateProfile: async (data) => {
          await profileMutation.mutateAsync(data);
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
