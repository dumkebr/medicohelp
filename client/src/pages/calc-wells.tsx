import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const WELLS_ITEMS = [
  { key: "dvt", label: "Sinais clínicos de TVP (edema, dor à palpação)", score: 3 },
  { key: "pelikely", label: "TEP mais provável que diagnósticos alternativos", score: 3 },
  { key: "taquicardia", label: "FC > 100 bpm", score: 1.5 },
  { key: "imobilizacao", label: "Imobilização ≥3 dias ou cirurgia nas últimas 4 semanas", score: 1.5 },
  { key: "previa", label: "TEV prévio (TEP/TVP)", score: 1.5 },
  { key: "hemoptise", label: "Hemoptise", score: 1 },
  { key: "cancer", label: "Câncer ativo", score: 1 },
];

function useWellsScore(state: Record<string, boolean>) {
  return useMemo(() => {
    const sum = WELLS_ITEMS.reduce((acc, it) => acc + (state[it.key] ? it.score : 0), 0);
    const twoTier = sum > 4 ? "Provável TEP (>4)" : "Improvável TEP (≤4)";
    let threeTier = "Baixa";
    if (sum >= 2 && sum <= 6) threeTier = "Moderada";
    if (sum > 6) threeTier = "Alta";
    return { sum, twoTier, threeTier };
  }, [state]);
}

export default function CalcWells() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const { sum, twoTier, threeTier } = useWellsScore(checks);

  const handleCopy = () => {
    const text = `Escore de Wells – TEP
Pontuação: ${sum.toFixed(1)}
Classificação (2 níveis): ${twoTier}
Classificação (3 níveis): ${threeTier}

Critérios selecionados:
${WELLS_ITEMS.filter(it => checks[it.key]).map(it => `• ${it.label} (+${it.score})`).join('\n')}`;
    
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
                Escore de Wells – TEP
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Probabilidade de Tromboembolismo Pulmonar
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Critérios Clínicos</CardTitle>
            <CardDescription>
              Marque os critérios que se aplicam ao paciente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {WELLS_ITEMS.map((item) => (
              <div key={item.key} className="flex items-start space-x-3">
                <Checkbox
                  id={item.key}
                  checked={!!checks[item.key]}
                  onCheckedChange={(checked) =>
                    setChecks((prev) => ({ ...prev, [item.key]: !!checked }))
                  }
                  data-testid={`checkbox-${item.key}`}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={item.key}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {item.label}
                    <span className="text-[#3cb371] font-medium ml-2">
                      +{item.score}
                    </span>
                  </Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* RESULTADOS */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-[#3cb371]/10 border-[#3cb371]/30">
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Pontuação Total</div>
              <div className="text-3xl font-semibold text-[#3cb371] mt-1">
                {sum.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Classificação (2 níveis)
              </div>
              <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mt-1">
                {twoTier}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Probabilidade (3 níveis)
              </div>
              <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mt-1">
                {threeTier}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* INTERPRETAÇÃO */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Interpretação Clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <p>
              <strong>Classificação tradicional (3 níveis):</strong>
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>0–1 pontos: Probabilidade baixa</li>
              <li>2–6 pontos: Probabilidade moderada</li>
              <li>&gt;6 pontos: Probabilidade alta</li>
            </ul>

            <p className="mt-4">
              <strong>Classificação simplificada (2 níveis):</strong>
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>≤4 pontos: TEP improvável → Solicitar D-dímero</li>
              <li>&gt;4 pontos: TEP provável → Prosseguir com imagem (angio-TC)</li>
            </ul>

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Importante:</strong> O escore de Wells deve ser usado em conjunto com a avaliação
                clínica completa e exames complementares. Não substitui o julgamento médico.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AÇÕES */}
        <div className="flex gap-3 mt-6">
          <Button onClick={handleCopy} className="bg-[#3cb371] hover:bg-[#2f9e62]">
            Copiar Resultado
          </Button>
          <Button
            variant="outline"
            onClick={() => setChecks({})}
          >
            Limpar
          </Button>
        </div>
      </main>
    </div>
  );
}
