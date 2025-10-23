import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

type Tab = "clinico" | "evidencias";

interface TopControlsProps {
  initialTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export default function TopControls({
  initialTab = "clinico",
  onTabChange,
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

  const handleFerramentasPro = () => {
    setLocation("/avancado");
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
          variant="outline"
          size="sm"
          onClick={handleFerramentasPro}
          data-testid="button-ferramentas-pro"
          className="bg-[#3cb371]/10 hover:bg-[#3cb371]/20 dark:bg-[#3cb371]/20 dark:hover:bg-[#3cb371]/30 border-[#3cb371]/30"
        >
          Ferramentas Médico PRO
        </Button>
      </div>

      {/* Conteúdo das abas (apenas Evidências) */}
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
    </>
  );
}
