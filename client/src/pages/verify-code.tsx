import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { verifyCode, requestCode, resetPassword } from "@/lib/authService";
import { Loader2 } from "lucide-react";

const codeSchema = z.object({
  code: z.string().length(6, "Código deve ter 6 dígitos"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type CodeForm = z.infer<typeof codeSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function VerifyCode() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const { toast } = useToast();
  const { login: setAuthToken } = useAuth();

  const purpose = (searchParams.get("purpose") || "signup") as "signup" | "reset";
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";

  const [resetToken, setResetToken] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: codeErrors },
  } = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const verifyMutation = useMutation({
    mutationFn: (data: CodeForm) => verifyCode({
      purpose,
      email: email || undefined,
      phone: phone || undefined,
      code: data.code,
    }),
    onSuccess: (data) => {
      if (purpose === "signup") {
        setAuthToken(data.token);
        toast({
          title: "Conta verificada com sucesso",
          description: `Bem-vindo, ${data.user.name}!`,
        });
        setLocation("/");
      } else {
        setResetToken(data.token);
        toast({
          title: "Código verificado",
          description: "Digite sua nova senha",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao verificar código",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => requestCode({
      purpose,
      channel: email ? "email" : "sms",
      email: email || undefined,
      phone: phone || undefined,
    }),
    onSuccess: (data) => {
      setCooldown(60);
      toast({
        title: "Código reenviado",
        description: `Enviamos um novo código para seu ${data.channel === "email" ? "email" : "telefone"}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar código",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) => {
      if (!resetToken) throw new Error("Token não encontrado");
      return resetPassword(resetToken, data.newPassword);
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada com sucesso",
        description: "Faça login com sua nova senha",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitCode = (data: CodeForm) => {
    verifyMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  const handleResend = () => {
    if (cooldown === 0) {
      resendMutation.mutate();
    }
  };

  if (resetToken && purpose === "reset") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Nova senha</CardTitle>
            <CardDescription>Digite sua nova senha</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••"
                  data-testid="input-new-password"
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••"
                  data-testid="input-confirm-password"
                  {...registerPassword("confirmPassword")}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
                data-testid="button-submit"
              >
                {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar senha
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verificar código</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos enviado para {email || phone}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitCode(onSubmitCode)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                maxLength={6}
                data-testid="input-code"
                {...registerCode("code")}
              />
              {codeErrors.code && (
                <p className="text-sm text-destructive">{codeErrors.code.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={verifyMutation.isPending}
              data-testid="button-submit"
            >
              {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={cooldown > 0 || resendMutation.isPending}
              data-testid="button-resend"
            >
              {resendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar código"}
            </Button>
            <div className="text-sm text-center">
              <Link href="/login">
                <a className="text-primary hover:underline" data-testid="link-login">
                  Voltar para login
                </a>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
