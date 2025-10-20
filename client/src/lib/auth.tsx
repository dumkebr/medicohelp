import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken, setAuthToken, clearAuthToken } from "./queryClient";

interface User {
  id: string;
  name: string;
  email: string;
  role: "medico" | "estudante";
  crm?: string;
  uf?: string;
  avatarUrl?: string;
  defaultStyle: "tradicional" | "soap";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());

  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: ["/users/me"],
    enabled: isAuthenticated,
    retry: false,
  });

  const login = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };

  const refetchUser = () => {
    refetch();
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout,
      refetchUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
