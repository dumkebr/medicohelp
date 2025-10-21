import { useState } from "react";
import { Calculator, Pill, Stethoscope, FileText, AlertCircle, Loader2, Copy, Printer, History, Check, Activity } from "lucide-react";
import { ALL_CALCULATORS, CalculatorSchema, CalculatorResult } from "@/lib/calculatorSchemas";
import { Partogram } from "@/components/Partogram";
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
  const [selectedCalc, setSelectedCalc] = useState<CalculatorSchema | null>(null);
  const [calcValues, setCalcValues] = useState<Record<string, any>>({});
  const [calcResult, setCalcResult] = useState<CalculatorResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Conduta states
  const [quadroConduta, setQuadroConduta] = useState("");
  const [resumoConduta, setResumoConduta] = useState("");

  // Exames states
  const [quadroExames, setQuadroExames] = useState("");

  // Diferenciais states
  const [quadroDiferenciais, setQuadroDiferenciais] = useState("");

  const hasAccess = userRole === "medico" || userRole === "estudante";

  const handleCalculate = () => {
    if (!selectedCalc) return;

    // Validate required fields - check for undefined or empty string, not falsy (to allow false and 0)
    const missingFields = selectedCalc.inputs
      .filter((input) => {
        if (!input.required) return false;
        const value = calcValues[input.key];
        // Allow false, 0, and other falsy values except undefined and empty string
        return value === undefined || value === "";
      })
      .map((input) => input.label);

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios faltando",
        description: `Preencha: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const result = selectedCalc.compute(calcValues);
    setCalcResult(result);

    // Save to history
    saveToHistory({
      calculatorId: selectedCalc.id,
      calculatorName: selectedCalc.name,
      values: calcValues,
      result,
      timestamp: new Date().toISOString(),
    });
  };

  const saveToHistory = (entry: any) => {
    try {
      const history = JSON.parse(localStorage.getItem("calc_history") || "[]");
      history.unshift(entry);
      const trimmed = history.slice(0, 20); // Keep last 20
      localStorage.setItem("calc_history", JSON.stringify(trimmed));
    } catch (err) {
      console.error("Failed to save history", err);
    }
  };

  const copyResult = () => {
    if (!calcResult || !selectedCalc) return;
    let text = `${selectedCalc.name}\n`;
    if (calcResult.score !== undefined) text += `Score: ${calcResult.score}\n`;
    text += `\n${calcResult.interpretation}\n`;
    if (selectedCalc.refs.length > 0) {
      text += `\nReferências:\n${selectedCalc.refs.join("\n")}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado!", description: "Resultado copiado para área de transferência" });
  };

  const printResult = () => {
    window.print();
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="posologia" data-testid="tab-posologia">
              <Pill className="w-4 h-4 mr-1" />
              Posologia
            </TabsTrigger>
            <TabsTrigger value="calculadora" data-testid="tab-calculadora">
              <Calculator className="w-4 h-4 mr-1" />
              Calculadoras
            </TabsTrigger>
            <TabsTrigger value="partograma" data-testid="tab-partograma">
              <Activity className="w-4 h-4 mr-1" />
              Partograma
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
            {/* Disclaimer */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Ferramenta de apoio à decisão clínica.</strong> Não substitui o julgamento clínico e a avaliação individual do paciente.
              </p>
            </div>

            {/* Calculator Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selecione uma Calculadora</CardTitle>
                <CardDescription>
                  Scores e calculadoras médicas com formulários intuitivos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calc-select">Calculadora</Label>
                  <Select
                    value={selectedCalc?.id || ""}
                    onValueChange={(value) => {
                      const calc = ALL_CALCULATORS.find((c) => c.id === value);
                      setSelectedCalc(calc || null);
                      setCalcValues({});
                      setCalcResult(null);
                    }}
                  >
                    <SelectTrigger id="calc-select" data-testid="select-calculadora">
                      <SelectValue placeholder="Escolha uma calculadora..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Clínico
                      </div>
                      {ALL_CALCULATORS.filter((c) => c.group === "Clínico").map((calc) => (
                        <SelectItem key={calc.id} value={calc.id}>
                          {calc.name}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                        Obstetrícia
                      </div>
                      {ALL_CALCULATORS.filter((c) => c.group === "Obstetrícia").map((calc) => (
                        <SelectItem key={calc.id} value={calc.id}>
                          {calc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCalc && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">{selectedCalc.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Form */}
            {selectedCalc && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedCalc.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCalc.inputs.map((input) => (
                    <div key={input.key} className="space-y-2">
                      <Label htmlFor={`input-${input.key}`}>
                        {input.label} {input.required && <span className="text-destructive">*</span>}
                      </Label>
                      {input.type === "boolean" && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`input-${input.key}`}
                            checked={calcValues[input.key] || false}
                            onCheckedChange={(checked) =>
                              setCalcValues({ ...calcValues, [input.key]: checked })
                            }
                            data-testid={`input-${input.key}`}
                          />
                          <Label htmlFor={`input-${input.key}`} className="text-sm font-normal">
                            {input.hint || "Sim/Não"}
                          </Label>
                        </div>
                      )}
                      {input.type === "number" && (
                        <>
                          <Input
                            id={`input-${input.key}`}
                            type="number"
                            min={input.min}
                            max={input.max}
                            step={input.step || 1}
                            value={calcValues[input.key] || ""}
                            onChange={(e) =>
                              setCalcValues({ ...calcValues, [input.key]: e.target.value })
                            }
                            data-testid={`input-${input.key}`}
                          />
                          {input.hint && (
                            <p className="text-xs text-muted-foreground">{input.hint}</p>
                          )}
                        </>
                      )}
                      {input.type === "select" && input.options && (
                        <Select
                          value={String(calcValues[input.key] || "")}
                          onValueChange={(value) =>
                            setCalcValues({ ...calcValues, [input.key]: value })
                          }
                        >
                          <SelectTrigger id={`input-${input.key}`} data-testid={`input-${input.key}`}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {input.options.map((opt) => (
                              <SelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {input.type === "date" && (
                        <Input
                          id={`input-${input.key}`}
                          type="date"
                          value={calcValues[input.key] || ""}
                          onChange={(e) =>
                            setCalcValues({ ...calcValues, [input.key]: e.target.value })
                          }
                          data-testid={`input-${input.key}`}
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={handleCalculate}
                    className="w-full"
                    data-testid="button-calcular"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Result Card */}
            {calcResult && selectedCalc && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Resultado</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyResult}
                        data-testid="button-copy-result"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={printResult}
                        data-testid="button-print-result"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {calcResult.score !== undefined && (
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Score</div>
                      <div className="text-4xl font-bold text-[#00A86B]">{calcResult.score}</div>
                    </div>
                  )}
                  {calcResult.value !== undefined && (
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Valor</div>
                      <div className="text-4xl font-bold text-[#00A86B]">{calcResult.value}</div>
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-md border-l-4 ${
                      calcResult.severity === "high"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                        : calcResult.severity === "moderate"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                        : calcResult.severity === "low"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{calcResult.interpretation}</p>
                  </div>
                  {selectedCalc.refs.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="font-semibold">Referências:</div>
                      {selectedCalc.refs.map((ref, idx) => (
                        <div key={idx}>• {ref}</div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PARTOGRAMA */}
          <TabsContent value="partograma" className="space-y-4">
            <Partogram />
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
