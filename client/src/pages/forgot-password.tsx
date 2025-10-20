import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/authService";
import { Loader2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const forgotMutation = useMutation({
    mutationFn: (data: ForgotForm) => forgotPassword(data.email),
    onSuccess: (data) => {
      toast({
        title: "Código enviado",
        description: `Enviamos um código de 6 dígitos para seu ${data.channel === "email" ? "email" : "telefone"}`,
      });
      setLocation(`/verify-code?purpose=reset&email=${encodeURIComponent(getValues("email"))}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar código",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotForm) => {
    forgotMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Esqueci a senha</CardTitle>
          <CardDescription>Digite seu email para receber o código de recuperação</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={forgotMutation.isPending}
              data-testid="button-submit"
            >
              {forgotMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar código
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
