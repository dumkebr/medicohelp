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

  // Posologia states
  const [principioAtivo, setPrincipioAtivo] = useState("");
  const [indicacao, setIndicacao] = useState("");
  const [idadeAnos, setIdadeAnos] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [creatClear, setCreatClear] = useState("");
  const [gravidez, setGravidez] = useState(false);
  const [lactacao, setLactacao] = useState(false);
  const [alergias, setAlergias] = useState("");

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

  const handlePosologia = async () => {
    if (!principioAtivo || !indicacao) {
      toast({
        title: "Dados incompletos",
        description: "Preencha ao menos Princípio Ativo e Indicação",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload: any = {
        principio_ativo: principioAtivo,
        indicacao,
      };

      if (idadeAnos) payload.idade_anos = parseInt(idadeAnos);
      if (pesoKg) payload.peso_kg = parseFloat(pesoKg);
      if (creatClear) payload.creatinina_clear_mlmin = parseFloat(creatClear);
      if (gravidez) payload.gravidez = true;
      if (lactacao) payload.lactacao = true;
      if (alergias) payload.alergias = alergias.split(",").map(a => a.trim());

      const response = await apiRequest("POST", "/api/tools/posologia", payload);
      const data = await response.json();
      setResult(data);
      toast({
        title: "Posologia consultada",
        description: "Resultado disponível abaixo",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao consultar posologia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <TabsContent value="posologia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consulta de Posologia</CardTitle>
                <CardDescription>
                  Informações de dosagem, ajustes e contraindicações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principio-ativo">Princípio Ativo *</Label>
                    <Input
                      id="principio-ativo"
                      placeholder="Ex: Amoxicilina"
                      value={principioAtivo}
                      onChange={(e) => setPrincipioAtivo(e.target.value)}
                      data-testid="input-principio-ativo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="indicacao">Indicação *</Label>
                    <Input
                      id="indicacao"
                      placeholder="Ex: Pneumonia comunitária"
                      value={indicacao}
                      onChange={(e) => setIndicacao(e.target.value)}
                      data-testid="input-indicacao"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idade">Idade (anos)</Label>
                    <Input
                      id="idade"
                      type="number"
                      placeholder="Ex: 45"
                      value={idadeAnos}
                      onChange={(e) => setIdadeAnos(e.target.value)}
                      data-testid="input-idade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      placeholder="Ex: 70"
                      value={pesoKg}
                      onChange={(e) => setPesoKg(e.target.value)}
                      data-testid="input-peso"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creat">Clearance Creatinina (mL/min)</Label>
                    <Input
                      id="creat"
                      type="number"
                      placeholder="Ex: 90"
                      value={creatClear}
                      onChange={(e) => setCreatClear(e.target.value)}
                      data-testid="input-creat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alergias">Alergias (separadas por vírgula)</Label>
                    <Input
                      id="alergias"
                      placeholder="Ex: penicilina, sulfa"
                      value={alergias}
                      onChange={(e) => setAlergias(e.target.value)}
                      data-testid="input-alergias"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="gravidez"
                      checked={gravidez}
                      onCheckedChange={setGravidez}
                      data-testid="switch-gravidez"
                    />
                    <Label htmlFor="gravidez">Gestante</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="lactacao"
                      checked={lactacao}
                      onCheckedChange={setLactacao}
                      data-testid="switch-lactacao"
                    />
                    <Label htmlFor="lactacao">Lactante</Label>
                  </div>
                </div>
                <Button
                  onClick={handlePosologia}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-consultar-posologia"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    "Consultar Posologia"
                  )}
                </Button>
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
