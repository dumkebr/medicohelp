import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function Sobre() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Sobre o MédicoHelp</h1>
        <p className="text-muted-foreground">
          Plataforma médica profissional com assistente de IA
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Bem-vindo ao MédicoHelp</CardTitle>
            <Badge variant="secondary">Beta Gratuito</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Recursos Disponíveis</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Atendimento Médico com IA:</strong> Faça perguntas clínicas e
                receba respostas baseadas em conhecimento médico atualizado
              </li>
              <li>
                <strong>Análise de Exames:</strong> Envie imagens de exames (raio-x,
                laudos, etc.) para análise automática
              </li>
              <li>
                <strong>Gestão de Pacientes:</strong> Cadastre e gerencie informações
                de pacientes de forma segura
              </li>
              <li>
                <strong>Integração com Memed:</strong> Emita receitas médicas
                diretamente através da plataforma Memed
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Links Úteis</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a
                  href="https://memed.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-memed"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Memed - Prescrição Digital
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a
                  href="https://cid.who.int/browse"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-cid"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  CID-10/11 - Classificação de Doenças
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a
                  href="https://bvsms.saude.gov.br/biblioteca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-ministerio"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Guias do Ministério da Saúde
                </a>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Aviso:</strong> Este sistema utiliza inteligência artificial para
              auxiliar profissionais de saúde. As informações fornecidas não substituem
              o julgamento clínico profissional e devem ser utilizadas como ferramenta
              de apoio à decisão médica.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
