import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Bell, CheckCircle2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeatureContent {
  title: string;
  subtitle: string;
  description: string;
  icon: JSX.Element;
}

const FEATURE_CONTENT: Record<string, FeatureContent> = {
  pediatria: {
    title: "Pediatria",
    subtitle: "Tabela de Peso e Crescimento",
    description: "Tabelas de referência OMS, IMC por idade e curvas de crescimento infantil integradas para avaliação nutricional pediátrica completa.",
    icon: <Bell className="w-6 h-6" />,
  },
  gestante: {
    title: "Consulta Gestante",
    subtitle: "Pré-natal Completo",
    description: "Checklist pré-natal completo, calendário de exames por trimestre e alertas automáticos de fatores de risco gestacional.",
    icon: <Bell className="w-6 h-6" />,
  },
  emergencia: {
    title: "Emergência",
    subtitle: "Protocolos de Atendimento",
    description: "Protocolos iniciais ABCDE, fluxogramas de dor torácica, dispneia aguda, convulsão e outras emergências médicas.",
    icon: <Bell className="w-6 h-6" />,
  },
};

export default function EmBreve() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Extract feature from URL path
  const feature = location.split("/")[1] || "pediatria";
  const featureData = FEATURE_CONTENT[feature] || FEATURE_CONTENT.pediatria;

  const notifyMutation = useMutation({
    mutationFn: async (data: { feature: string; email: string }) => {
      return await apiRequest("POST", "/api/notify/feature", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Email cadastrado com sucesso! Você será notificado quando o recurso estiver disponível.",
      });
      setEmail("");
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível cadastrar seu email. Tente novamente.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
      });
      return;
    }

    notifyMutation.mutate({ feature, email });
  };

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            {featureData.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{featureData.title}</h1>
            <p className="text-muted-foreground">{featureData.subtitle}</p>
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              Em Breve
            </CardTitle>
            <CardDescription>
              Este módulo está em desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feature Description */}
            <div className="space-y-4">
              <p className="text-base leading-relaxed">
                {featureData.description}
              </p>

              {/* Disclaimer */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Conteúdo em validação clínica</AlertTitle>
                <AlertDescription>
                  Este módulo está sendo desenvolvido com base em evidências científicas e
                  diretrizes clínicas atualizadas. O lançamento ocorrerá após validação
                  completa por profissionais de saúde especializados.
                </AlertDescription>
              </Alert>
            </div>

            {/* Notification Button */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-medium">Quer ser notificado quando estiver disponível?</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cadastre seu email e receba um aviso assim que o módulo for liberado.
              </p>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-notify-me">
                    <Bell className="w-4 h-4 mr-2" />
                    Quero ser avisado
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-notify">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>Receber notificação</DialogTitle>
                      <DialogDescription>
                        Digite seu email para ser notificado quando o módulo <strong>{featureData.title}</strong> estiver disponível.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          data-testid="input-waitlist-email"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        data-testid="button-cancel-notify"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={notifyMutation.isPending}
                        data-testid="button-submit-notify"
                      >
                        {notifyMutation.isPending ? (
                          <>Cadastrando...</>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Cadastrar
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
