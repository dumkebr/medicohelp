import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { register as registerUser } from "@/lib/authService";
import { Loader2 } from "lucide-react";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["medico", "estudante"], { required_error: "Selecione um papel" }),
  crm: z.string().optional(),
  uf: z.string().optional(),
}).refine((data) => {
  if (data.role === "medico") {
    return !!data.crm && !!data.uf;
  }
  return true;
}, {
  message: "CRM e UF são obrigatórios para médicos",
  path: ["crm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login: setAuthToken } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "estudante",
    },
  });

  const selectedRole = watch("role");
  const isMedico = selectedRole === "medico";

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuthToken(data.token);
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Preencha os dados para criar sua conta</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Dr. João Silva"
                data-testid="input-name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                data-testid="input-email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                data-testid="input-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Papel</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue("role", value as "medico" | "estudante")}
              >
                <SelectTrigger id="role" data-testid="select-role">
                  <SelectValue placeholder="Selecione seu papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estudante">Estudante</SelectItem>
                  <SelectItem value="medico">Médico</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            {isMedico && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    type="text"
                    placeholder="123456"
                    data-testid="input-crm"
                    {...register("crm")}
                  />
                  {errors.crm && (
                    <p className="text-sm text-destructive">{errors.crm.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select
                    value={watch("uf")}
                    onValueChange={(value) => setValue("uf", value)}
                  >
                    <SelectTrigger id="uf" data-testid="select-uf">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.uf && (
                    <p className="text-sm text-destructive">{errors.uf.message}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
              data-testid="button-submit"
            >
              {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
            <div className="text-sm text-center">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link href="/login">
                <a className="text-primary hover:underline" data-testid="link-login">
                  Entrar
                </a>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
