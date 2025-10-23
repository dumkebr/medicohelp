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
  showPediatria: boolean;
  showGestante: boolean;
  showEmergencia: boolean;
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

  // Salvar dados do médico no localStorage para personalização
  useEffect(() => {
    if (user && user.name) {
      const medicoInfo = {
        nome: user.name.startsWith("Dr") ? user.name : `Dr. ${user.name}`,
        especialidade: user.role === "medico" ? (user.crm ? `CRM ${user.crm}/${user.uf}` : undefined) : undefined,
      };
      localStorage.setItem("medicohelp_user", JSON.stringify(medicoInfo));
    } else {
      localStorage.removeItem("medicohelp_user");
    }
  }, [user]);

  const login = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    localStorage.removeItem("medicohelp_user");
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
