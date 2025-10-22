import { Activity, Users, Plus, FileText, Sparkles, Image, Home, Baby, Heart, AlertCircle, Trash2, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { 
  listAtendimentos, 
  setCurrentId, 
  getCurrentId, 
  createAtendimento, 
  removeAtendimento,
  type Atendimento 
} from "@/lib/atendimentos";
import logoImage from "@assets/generated_images/Medical_logo_icon_green_50d6f1d5.png";

const menuItems = [
  {
    title: "Atendimento médico",
    url: "/",
    icon: Activity,
  },
  {
    title: "Sobre",
    url: "/sobre",
    icon: Home,
  },
];

const patientItems = [
  {
    title: "Novo paciente",
    url: "/novo-paciente",
    icon: Plus,
  },
  {
    title: "Todos os pacientes",
    url: "/pacientes",
    icon: Users,
  },
];

const specialModules = [
  {
    title: "Pediatria",
    url: "/pediatria",
    icon: Baby,
    settingKey: "showPediatria" as const,
  },
  {
    title: "Gestante",
    url: "/gestante",
    icon: Heart,
    settingKey: "showGestante" as const,
  },
  {
    title: "Emergência",
    url: "/emergencia",
    icon: AlertCircle,
    settingKey: "showEmergencia" as const,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [showPatientMgmt, setShowPatientMgmt] = useLocalStorage<boolean>("mh_showPatientMgmt", true);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);

  useEffect(() => {
    const items = listAtendimentos();
    setAtendimentos(items);
    setCurrentIdState(getCurrentId());
  }, [location]);

  const handleNovoAtendimento = () => {
    const novo = createAtendimento();
    setAtendimentos(listAtendimentos());
    setCurrentIdState(novo.id);
    setCurrentId(novo.id);
    setLocation("/");
  };

  const handleAbrirAtendimento = (id: string) => {
    setCurrentId(id);
    setCurrentIdState(id);
    setLocation("/");
  };

  const handleRemoverAtendimento = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Remover este atendimento?")) {
      removeAtendimento(id);
      setAtendimentos(listAtendimentos());
      setCurrentIdState(getCurrentId());
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-6 border-b">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="MédicoHelp" className="w-8 h-8" />
          <span className="text-lg font-bold">MédicoHelp</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showPatientMgmt && (
          <>
            <SidebarSeparator className="my-2" />

            <SidebarGroup>
              <SidebarGroupLabel>Gestão de Pacientes</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {patientItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator className="my-2" />

        {/* Histórico de Atendimentos */}
        <SidebarGroup>
          <div className="px-6 py-2 flex items-center justify-between">
            <SidebarGroupLabel>Histórico</SidebarGroupLabel>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNovoAtendimento}
              className="h-6 px-2 text-xs"
              data-testid="button-novo-atendimento"
            >
              <Plus className="w-3 h-3 mr-1" />
              Novo
            </Button>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-[250px]">
              {atendimentos.length === 0 ? (
                <div className="px-6 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Sem atendimentos salvos.
                </div>
              ) : (
                <div className="space-y-1 px-3">
                  {atendimentos.map((at) => (
                    <div
                      key={at.id}
                      onClick={() => handleAbrirAtendimento(at.id)}
                      className={`group relative rounded-md px-3 py-2 cursor-pointer transition-colors ${
                        currentId === at.id
                          ? "bg-[#3cb371]/10 dark:bg-[#3cb371]/20"
                          : "hover-elevate"
                      }`}
                      data-testid={`atendimento-item-${at.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-neutral-900 dark:text-white">
                            {at.title}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {new Date(at.updatedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {at.patientId && (
                            <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1">
                              Paciente
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleRemoverAtendimento(at.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          data-testid={`button-remover-${at.id}`}
                        >
                          <Trash2 className="w-3 h-3 text-neutral-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Módulos Especiais - only show if at least one is enabled */}
        {user && specialModules.some(module => user[module.settingKey]) && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Módulos Especiais</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {specialModules
                    .filter(module => user[module.settingKey])
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Link href={item.url}>
                            <item.icon className="w-5 h-5" />
                            <span>{item.title}</span>
                            <Badge variant="secondary" className="ml-auto text-xs" data-testid={`badge-${item.title.toLowerCase()}-preview`}>
                              Em breve
                            </Badge>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="px-6 py-4 border-t">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="patient-mgmt-toggle" className="text-sm font-normal text-neutral-700 dark:text-neutral-300 cursor-pointer">
            Gestão de Pacientes
          </Label>
          <Switch
            id="patient-mgmt-toggle"
            checked={showPatientMgmt}
            onCheckedChange={setShowPatientMgmt}
            data-testid="toggle-patient-mgmt"
            className="data-[state=checked]:bg-[#3cb371]"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
