import { Activity, Users, Plus, FileText, Sparkles, Image, Home, Baby, Heart, AlertCircle, Search, ChevronDown, ChevronRight, Calculator, HeartPulse } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/lib/auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { 
  listAtendimentos, 
  setCurrentId, 
  getCurrentId, 
  createAtendimento, 
  removeAtendimento,
  isSaved,
  renameAtendimento,
  setSaved,
  type Atendimento 
} from "@/lib/atendimentos";
import { SessionAPI } from "@/lib/chatSessions";
import { ItemRow } from "@/components/ItemRow";

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
  const [showSaved, setShowSaved] = useLocalStorage<boolean>("mh_showSaved", true);
  const [showHistory, setShowHistory] = useLocalStorage<boolean>("mh_showHistory", true);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);

  useEffect(() => {
    const items = listAtendimentos();
    setAtendimentos(items);
    setCurrentIdState(getCurrentId());
  }, [location]);

  const handleNovoAtendimento = () => {
    // Dispara evento customizado que a página de atendimento escuta
    // Isso permite que a página salve a sessão atual antes de criar nova
    window.dispatchEvent(new CustomEvent("mh:new-session"));
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // TODO: Implementar busca real
    console.log("Buscar:", searchQuery);
    alert(`Buscando: "${searchQuery}"\n\n(Funcionalidade em desenvolvimento)`);
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4 border-b bg-background">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[28px] font-black tracking-tight text-foreground">Médico</span>
            <span className="text-[28px] font-black tracking-tight text-[#00e699]">Help</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="pt-0">
        <SidebarGroup className="pt-0">
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
              
              {/* Novo atendimento - agora no Menu Principal */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNovoAtendimento} data-testid="button-novo-atendimento-menu">
                  <Plus className="w-5 h-5" />
                  <span>Novo atendimento</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Buscar em atendimentos */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowSearch(!showSearch)} data-testid="button-toggle-search">
                  <Search className="w-5 h-5" />
                  <span>Buscar em atendimentos</span>
                  {showSearch ? <ChevronDown className="ml-auto w-4 h-4" /> : <ChevronRight className="ml-auto w-4 h-4" />}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Campo de busca (expansível) */}
            {showSearch && (
              <form onSubmit={handleSearch} className="mt-2 px-2 space-y-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Queixa, CID, nome ou data..."
                  className="text-sm"
                  data-testid="input-search-query"
                />
                <div className="text-[11px] text-muted-foreground">
                  Dica: você pode colar uma data, nome, CID ou termo clínico.
                </div>
              </form>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* MedPrime - Link Destacado */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Link
              href="/medprime"
              className={`group mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                location === "/medprime"
                  ? "bg-emerald-700 text-white shadow-md"
                  : "text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-900 dark:hover:text-emerald-100"
              }`}
              data-testid="link-medprime"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-700 text-white ring-1 ring-emerald-600/20">
                <HeartPulse className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">MedPrime</div>
                <div className="text-[10px] opacity-75 truncate">Ferramentas Avançadas</div>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </Link>
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

        {(() => {
          const savedItems = atendimentos.filter(it => isSaved(it));
          const volatileItems = atendimentos.filter(it => !isSaved(it));

          return (
            <>
              {/* ATENDIMENTOS SALVOS (EM CIMA) */}
              <SidebarGroup>
                <div className="flex items-center justify-between pr-1">
                  <SidebarGroupLabel>Atendimentos Salvos</SidebarGroupLabel>
                  <Switch
                    checked={showSaved}
                    onCheckedChange={setShowSaved}
                    className="scale-75 translate-y-[1px]"
                    data-testid="toggle-saved"
                  />
                </div>

                {showSaved && (
                  <SidebarGroupContent className="space-y-2">
                    <div className="max-h-[22vh] overflow-auto divide-y rounded border border-neutral-200 dark:border-neutral-700">
                      {savedItems.length === 0 && (
                        <div className="p-2 text-neutral-500 dark:text-neutral-400 text-xs">
                          Nenhum salvo ainda.
                        </div>
                      )}
                      {savedItems.map((it) => (
                        <ItemRow
                          key={it.id}
                          item={it}
                          isActive={currentId === it.id}
                          onOpen={() => handleAbrirAtendimento(it.id)}
                          onDelete={(e) => handleRemoverAtendimento(it.id, e)}
                          refresh={() => setAtendimentos(listAtendimentos())}
                        />
                      ))}
                    </div>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>

              <SidebarSeparator className="my-2" />

              {/* HISTÓRICO (EMBAIXO) - COM TOGGLE, SEM BOTÃO NOVO */}
              <SidebarGroup>
                <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                  <div className="flex items-center justify-between pr-1">
                    <SidebarGroupLabel>Histórico</SidebarGroupLabel>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        data-testid="toggle-history"
                      >
                        {showHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent>
                    <SidebarGroupContent className="space-y-2">
                      <div className="max-h-[22vh] overflow-auto divide-y rounded border border-neutral-200 dark:border-neutral-700">
                        {volatileItems.length === 0 && (
                          <div className="p-2 text-neutral-500 dark:text-neutral-400 text-xs">
                            Sem históricos recentes.
                          </div>
                        )}
                        {volatileItems.map((it) => (
                          <ItemRow
                            key={it.id}
                            item={it}
                            isActive={currentId === it.id}
                            onOpen={() => handleAbrirAtendimento(it.id)}
                            onDelete={(e) => handleRemoverAtendimento(it.id, e)}
                            refresh={() => setAtendimentos(listAtendimentos())}
                          />
                        ))}
                      </div>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            </>
          );
        })()}

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
