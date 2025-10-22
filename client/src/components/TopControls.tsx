import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";

type Tab = "clinico" | "evidencias" | "calculadoras";

interface TopControlsProps {
  currentTitle?: string;
  onSave?: () => void;
  initialTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export default function TopControls({
  currentTitle = "Novo atendimento",
  onSave,
  initialTab = "clinico",
  onTabChange,
}: TopControlsProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    onTabChange?.(newTab);
  };

  return (
    <div className="space-y-3">
      {/* Linha do título + Salvar */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground truncate">{currentTitle}</div>
        {onSave && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSave}
            data-testid="button-save-atendimento"
          >
            Salvar
          </Button>
        )}
      </div>

      <Separator />

      {/* Botões principais */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={tab === "clinico" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTabChange("clinico")}
          data-testid="tab-clinico"
        >
          Clínico
        </Button>
        <Button
          variant={tab === "evidencias" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTabChange("evidencias")}
          data-testid="tab-evidencias"
        >
          Explicação + Evidências
        </Button>
        <Button
          variant={tab === "calculadoras" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTabChange("calculadoras")}
          data-testid="tab-calculadoras"
        >
          <Calculator className="w-4 h-4 mr-1" />
          Calculadoras
        </Button>
      </div>

      {/* Conteúdo da área conforme aba selecionada */}
      {tab === "evidencias" && <EvidenciasPanel />}
      {tab === "calculadoras" && <CalculadorasPanel />}
    </div>
  );
}

function EvidenciasPanel() {
  return (
    <div className="space-y-3 py-4">
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
    </div>
  );
}

function CalculadorasPanel() {
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
    <div className="space-y-3 py-4">
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
            onClick={() => openCalculadora(calc.id)}
            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
            data-testid={`calc-${calc.id}`}
          >
            <div className="text-sm font-medium">{calc.label}</div>
          </button>
        ))}
      </Card>

      <div className="text-xs text-muted-foreground px-2">
        💡 Dica: As calculadoras abrem em um modal para fácil acesso durante o atendimento.
      </div>
    </div>
  );
}

function openCalculadora(id: string) {
  // TODO: Implementar abertura de modal de calculadora
  // Por enquanto, apenas console.log para desenvolvimento
  console.log("Abrir calculadora:", id);
  alert(`Calculadora "${id}" será aberta em breve.\n\n(Funcionalidade em desenvolvimento)`);
}
