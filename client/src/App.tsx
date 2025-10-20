import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import NotFound from "@/pages/not-found";
import Atendimento from "@/pages/atendimento";
import NovoPaciente from "@/pages/novo-paciente";
import EditarPaciente from "@/pages/editar-paciente";
import Pacientes from "@/pages/pacientes";
import HistoricoPaciente from "@/pages/historico-paciente";
import Sobre from "@/pages/sobre";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Atendimento} />
      <Route path="/novo-paciente" component={NovoPaciente} />
      <Route path="/pacientes/:id/historico" component={HistoricoPaciente} />
      <Route path="/pacientes/:id/editar" component={EditarPaciente} />
      <Route path="/pacientes" component={Pacientes} />
      <Route path="/sobre" component={Sobre} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
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
                      Limite diário: 50 consultas
                    </span>
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
