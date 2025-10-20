import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { AuthProvider } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";
import NotFound from "@/pages/not-found";
import Atendimento from "@/pages/atendimento";
import NovoPaciente from "@/pages/novo-paciente";
import EditarPaciente from "@/pages/editar-paciente";
import Pacientes from "@/pages/pacientes";
import HistoricoPaciente from "@/pages/historico-paciente";
import MeuPerfil from "@/pages/meu-perfil";
import Sobre from "@/pages/sobre";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import VerifyCode from "@/pages/verify-code";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function OAuthHandler() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    
    if (token) {
      login(token);
      window.history.replaceState({}, "", "/");
      setLocation("/");
    }
  }, [login, setLocation]);

  return null;
}

function AuthRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-code" component={VerifyCode} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedRouter() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/" component={Atendimento} />
        <Route path="/novo-paciente" component={NovoPaciente} />
        <Route path="/pacientes/:id/historico" component={HistoricoPaciente} />
        <Route path="/pacientes/:id/editar" component={EditarPaciente} />
        <Route path="/pacientes" component={Pacientes} />
        <Route path="/profile" component={MeuPerfil} />
        <Route path="/meu-perfil" component={MeuPerfil} />
        <Route path="/sobre" component={Sobre} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  const authRoutes = ["/login", "/register", "/forgot-password", "/verify-code"];
  const isAuthRoute = authRoutes.some(route => location.startsWith(route));

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || isAuthRoute) {
    return <AuthRouter />;
  }

  return <ProtectedRouter />;
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  const authRoutes = ["/login", "/register", "/forgot-password", "/verify-code"];
  const isAuthRoute = authRoutes.some(route => location.startsWith(route));

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (!isAuthenticated || isAuthRoute) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between px-6 py-3 border-b bg-card sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <Badge variant="secondary" data-testid="badge-beta">
                  Beta Gratuito
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground" data-testid="text-quota">
                  Limite diário: 10 consultas
                </span>
                <ThemeToggle />
                <UserMenu />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <OAuthHandler />
            <AppLayout />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
