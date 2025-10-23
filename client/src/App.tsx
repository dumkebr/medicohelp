import { Switch, Route, useLocation, Redirect } from "wouter";
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
import ClariceAvatarDebug from "@/components/ClariceAvatarDebug";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import NovoPaciente from "@/pages/novo-paciente";
import EditarPaciente from "@/pages/editar-paciente";
import Pacientes from "@/pages/pacientes";
import HistoricoPaciente from "@/pages/historico-paciente";
import MeuPerfil from "@/pages/meu-perfil";
import Sobre from "@/pages/sobre";
import EmBreve from "@/pages/em-breve";
import DemoTopControls from "@/pages/demo-top-controls";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import VerifyCode from "@/pages/verify-code";
import AdvancedHub from "@/pages/advanced-hub";
import MedPrime from "@/pages/medprime";
import CalcPlaceholder from "@/pages/calc-placeholder";
import CalcWells from "@/pages/calc-wells";
import CalcGasometria from "@/pages/calc-gasometria";
import CalcIG from "@/pages/calc-ig";
import DemoLandingTeal from "@/pages/demo-landing-teal";
import DemoChatTeal from "@/pages/demo-chat-teal";
import AtendimentoTeal from "@/pages/atendimento-teal";
import { useEffect, useState } from "react";
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
  const [location] = useLocation();
  
  // Redirect root to login only when at exact root path
  if (location === "/") {
    return <Redirect to="/login" />;
  }
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-code" component={VerifyCode} />
      <Route path="/demo-top-controls" component={DemoTopControls} />
      <Route path="/demo-landing-teal" component={DemoLandingTeal} />
      <Route path="/demo-chat-teal" component={DemoChatTeal} />
      <Route path="/demo-atendimento-teal" component={AtendimentoTeal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedRouter() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/atendimento" component={Home} />
        <Route path="/atendimento-teal" component={AtendimentoTeal} />
        <Route path="/novo-paciente" component={NovoPaciente} />
        <Route path="/pacientes/:id/historico" component={HistoricoPaciente} />
        <Route path="/pacientes/:id/editar" component={EditarPaciente} />
        <Route path="/pacientes" component={Pacientes} />
        <Route path="/profile" component={MeuPerfil} />
        <Route path="/meu-perfil" component={MeuPerfil} />
        <Route path="/sobre" component={Sobre} />
        <Route path="/pediatria" component={EmBreve} />
        <Route path="/gestante" component={EmBreve} />
        <Route path="/emergencia" component={EmBreve} />
        <Route path="/demo-top-controls" component={DemoTopControls} />
        
        {/* MEDPRIME & ADVANCED HUB */}
        <Route path="/medprime" component={MedPrime} />
        <Route path="/avancado" component={AdvancedHub} />
        
        {/* CALCULADORAS */}
        <Route path="/calc/wells" component={CalcWells} />
        <Route path="/calc/gasometria" component={CalcGasometria} />
        <Route path="/calc/ig" component={CalcIG} />
        <Route path="/calc/child-pugh">
          {() => <CalcPlaceholder title="Child-Pugh" description="Classificação de gravidade da cirrose hepática" />}
        </Route>
        <Route path="/calc/grace">
          {() => <CalcPlaceholder title="GRACE Score" description="Estratificação de risco em Síndrome Coronariana Aguda" />}
        </Route>
        <Route path="/calc/cha2ds2vasc">
          {() => <CalcPlaceholder title="CHA₂DS₂-VASc" description="Risco tromboembólico em Fibrilação Atrial" />}
        </Route>
        
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
            <ClariceAvatarDebug />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
/* Force rebuild 1761228574 */
/* Force update 1761229402 */
