import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Tab = "clinico" | "avancado";

interface TopControlsProps {
  initialTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export default function TopControls({
  initialTab = "clinico",
  onTabChange,
}: TopControlsProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const setTabAndNotify = (next: Tab) => {
    setTab(next);
    onTabChange?.(next);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={tab === "clinico" ? "default" : "outline"}
        size="sm"
        onClick={() => setTabAndNotify("clinico")}
        data-testid="tab-clinico"
        className={tab === "clinico" ? "bg-[#3cb371] hover:bg-[#2f9e62]" : ""}
      >
        Clínico
      </Button>
      <Button
        variant={tab === "avancado" ? "default" : "outline"}
        size="sm"
        onClick={() => setTabAndNotify("avancado")}
        data-testid="tab-avancado"
        className={tab === "avancado" ? "bg-[#3cb371] hover:bg-[#2f9e62]" : ""}
      >
        Avançado
      </Button>
    </div>
  );
}
