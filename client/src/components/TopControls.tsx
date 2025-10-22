import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

type Tab = "clinico" | "evidencias" | "calculadoras";

interface TopControlsProps {
  initialTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onOpenCalculator?: (id: string) => void;
}

export default function TopControls({
  initialTab = "clinico",
  onTabChange,
  onOpenCalculator,
}: TopControlsProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const setTabAndNotify = (next: Tab) => {
    setTab(next);
    onTabChange?.(next);
  };

  const openCalc = (id: string) => {
    if (onOpenCalculator) {
      onOpenCalculator(id);
      return;
    }
    // Padrão: navega para rota /calculadoras/:id
    try {
      setLocation(`/calculadoras/${id}`);
    } catch {
      console.log("Abrir calculadora:", id);
    }
  };

  return (
    <>
      {/* Abas principais */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={tab === "clinico" ? "default" : "outline"}
          size="sm"
          onClick={() => setTabAndNotify("clinico")}
          data-testid="tab-clinico"
        >
          Clínico
        </Button>
        <Button
          variant={tab === "evidencias" ? "default" : "outline"}
          size="sm"
          onClick={() => setTabAndNotify("evidencias")}
          data-testid="tab-evidencias"
        >
          Explicação + Evidências
        </Button>
        <Button
          variant={tab === "calculadoras" ? "default" : "outline"}
          size="sm"
          onClick={() => setTabAndNotify("calculadoras")}
          data-testid="tab-calculadoras"
        >
          Calculadoras
        </Button>
      </div>

      {/* Conteúdo das abas (apenas Evidências e Calculadoras) */}
      {tab === "evidencias" && (
        <>
          <Separator className="my-4" />
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Explicações & Evidências Científicas</div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Use este modo para solicitar explicações detalhadas, racional fisiopatológico,
              e referências de diretrizes baseadas em evidências.
            </p>
            <p className="text-xs">
              O sistema buscará automaticamente evidências científicas da literatura médica
              quando você fizer perguntas neste modo.
            </p>
          </div>
        </Card>
        </>
      )}

      {tab === "calculadoras" && (
        <>
          <Separator className="my-4" />
          <CalculadorasList onOpen={openCalc} />
        </>
      )}
    </>
  );
}

function CalculadorasList({ onOpen }: { onOpen: (id: string) => void }) {
  const calculadoras = [
    { id: "curb65", label: "CURB-65 (Pneumonia)" },
    { id: "wells-tvp", label: "Wells Score (TVP)" },
    { id: "wells-tep", label: "Wells Score (TEP)" },
    { id: "cha2ds2vasc", label: "CHA₂DS₂-VASc" },
    { id: "hasbled", label: "HAS-BLED" },
    { id: "qsofa", label: "qSOFA" },
    { id: "sirs", label: "SIRS" },
    { id: "glasgow", label: "Escala de Glasgow (GCS)" },
    { id: "imc", label: "IMC (Índice de Massa Corporal)" },
    { id: "gasometria", label: "Gasometria Arterial/Venosa" },
    { id: "ig-dum", label: "Idade Gestacional (DUM)" },
    { id: "bishop", label: "Escore de Bishop" },
    { id: "apgar", label: "Escore de Apgar" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xl font-semibold">Calculadoras Clínicas</div>
        <div className="text-sm text-muted-foreground">
          Ferramentas de apoio à decisão clínica e cálculos médicos
        </div>
      </div>

      <Card className="divide-y">
        {calculadoras.map((calc) => (
          <button
            key={calc.id}
            onClick={() => onOpen(calc.id)}
            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
            data-testid={`calc-${calc.id}`}
          >
            <div className="text-sm font-medium">{calc.label}</div>
          </button>
        ))}
      </Card>

      <div className="text-xs text-muted-foreground px-2">
        💡 Dica: As calculadoras abrem em uma página dedicada para uso durante o atendimento.
      </div>
    </div>
  );
}
