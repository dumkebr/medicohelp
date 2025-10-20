import { Activity, Users, Plus, FileText, Sparkles, Image, Home, Baby, Heart, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
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
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
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
  const [location] = useLocation();
  const { user } = useAuth();

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
    </Sidebar>
  );
}
