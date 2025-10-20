import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getAuthToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  defaultStyle: z.enum(["tradicional", "soap"]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function MeuPerfil() {
  const { user, refetchUser, logout } = useAuth();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      defaultStyle: "tradicional",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        defaultStyle: user.defaultStyle,
      });
    }
  }, [user, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PUT", "/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/users/me"] });
      refetchUser();
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: error.message,
      });
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O avatar deve ter no máximo 2MB.",
      });
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Use apenas imagens JPEG ou PNG.",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingAvatar(true);

    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
        });
        logout();
        setAvatarPreview(null);
        return;
      }

      const res = await fetch("/users/me/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
        });
        logout();
        setAvatarPreview(null);
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Erro ao fazer upload do avatar");
      }

      const data = await res.json();
      
      await queryClient.invalidateQueries({ queryKey: ["/users/me"] });
      refetchUser();

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: error.message,
      });
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const isOAuth = user.email && !user.crm && user.role === "estudante";

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>Gerencie suas informações pessoais e preferências</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={avatarPreview || user.avatarUrl} 
                  alt={user.name} 
                  data-testid="avatar-profile"
                />
                <AvatarFallback data-testid="avatar-fallback">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                data-testid="button-upload-avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={handleAvatarChange}
                data-testid="input-avatar"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Clique no ícone para alterar sua foto (máx. 2MB, PNG ou JPG)
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input 
                  value={user.email} 
                  disabled 
                  className="bg-muted"
                  data-testid="input-email"
                />
                {isOAuth && (
                  <p className="text-xs text-muted-foreground">
                    Email vinculado via login social (não pode ser alterado)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FormLabel>Papel</FormLabel>
                <Input 
                  value={user.role === "medico" ? "Médico" : "Estudante"} 
                  disabled 
                  className="bg-muted"
                  data-testid="input-role"
                />
                <p className="text-xs text-muted-foreground">
                  Seu papel não pode ser alterado por segurança
                </p>
              </div>

              {user.role === "medico" && (
                <>
                  <div className="space-y-2">
                    <FormLabel>CRM</FormLabel>
                    <Input 
                      value={user.crm || ""} 
                      disabled 
                      className="bg-muted"
                      data-testid="input-crm"
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>UF</FormLabel>
                    <Input 
                      value={user.uf || ""} 
                      disabled 
                      className="bg-muted"
                      data-testid="input-uf"
                    />
                  </div>
                </>
              )}

              <FormField
                control={form.control}
                name="defaultStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estilo padrão de atendimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-default-style">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tradicional" data-testid="option-tradicional">
                          Tradicional (MédicoHelp)
                        </SelectItem>
                        <SelectItem value="soap" data-testid="option-soap">
                          SOAP
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={updateMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
