import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, FileText, Users, Shield } from "lucide-react";
import logoImage from "@assets/logo_medicohelp.png";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img src={logoImage} alt="MédicoHelp - A plataforma médica inteligente" className="h-24 w-auto object-contain" />
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Assistência médica inteligente com IA para profissionais de saúde
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Entrar com sua conta
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Recursos Principais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <Activity className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Chat Médico com IA</h3>
                <p className="text-sm text-muted-foreground">
                  Consultas clínicas inteligentes com GPT-5
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <FileText className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Análise de Exames</h3>
                <p className="text-sm text-muted-foreground">
                  Upload e análise de imagens médicas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Gestão de Pacientes</h3>
                <p className="text-sm text-muted-foreground">
                  Sistema completo de prontuários
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Seguro e Confiável</h3>
                <p className="text-sm text-muted-foreground">
                  Dados protegidos e privacidade garantida
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-8 px-6 border-t">
        <p className="text-center text-sm text-muted-foreground">
          MédicoHelp - Sistema Beta Gratuito para Profissionais de Saúde
        </p>
      </div>
    </div>
  );
}
