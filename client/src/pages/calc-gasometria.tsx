import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

function parse(v: string) {
  const n = Number(v);
  return isFinite(n) ? n : NaN;
}

function winterExpectedPCO2(hco3: number) {
  return 1.5 * hco3 + 8;
}

function expectedPCO2MetabolicAlk(hco3: number) {
  return 0.7 * hco3 + 20;
}

function classifyAcidBase(pH: number) {
  if (!isFinite(pH)) return "";
  if (pH < 7.35) return "Acidemia";
  if (pH > 7.45) return "Alcalemia";
  return "pH normal";
}

function respMetabolicPrimary(pH: number, pco2: number, hco3: number) {
  if (!isFinite(pH) || !isFinite(pco2) || !isFinite(hco3)) return "";
  const acidemia = pH < 7.35;
  const alcalemia = pH > 7.45;
  
  if (acidemia) {
    return hco3 < 22 ? "Metabólica (acidose)" : "Respiratória (acidose)";
  }
  if (alcalemia) {
    return hco3 > 26 ? "Metabólica (alcalose)" : "Respiratória (alcalose)";
  }
  return "Indefinido/compensado";
}

export default function CalcGasometria() {
  const [form, setForm] = useState({
    tipo: "arterial",
    pH: "",
    pCO2: "",
    HCO3: "",
    Na: "",
    Cl: "",
    Albumina: "",
    Lactato: "",
    PaO2: "",
    FiO2: "21",
  });

  const pH = parse(form.pH);
  const pCO2 = parse(form.pCO2);
  const HCO3 = parse(form.HCO3);
  const NaV = parse(form.Na);
  const ClV = parse(form.Cl);
  const Alb = parse(form.Albumina);
  const Lac = parse(form.Lactato);
  const PaO2 = parse(form.PaO2);
  const FiO2 = parse(form.FiO2);

  const ag = isFinite(NaV) && isFinite(ClV) && isFinite(HCO3) ? NaV - (ClV + HCO3) : NaN;
  const agCorr = isFinite(ag) && isFinite(Alb) ? ag + 2.5 * (4 - Alb) : ag;
  const acidBase = classifyAcidBase(pH);
  const prim = respMetabolicPrimary(pH, pCO2, HCO3);

  const winter = isFinite(HCO3) ? winterExpectedPCO2(HCO3) : NaN;
  const metabAlkExp = isFinite(HCO3) ? expectedPCO2MetabolicAlk(HCO3) : NaN;

  const aagrad = useMemo(() => {
    if (form.tipo !== "arterial") return NaN;
    if (!isFinite(PaO2) || !isFinite(pCO2) || !isFinite(FiO2)) return NaN;
    const fio2 = FiO2 / 100;
    const PAO2 = fio2 * (760 - 47) - pCO2 / 0.8;
    return PAO2 - PaO2;
  }, [form.tipo, PaO2, pCO2, FiO2]);

  function set(k: string, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  const compText = useMemo(() => {
    if (!isFinite(pCO2) || !isFinite(HCO3)) return "";
    const out: string[] = [];
    
    if (prim.startsWith("Metabólica (acidose)")) {
      if (isFinite(winter)) out.push(`Esperado pCO₂ (Winter): ${winter.toFixed(1)} ±2 mmHg`);
      if (isFinite(pCO2) && isFinite(winter)) {
        const diff = pCO2 - winter;
        if (Math.abs(diff) > 3) {
          out.push(diff > 0 ? "Hipoventilação relativa (componente respiratório)" : "Hiperventilação relativa (componente respiratório)");
        }
      }
    } else if (prim.startsWith("Metabólica (alcalose)")) {
      if (isFinite(metabAlkExp)) out.push(`Esperado pCO₂: ${metabAlkExp.toFixed(1)} ±5 mmHg`);
    }
    
    if (isFinite(ag)) {
      out.push(`Ânion gap: ${ag.toFixed(1)} mEq/L${isFinite(agCorr) && agCorr !== ag ? ` (corrigido: ${agCorr.toFixed(1)})` : ""}`);
      if (isFinite(Lac)) out.push(`Lactato: ${Lac.toFixed(2)} mmol/L`);
    }
    
    if (form.tipo === "arterial" && isFinite(aagrad)) {
      out.push(`Gradiente A–a: ${aagrad.toFixed(0)} mmHg`);
    }
    
    return out.join("\n");
  }, [prim, winter, metabAlkExp, ag, agCorr, Lac, form.tipo, aagrad, pCO2, HCO3]);

  const handleCopy = () => {
    const text = `Gasometria ${form.tipo === "arterial" ? "Arterial" : "Venosa"}
pH: ${isFinite(pH) ? pH.toFixed(3) : "—"} (${acidBase})
pCO₂: ${isFinite(pCO2) ? pCO2.toFixed(1) : "—"} mmHg
HCO₃⁻: ${isFinite(HCO3) ? HCO3.toFixed(1) : "—"} mEq/L
Distúrbio primário: ${prim}

${compText}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                Gasometria Arterial/Venosa
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Análise completa com ânion gap e compensação
              </p>
            </div>
            <Link href="/avancado">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Gasometria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arterial">Arterial</SelectItem>
                    <SelectItem value="venosa">Venosa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pH">pH</Label>
                <Input
                  id="pH"
                  type="number"
                  step="0.01"
                  value={form.pH}
                  onChange={(e) => set("pH", e.target.value)}
                  placeholder="7.40"
                />
              </div>
              <div>
                <Label htmlFor="pCO2">pCO₂ (mmHg)</Label>
                <Input
                  id="pCO2"
                  type="number"
                  step="0.1"
                  value={form.pCO2}
                  onChange={(e) => set("pCO2", e.target.value)}
                  placeholder="40"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="HCO3">HCO₃⁻ (mEq/L)</Label>
                <Input
                  id="HCO3"
                  type="number"
                  step="0.1"
                  value={form.HCO3}
                  onChange={(e) => set("HCO3", e.target.value)}
                  placeholder="24"
                />
              </div>
              <div>
                <Label htmlFor="Na">Sódio (mEq/L)</Label>
                <Input
                  id="Na"
                  type="number"
                  step="0.1"
                  value={form.Na}
                  onChange={(e) => set("Na", e.target.value)}
                  placeholder="140"
                />
              </div>
              <div>
                <Label htmlFor="Cl">Cloro (mEq/L)</Label>
                <Input
                  id="Cl"
                  type="number"
                  step="0.1"
                  value={form.Cl}
                  onChange={(e) => set("Cl", e.target.value)}
                  placeholder="104"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="Albumina">Albumina (g/dL) – opcional</Label>
                <Input
                  id="Albumina"
                  type="number"
                  step="0.1"
                  value={form.Albumina}
                  onChange={(e) => set("Albumina", e.target.value)}
                  placeholder="4.0"
                />
              </div>
              <div>
                <Label htmlFor="Lactato">Lactato (mmol/L) – opcional</Label>
                <Input
                  id="Lactato"
                  type="number"
                  step="0.1"
                  value={form.Lactato}
                  onChange={(e) => set("Lactato", e.target.value)}
                  placeholder="1.0"
                />
              </div>
            </div>

            {form.tipo === "arterial" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="PaO2">PaO₂ (mmHg)</Label>
                  <Input
                    id="PaO2"
                    type="number"
                    step="0.1"
                    value={form.PaO2}
                    onChange={(e) => set("PaO2", e.target.value)}
                    placeholder="95"
                  />
                </div>
                <div>
                  <Label htmlFor="FiO2">FiO₂ (%)</Label>
                  <Input
                    id="FiO2"
                    type="number"
                    step="1"
                    value={form.FiO2}
                    onChange={(e) => set("FiO2", e.target.value)}
                    placeholder="21"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RESULTADOS */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-[#3cb371]/10 border-[#3cb371]/30">
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">pH</div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                {isFinite(pH) ? pH.toFixed(3) : "—"}
              </div>
              <div className="text-xs text-neutral-500 mt-1">{acidBase}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Distúrbio Primário</div>
              <div className="text-base font-medium text-neutral-900 dark:text-neutral-100 mt-1">
                {prim || "—"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Ânion Gap</div>
              <div className="text-base font-medium text-neutral-900 dark:text-neutral-100 mt-1">
                {isFinite(ag) ? `${ag.toFixed(1)} mEq/L` : "—"}
              </div>
              {isFinite(agCorr) && agCorr !== ag && (
                <div className="text-xs text-neutral-500 mt-1">
                  Corrigido: {agCorr.toFixed(1)} mEq/L
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* INTERPRETAÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle>Interpretação e Compensação</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 font-sans">
              {compText || "Preencha pH, pCO₂ e HCO₃⁻ para ver a interpretação."}
            </pre>
          </CardContent>
        </Card>

        {/* REGRAS */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Utilizadas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-700 dark:text-neutral-300">
            <ul className="list-disc ml-5 space-y-1">
              <li>Acidemia &lt; 7,35 | Alcalemia &gt; 7,45</li>
              <li>Acidose metabólica: fórmula de Winter pCO₂ ≈ 1,5×HCO₃⁻ + 8 (±2)</li>
              <li>Alcalose metabólica: pCO₂ esperado ≈ 0,7×HCO₃⁻ + 20 (±5)</li>
              <li>Ânion gap = Na⁺ − (Cl⁻ + HCO₃⁻). Correção por albumina: +2,5×(4 − albumina)</li>
              <li>Gradiente A–a (arterial): PAO₂ = FiO₂×(760−47) − pCO₂/0,8; A–a = PAO₂ − PaO₂</li>
            </ul>
          </CardContent>
        </Card>

        {/* AÇÕES */}
        <div className="flex gap-3">
          <Button onClick={handleCopy} className="bg-[#3cb371] hover:bg-[#2f9e62]">
            Copiar Resultado
          </Button>
          <Button variant="outline" onClick={() => setForm({
            tipo: "arterial",
            pH: "",
            pCO2: "",
            HCO3: "",
            Na: "",
            Cl: "",
            Albumina: "",
            Lactato: "",
            PaO2: "",
            FiO2: "21",
          })}>
            Limpar
          </Button>
        </div>
      </main>
    </div>
  );
}
