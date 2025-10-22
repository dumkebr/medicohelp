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
  renameAtendimento,
  setSaved,
  isSaved,
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

  const handleRenomear = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const novo = prompt("Novo nome do atendimento:", currentTitle || "");
    if (novo != null && novo.trim()) {
      renameAtendimento(id, novo);
      setAtendimentos(listAtendimentos());
    }
  };

  const handleToggleSaved = (id: string, saved: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(id, saved);
    setAtendimentos(listAtendimentos());
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

        <SidebarSeparator className="my-2" />

        {/* Gestão de Pacientes */}
        <SidebarGroup>
          {/* Cabeçalho da seção com toggle embutido */}
          <div className="flex items-center justify-between pr-1">
            <SidebarGroupLabel>Gestão de Pacientes</SidebarGroupLabel>
            <Switch
              checked={showPatientMgmt}
              onCheckedChange={setShowPatientMgmt}
              className="scale-75 translate-y-[1px] data-[state=checked]:bg-[#3cb371]"
              data-testid="toggle-patient-mgmt"
            />
          </div>

          {/* Itens aparecem só quando ligado */}
          {showPatientMgmt && (
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
          )}
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* Atendimentos */}
        <SidebarGroup>
          <SidebarGroupLabel>Atendimentos</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            
            {/* BOTÕES CABEÇALHO */}
            <div className="flex items-center justify-between px-3">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Histórico</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNovoAtendimento}
                className="h-6 px-2 text-xs"
                data-testid="button-novo-atendimento"
              >
                Novo
              </Button>
            </div>

            {/* LISTA VOLÁTIL (não salvos e sem paciente) */}
            <div className="max-h-[22vh] overflow-auto divide-y rounded border border-neutral-200 dark:border-neutral-700">
              {atendimentos.filter(it => !isSaved(it)).length === 0 && (
                <div className="p-2 text-neutral-500 dark:text-neutral-400 text-xs">
                  Sem históricos recentes.
                </div>
              )}
              {atendimentos.filter(it => !isSaved(it)).map((it) => (
                <div
                  key={it.id}
                  onClick={() => handleAbrirAtendimento(it.id)}
                  className={`p-2 cursor-pointer transition-colors ${
                    currentId === it.id
                      ? "bg-[#3cb371]/10 dark:bg-[#3cb371]/20"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                  title={new Date(it.updatedAt).toLocaleString()}
                  data-testid={`atendimento-volatil-${it.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm text-neutral-900 dark:text-white">{it.title}</div>
                    <div className="flex items-center gap-1">
                      {/* Salvar/Fixar */}
                      <button
                        title="Salvar em Atendimentos Salvos"
                        onClick={(e) => handleToggleSaved(it.id, true, e)}
                        className="text-[11px] px-1 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        data-testid={`button-save-${it.id}`}
                      >
                        📌
                      </button>

                      {/* Renomear */}
                      <button
                        title="Renomear"
                        onClick={(e) => handleRenomear(it.id, it.title, e)}
                        className="text-[11px] px-1 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        data-testid={`button-rename-${it.id}`}
                      >
                        ✏️
                      </button>

                      {/* Excluir */}
                      <button
                        title="Excluir"
                        onClick={(e) => handleRemoverAtendimento(it.id, e)}
                        className="text-[11px] px-1 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        data-testid={`button-delete-${it.id}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SEÇÃO SALVOS */}
            <div className="px-3 mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Atendimentos Salvos
            </div>
            <div className="max-h-[22vh] overflow-auto divide-y rounded border border-neutral-200 dark:border-neutral-700">
              {atendimentos.filter(it => isSaved(it)).length === 0 && (
                <div className="p-2 text-neutral-500 dark:text-neutral-400 text-xs">
                  Nenhum salvo ainda.
                </div>
              )}
              {atendimentos.filter(it => isSaved(it)).map((it) => (
                <div
                  key={it.id}
                  onClick={() => handleAbrirAtendimento(it.id)}
                  className={`p-2 cursor-pointer transition-colors ${
                    currentId === it.id
                      ? "bg-[#3cb371]/10 dark:bg-[#3cb371]/20"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                  title={new Date(it.updatedAt).toLocaleString()}
                  data-testid={`atendimento-salvo-${it.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm text-neutral-900 dark:text-white">{it.title}</div>
                    <div className="flex items-center gap-1">
                      {/* Desfixar (se não tiver paciente) */}
                      {!it.patientId && (
                        <button
                          title="Remover dos salvos"
                          onClick={(e) => handleToggleSaved(it.id, false, e)}
                          className="text-[11px] px-1 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          data-testid={`button-unsave-${it.id}`}
                        >
                          📍
                        </button>
                      )}

                      {/* Renomear */}
                      <button
                        title="Renomear"
                        onClick={(e) => handleRenomear(it.id, it.title, e)}
                        className="text-[11px] px-1 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        data-testid={`button-rename-${it.id}`}
                      >
                        ✏️
                      </button>

                      {/* Excluir */}
                      <button
                        title="Excluir"
                        onClick={(e) => handleRemoverAtendimento(it.id, e)}
                        className="text-[11px] px-1 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        data-testid={`button-delete-${it.id}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {it.patientId && (
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        Paciente
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {user?.email || "Usuário"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
