import { useState } from "react";
import { Calculator, Pill, Stethoscope, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";

interface MedicalToolsMenuProps {
  userRole: "medico" | "estudante" | string;
}

export function MedicalToolsMenu({ userRole }: MedicalToolsMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Calculadora states
  const [calculadoraSelecionada, setCalculadoraSelecionada] = useState("");
  const [variaveisCalc, setVariaveisCalc] = useState("");

  // Conduta states
  const [quadroConduta, setQuadroConduta] = useState("");
  const [resumoConduta, setResumoConduta] = useState("");

  // Exames states
  const [quadroExames, setQuadroExames] = useState("");

  // Diferenciais states
  const [quadroDiferenciais, setQuadroDiferenciais] = useState("");

  const hasAccess = userRole === "medico" || userRole === "estudante";

  const handleCalculadora = async () => {
    if (!calculadoraSelecionada || !variaveisCalc) {
      toast({
        title: "Dados incompletos",
        description: "Selecione a calculadora e forneça as variáveis em JSON",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const variaveis = JSON.parse(variaveisCalc);
      const response = await apiRequest("POST", `/api/tools/calculadora/${calculadoraSelecionada}`, {
        variaveis,
      });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Score calculado",
        description: "Resultado disponível abaixo",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao calcular score",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConduta = async () => {
    if (!quadroConduta) {
      toast({
        title: "Dados incompletos",
        description: "Descreva o quadro clínico",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/tools/conduta", {
        quadro: quadroConduta,
        resumo: resumoConduta || undefined,
      });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Conduta sugerida",
        description: "Resultado disponível abaixo",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar conduta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExames = async () => {
    if (!quadroExames) {
      toast({
        title: "Dados incompletos",
        description: "Descreva o quadro clínico",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/tools/exames/pedir", {
        quadro: quadroExames,
      });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Exames sugeridos",
        description: "Resultado disponível abaixo",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao sugerir exames",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiferenciais = async () => {
    if (!quadroDiferenciais) {
      toast({
        title: "Dados incompletos",
        description: "Descreva o quadro clínico",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/tools/diferenciais", {
        quadro: quadroDiferenciais,
      });
      const data = await response.json();
      setResult(data);
      toast({
        title: "Diferenciais gerados",
        description: "Resultado disponível abaixo",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar diferenciais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" data-testid="button-medical-tools">
            <Stethoscope className="w-4 h-4" />
            Ferramentas Médicas
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Restrito</DialogTitle>
            <DialogDescription>
              As ferramentas médicas estão disponíveis apenas para médicos e estudantes de medicina.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-medical-tools">
          <Stethoscope className="w-4 h-4" />
          Ferramentas Médicas
          <Badge variant="secondary" className="ml-1">
            PRO
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Ferramentas Profissionais
          </DialogTitle>
          <DialogDescription>
            Ferramentas de apoio à decisão clínica para {userRole === "medico" ? "médicos" : "estudantes de medicina"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="posologia" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="posologia" data-testid="tab-posologia">
              <Pill className="w-4 h-4 mr-1" />
              Posologia
            </TabsTrigger>
            <TabsTrigger value="calculadora" data-testid="tab-calculadora">
              <Calculator className="w-4 h-4 mr-1" />
              Calculadoras
            </TabsTrigger>
            <TabsTrigger value="conduta" data-testid="tab-conduta">
              <FileText className="w-4 h-4 mr-1" />
              Conduta
            </TabsTrigger>
            <TabsTrigger value="exames" data-testid="tab-exames">
              <FileText className="w-4 h-4 mr-1" />
              Exames
            </TabsTrigger>
            <TabsTrigger value="diferenciais" data-testid="tab-diferenciais">
              <AlertCircle className="w-4 h-4 mr-1" />
              Diferenciais
            </TabsTrigger>
          </TabsList>

          {/* POSOLOGIA */}
          <TabsContent value="posologia" className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md text-center shadow-lg">
              <CardContent className="pt-12 pb-10 px-8 space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#00A86B]/10 dark:bg-[#00A86B]/20 flex items-center justify-center">
                    <Pill className="w-10 h-10 text-[#00A86B]" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-[#00A86B]">
                    PosologiaCerta
                  </h3>
                  <p className="text-muted-foreground">
                    Em breve — módulo completo de cálculo e ajuste de doses integrado ao MédicoHelp.
                  </p>
                </div>

                <Button 
                  disabled 
                  className="w-full bg-[#00A86B] hover:bg-[#00A86B]/90"
                  data-testid="button-acessar-posologiacerta"
                >
                  Acessar PosologiaCerta
                </Button>

                <p className="text-xs text-muted-foreground/70">
                  Versão Beta exclusiva para médicos
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CALCULADORA */}
          <TabsContent value="calculadora" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calculadoras Clínicas</CardTitle>
                <CardDescription>
                  Scores e calculadoras médicas (Alvarado, CURB-65, Wells, etc)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calc-select">Selecione a Calculadora</Label>
                  <Select
                    value={calculadoraSelecionada}
                    onValueChange={setCalculadoraSelecionada}
                  >
                    <SelectTrigger id="calc-select" data-testid="select-calculadora">
                      <SelectValue placeholder="Escolha uma calculadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alvarado">Alvarado (Apendicite)</SelectItem>
                      <SelectItem value="curb65">CURB-65 (Pneumonia)</SelectItem>
                      <SelectItem value="centor">Centor/McIsaac (Faringite)</SelectItem>
                      <SelectItem value="wells_dvt">Wells TVP</SelectItem>
                      <SelectItem value="wells_pe">Wells EP</SelectItem>
                      <SelectItem value="perc">PERC (EP)</SelectItem>
                      <SelectItem value="chadsvasc">CHA2DS2-VASc (FA)</SelectItem>
                      <SelectItem value="qsofa">qSOFA (Sepse)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variaveis">Variáveis (formato JSON)</Label>
                  <Textarea
                    id="variaveis"
                    placeholder='{"febre": true, "leucocitose": true, "idade": 65}'
                    value={variaveisCalc}
                    onChange={(e) => setVariaveisCalc(e.target.value)}
                    className="font-mono text-sm"
                    rows={4}
                    data-testid="input-variaveis-calc"
                  />
                  <p className="text-xs text-muted-foreground">
                    Forneça as variáveis no formato JSON. Exemplo: {"{"}"febre": true, "idade": 65{"}"}
                  </p>
                </div>
                <Button
                  onClick={handleCalculadora}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-calcular"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    "Calcular Score"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONDUTA */}
          <TabsContent value="conduta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sugestão de Conduta</CardTitle>
                <CardDescription>
                  Orientações gerais de manejo clínico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quadro-conduta">Quadro Clínico *</Label>
                  <Textarea
                    id="quadro-conduta"
                    placeholder="Descreva o quadro clínico..."
                    value={quadroConduta}
                    onChange={(e) => setQuadroConduta(e.target.value)}
                    rows={4}
                    data-testid="input-quadro-conduta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resumo-conduta">Resumo Adicional (opcional)</Label>
                  <Textarea
                    id="resumo-conduta"
                    placeholder="Informações complementares..."
                    value={resumoConduta}
                    onChange={(e) => setResumoConduta(e.target.value)}
                    rows={2}
                    data-testid="input-resumo-conduta"
                  />
                </div>
                <Button
                  onClick={handleConduta}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-gerar-conduta"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar Conduta"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EXAMES */}
          <TabsContent value="exames" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sugestão de Exames</CardTitle>
                <CardDescription>
                  Exames complementares para investigação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quadro-exames">Quadro Clínico *</Label>
                  <Textarea
                    id="quadro-exames"
                    placeholder="Descreva o quadro clínico..."
                    value={quadroExames}
                    onChange={(e) => setQuadroExames(e.target.value)}
                    rows={5}
                    data-testid="input-quadro-exames"
                  />
                </div>
                <Button
                  onClick={handleExames}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-sugerir-exames"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sugerindo...
                    </>
                  ) : (
                    "Sugerir Exames"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DIFERENCIAIS */}
          <TabsContent value="diferenciais" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagnósticos Diferenciais</CardTitle>
                <CardDescription>
                  Lista de possíveis diagnósticos com probabilidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quadro-diferenciais">Quadro Clínico *</Label>
                  <Textarea
                    id="quadro-diferenciais"
                    placeholder="Descreva o quadro clínico..."
                    value={quadroDiferenciais}
                    onChange={(e) => setQuadroDiferenciais(e.target.value)}
                    rows={5}
                    data-testid="input-quadro-diferenciais"
                  />
                </div>
                <Button
                  onClick={handleDiferenciais}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-gerar-diferenciais"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar Diferenciais"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result Display */}
        {result && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Resultado</CardTitle>
              {result.disclaimer && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200" data-testid="text-disclaimer">
                    {result.disclaimer}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
