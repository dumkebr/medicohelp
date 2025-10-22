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

  const [selectedCalc, setSelectedCalc] = useState<CalculatorSchema | null>(null);
  const [calcValues, setCalcValues] = useState<Record<string, any>>({});
  const [calcResult, setCalcResult] = useState<CalculatorResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [quadroConduta, setQuadroConduta] = useState("");
  const [resumoConduta, setResumoConduta] = useState("");

  const [quadroExames, setQuadroExames] = useState("");

  const [quadroDiferenciais, setQuadroDiferenciais] = useState("");

  const hasAccess = userRole === "medico" || userRole === "estudante";

  const handleCalculate = () => {
    if (!selectedCalc) return;

    const missingFields = selectedCalc.inputs
      .filter((input) => {
        if (!input.required) return false;
        const value = calcValues[input.key];
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
      const trimmed = history.slice(0, 20);
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
      <DialogContent className="mh-tools-modal max-w-[900px] max-h-[85vh] overflow-hidden p-0 bg-white dark:bg-[#0f1418] border-neutral-200 dark:border-[#26303a] shadow-xl">
        <div className="h-full flex flex-col overflow-hidden">
          {/* HEADER COMPACTO */}
          <div className="px-6 pt-5 pb-3 border-b border-neutral-200 dark:border-[#26303a]">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl font-semibold text-neutral-900 dark:text-[#e6edf3]">
              <Stethoscope className="w-5 h-5 text-[#3cb371]" />
              Ferramentas Profissionais
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-neutral-600 dark:text-[#9fb3c8] mt-1">
              Ferramentas de apoio à decisão clínica para {userRole === "medico" ? "médicos" : "estudantes de medicina"}
            </DialogDescription>
          </div>

          {/* TABS + CONTENT AREA */}
          <Tabs defaultValue="posologia" className="flex-1 flex flex-col overflow-hidden">
            {/* TABS BAR */}
            <TabsList className="grid w-full grid-cols-6 bg-[#f8f9f9] dark:bg-[#10161b] rounded-none border-b border-neutral-200 dark:border-[#26303a] p-0 h-auto">
              <TabsTrigger 
                value="posologia" 
                data-testid="tab-posologia"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b21] data-[state=active]:text-neutral-900 dark:data-[state=active]:text-[#e6edf3] data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#3cb371] transition-all duration-200 hover:bg-[#e9f8f0] dark:hover:bg-[#11221b] rounded-none font-medium text-sm py-3 text-neutral-700 dark:text-[#9fb3c8]"
              >
                <span className="mr-1.5">💊</span>
                Posologia
              </TabsTrigger>
              <TabsTrigger 
                value="calculadora" 
                data-testid="tab-calculadora"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b21] data-[state=active]:text-neutral-900 dark:data-[state=active]:text-[#e6edf3] data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#3cb371] transition-all duration-200 hover:bg-[#e9f8f0] dark:hover:bg-[#11221b] rounded-none font-medium text-sm py-3 text-neutral-700 dark:text-[#9fb3c8]"
              >
                <span className="mr-1.5">📊</span>
                Calculadoras
              </TabsTrigger>
              <TabsTrigger 
                value="partograma" 
                data-testid="tab-partograma"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b21] data-[state=active]:text-neutral-900 dark:data-[state=active]:text-[#e6edf3] data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#3cb371] transition-all duration-200 hover:bg-[#e9f8f0] dark:hover:bg-[#11221b] rounded-none font-medium text-sm py-3 text-neutral-700 dark:text-[#9fb3c8]"
              >
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                Partograma
              </TabsTrigger>
              <TabsTrigger 
                value="conduta" 
                data-testid="tab-conduta"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b21] data-[state=active]:text-neutral-900 dark:data-[state=active]:text-[#e6edf3] data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#3cb371] transition-all duration-200 hover:bg-[#e9f8f0] dark:hover:bg-[#11221b] rounded-none font-medium text-sm py-3 text-neutral-700 dark:text-[#9fb3c8]"
              >
                <span className="mr-1.5">📋</span>
                Conduta
              </TabsTrigger>
              <TabsTrigger 
                value="exames" 
                data-testid="tab-exames"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b21] data-[state=active]:text-neutral-900 dark:data-[state=active]:text-[#e6edf3] data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#3cb371] transition-all duration-200 hover:bg-[#e9f8f0] dark:hover:bg-[#11221b] rounded-none font-medium text-sm py-3 text-neutral-700 dark:text-[#9fb3c8]"
              >
                <span className="mr-1.5">🧪</span>
                Exames
              </TabsTrigger>
              <TabsTrigger 
                value="diferenciais" 
                data-testid="tab-diferenciais"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#151b21] data-[state=active]:text-neutral-900 dark:data-[state=active]:text-[#e6edf3] data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#3cb371] transition-all duration-200 hover:bg-[#e9f8f0] dark:hover:bg-[#11221b] rounded-none font-medium text-sm py-3 text-neutral-700 dark:text-[#9fb3c8]"
              >
                <span className="mr-1.5">⚖️</span>
                Diferenciais
              </TabsTrigger>
            </TabsList>

            {/* CONTENT SCROLLABLE */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* POSOLOGIA */}
                <TabsContent value="posologia" className="mt-0 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-center py-8">
                    <Card className="w-full max-w-md text-center shadow-sm border-neutral-200 dark:border-[#26303a] bg-white dark:bg-[#151b21]">
                      <CardContent className="pt-10 pb-8 px-6 space-y-5">
                        <div className="flex justify-center">
                          <div className="w-16 h-16 rounded-full bg-[#00A86B]/10 dark:bg-[#0f1c16] border border-[#00A86B]/20 dark:border-[#214433] flex items-center justify-center">
                            <Pill className="w-8 h-8 text-[#00A86B]" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-[#00A86B]">
                            PosologiaCerta
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-[#9fb3c8]">
                            Em breve — módulo completo de cálculo e ajuste de doses integrado ao MédicoHelp.
                          </p>
                        </div>

                        <Button 
                          disabled 
                          className="w-full bg-[#00A86B] hover:bg-[#00A86B]/90 disabled:opacity-60"
                          data-testid="button-acessar-posologiacerta"
                        >
                          Acessar PosologiaCerta
                        </Button>

                        <p className="text-xs text-neutral-500 dark:text-[#9fb3c8]/70">
                          Versão Beta exclusiva para médicos
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* CALCULADORA */}
                <TabsContent value="calculadora" className="mt-0 space-y-4 animate-in fade-in-50 duration-200">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Ferramenta de apoio à decisão clínica.</strong> Não substitui o julgamento clínico e a avaliação individual do paciente.
                    </p>
                  </div>

                  <Card className="border-neutral-200 dark:border-[#26303a] bg-white dark:bg-[#151b21] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base text-neutral-900 dark:text-[#e6edf3]">Selecione uma Calculadora</CardTitle>
                      <CardDescription className="text-sm text-neutral-600 dark:text-[#9fb3c8]">
                        Scores e calculadoras médicas com formulários intuitivos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="calc-select" className="text-sm text-neutral-900 dark:text-[#e6edf3]">Calculadora</Label>
                        <Select
                          value={selectedCalc?.id || ""}
                          onValueChange={(value) => {
                            const calc = ALL_CALCULATORS.find((c) => c.id === value);
                            setSelectedCalc(calc || null);
                            setCalcValues({});
                            setCalcResult(null);
                          }}
                        >
                          <SelectTrigger id="calc-select" data-testid="select-calculadora" className="h-10 bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20">
                            <SelectValue placeholder="Escolha uma calculadora..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1b232b] border-neutral-200 dark:border-[#26303a]">
                            <div className="px-2 py-1.5 text-xs font-semibold text-neutral-600 dark:text-[#9fb3c8]">
                              Clínico
                            </div>
                            {ALL_CALCULATORS.filter((c) => c.group === "Clínico").map((calc) => (
                              <SelectItem key={calc.id} value={calc.id} className="text-neutral-900 dark:text-[#e6edf3] focus:bg-neutral-100 dark:focus:bg-[#1b232b]">
                                {calc.name}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-neutral-600 dark:text-[#9fb3c8] mt-2">
                              Obstetrícia
                            </div>
                            {ALL_CALCULATORS.filter((c) => c.group === "Obstetrícia").map((calc) => (
                              <SelectItem key={calc.id} value={calc.id} className="text-neutral-900 dark:text-[#e6edf3] focus:bg-neutral-100 dark:focus:bg-[#1b232b]">
                                {calc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedCalc && (
                        <div className="pt-1">
                          <p className="text-sm text-neutral-600 dark:text-[#9fb3c8]">{selectedCalc.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedCalc && (
                    <Card className="border-neutral-200 dark:border-[#26303a] bg-white dark:bg-[#151b21] shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base text-neutral-900 dark:text-[#e6edf3]">{selectedCalc.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedCalc.inputs.map((input) => (
                          <div key={input.key} className="space-y-2">
                            <Label htmlFor={`input-${input.key}`} className="text-sm text-neutral-900 dark:text-[#e6edf3]">
                              {input.label} {input.required && <span className="text-red-500">*</span>}
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
                                  className="data-[state=checked]:bg-[#3cb371]"
                                />
                                <Label htmlFor={`input-${input.key}`} className="text-sm font-normal text-neutral-700 dark:text-[#9fb3c8]">
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
                                  className="h-10 bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] placeholder:text-neutral-400 dark:placeholder:text-[#9fb3c8] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20"
                                />
                                {input.hint && (
                                  <p className="text-xs text-neutral-600 dark:text-[#9fb3c8]">{input.hint}</p>
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
                                <SelectTrigger id={`input-${input.key}`} data-testid={`input-${input.key}`} className="h-10 bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1b232b] border-neutral-200 dark:border-[#26303a]">
                                  {input.options.map((opt) => (
                                    <SelectItem key={opt.value} value={String(opt.value)} className="text-neutral-900 dark:text-[#e6edf3] focus:bg-neutral-100 dark:focus:bg-[#1b232b]">
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
                                className="h-10 bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20"
                              />
                            )}
                          </div>
                        ))}
                        <Button
                          onClick={handleCalculate}
                          className="w-full bg-[#3cb371] hover:bg-[#2f9e62] text-white font-semibold h-11 rounded-lg transition-all shadow-sm"
                          data-testid="button-calcular"
                        >
                          <Calculator className="w-4 h-4 mr-2" />
                          Calcular
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {calcResult && selectedCalc && (
                    <Card className="animate-in fade-in-50 duration-300 border-[#dff5e1] dark:border-[#214433] shadow-sm bg-white dark:bg-[#151b21]">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between text-neutral-900 dark:text-[#e6edf3]">
                          <span className="flex items-center gap-2">
                            <span>📋</span>
                            Resultado
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyResult}
                              className="h-8 hover:bg-[#e9f8f0] dark:hover:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] transition-all"
                              data-testid="button-copy-result"
                            >
                              {copied ? (
                                <Check className="w-3.5 h-3.5 text-[#3cb371]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-neutral-700 dark:text-[#9fb3c8]" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={printResult}
                              className="h-8 hover:bg-[#e9f8f0] dark:hover:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] transition-all"
                              data-testid="button-print-result"
                            >
                              <Printer className="w-3.5 h-3.5 text-neutral-700 dark:text-[#9fb3c8]" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {calcResult.score !== undefined && (
                          <div className="text-center p-5 bg-gradient-to-br from-[#e9f8f0] to-[#f0fdf4] dark:from-[#0f1c16] dark:to-[#1a2e26] rounded-xl border border-[#dff5e1] dark:border-[#214433]">
                            <div className="text-sm text-neutral-600 dark:text-[#9fb3c8] mb-1">Score</div>
                            <div className="text-5xl font-bold" style={{ color: '#3cb371' }}>{calcResult.score}</div>
                          </div>
                        )}
                        {calcResult.value !== undefined && (
                          <div className="text-center p-5 bg-gradient-to-br from-[#e9f8f0] to-[#f0fdf4] dark:from-[#0f1c16] dark:to-[#1a2e26] rounded-xl border border-[#dff5e1] dark:border-[#214433]">
                            <div className="text-sm text-neutral-600 dark:text-[#9fb3c8] mb-1">Valor</div>
                            <div className="text-4xl font-bold" style={{ color: '#3cb371' }}>{calcResult.value}</div>
                          </div>
                        )}
                        <div
                          className={`p-4 rounded-lg border-l-4 ${
                            calcResult.severity === "high"
                              ? "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600"
                              : calcResult.severity === "moderate"
                              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-600"
                              : calcResult.severity === "low"
                              ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600"
                              : "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line text-neutral-800 dark:text-[#e6edf3]">{calcResult.interpretation}</p>
                        </div>
                        {selectedCalc.refs.length > 0 && (
                          <div className="text-xs text-neutral-600 dark:text-[#9fb3c8] space-y-1 italic">
                            <div className="font-semibold not-italic">Referências:</div>
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
                <TabsContent value="partograma" className="mt-0 animate-in fade-in-50 duration-200">
                  <Partogram />
                </TabsContent>

                {/* CONDUTA */}
                <TabsContent value="conduta" className="mt-0 space-y-4 animate-in fade-in-50 duration-200">
                  <Card className="border-neutral-200 dark:border-[#26303a] bg-white dark:bg-[#151b21] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base text-neutral-900 dark:text-[#e6edf3]">Sugestão de Conduta</CardTitle>
                      <CardDescription className="text-sm text-neutral-600 dark:text-[#9fb3c8]">
                        Orientações gerais de manejo clínico
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quadro-conduta" className="text-sm text-neutral-900 dark:text-[#e6edf3]">Quadro Clínico *</Label>
                        <Textarea
                          id="quadro-conduta"
                          placeholder="Descreva o quadro clínico..."
                          value={quadroConduta}
                          onChange={(e) => setQuadroConduta(e.target.value)}
                          rows={4}
                          data-testid="input-quadro-conduta"
                          className="bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] placeholder:text-neutral-400 dark:placeholder:text-[#9fb3c8] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resumo-conduta" className="text-sm text-neutral-900 dark:text-[#e6edf3]">Resumo Adicional (opcional)</Label>
                        <Textarea
                          id="resumo-conduta"
                          placeholder="Informações complementares..."
                          value={resumoConduta}
                          onChange={(e) => setResumoConduta(e.target.value)}
                          rows={2}
                          data-testid="input-resumo-conduta"
                          className="bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] placeholder:text-neutral-400 dark:placeholder:text-[#9fb3c8] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20"
                        />
                      </div>
                      <Button
                        onClick={handleConduta}
                        disabled={loading}
                        className="w-full bg-[#3cb371] hover:bg-[#2f9e62] text-white font-semibold h-11 rounded-lg transition-all shadow-sm disabled:opacity-60"
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
                <TabsContent value="exames" className="mt-0 space-y-4 animate-in fade-in-50 duration-200">
                  <Card className="border-neutral-200 dark:border-[#26303a] bg-white dark:bg-[#151b21] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base text-neutral-900 dark:text-[#e6edf3]">Sugestão de Exames</CardTitle>
                      <CardDescription className="text-sm text-neutral-600 dark:text-[#9fb3c8]">
                        Exames complementares para investigação
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quadro-exames" className="text-sm text-neutral-900 dark:text-[#e6edf3]">Quadro Clínico *</Label>
                        <Textarea
                          id="quadro-exames"
                          placeholder="Descreva o quadro clínico..."
                          value={quadroExames}
                          onChange={(e) => setQuadroExames(e.target.value)}
                          rows={5}
                          data-testid="input-quadro-exames"
                          className="bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] placeholder:text-neutral-400 dark:placeholder:text-[#9fb3c8] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20"
                        />
                      </div>
                      <Button
                        onClick={handleExames}
                        disabled={loading}
                        className="w-full bg-[#3cb371] hover:bg-[#2f9e62] text-white font-semibold h-11 rounded-lg transition-all shadow-sm disabled:opacity-60"
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
                <TabsContent value="diferenciais" className="mt-0 space-y-4 animate-in fade-in-50 duration-200">
                  <Card className="border-neutral-200 dark:border-[#26303a] bg-white dark:bg-[#151b21] shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base text-neutral-900 dark:text-[#e6edf3]">Diagnósticos Diferenciais</CardTitle>
                      <CardDescription className="text-sm text-neutral-600 dark:text-[#9fb3c8]">
                        Lista de possíveis diagnósticos com probabilidade
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quadro-diferenciais" className="text-sm text-neutral-900 dark:text-[#e6edf3]">Quadro Clínico *</Label>
                        <Textarea
                          id="quadro-diferenciais"
                          placeholder="Descreva o quadro clínico..."
                          value={quadroDiferenciais}
                          onChange={(e) => setQuadroDiferenciais(e.target.value)}
                          rows={5}
                          data-testid="input-quadro-diferenciais"
                          className="bg-white dark:bg-[#1b232b] border-neutral-300 dark:border-[#26303a] text-neutral-900 dark:text-[#e6edf3] placeholder:text-neutral-400 dark:placeholder:text-[#9fb3c8] focus:border-[#3cb371] dark:focus:border-[#3cb371] focus:ring-[#3cb371]/20"
                        />
                      </div>
                      <Button
                        onClick={handleDiferenciais}
                        disabled={loading}
                        className="w-full bg-[#3cb371] hover:bg-[#2f9e62] text-white font-semibold h-11 rounded-lg transition-all shadow-sm disabled:opacity-60"
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

                {/* RESULT DISPLAY */}
                {result && (
                  <Card className="mt-4 border-neutral-200 dark:border-[#26303a] bg-white dark:bg-[#151b21] shadow-sm animate-in fade-in-50 duration-300">
                    <CardHeader>
                      <CardTitle className="text-base text-neutral-900 dark:text-[#e6edf3]">Resultado</CardTitle>
                      {result.disclaimer && (
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 rounded-md">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200" data-testid="text-disclaimer">
                            {result.disclaimer}
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <pre className="text-xs bg-neutral-50 dark:bg-[#1b232b] text-neutral-900 dark:text-[#e6edf3] p-4 rounded-md overflow-x-auto whitespace-pre-wrap border border-neutral-200 dark:border-[#26303a]">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
