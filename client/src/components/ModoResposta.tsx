import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Save } from "lucide-react";

interface ModoRespostaProps {
  initialMode?: 'clinico' | 'explicativo';
  evidenceEnabled?: boolean;
  onModeChange: (mode: 'clinico' | 'explicativo', evidenceEnabled: boolean) => void;
  onSave?: () => void;
  showSaveButton?: boolean;
  disabled?: boolean;
}

export function ModoResposta({
  initialMode = 'clinico',
  evidenceEnabled = false,
  onModeChange,
  onSave,
  showSaveButton = false,
  disabled = false,
}: ModoRespostaProps) {
  const [modoClinico, setModoClinico] = useState(initialMode === 'clinico');
  const [mostrarExplicacao, setMostrarExplicacao] = useState(initialMode === 'explicativo' && evidenceEnabled);

  const handleToggleClinico = () => {
    if (!modoClinico) {
      setModoClinico(true);
      setMostrarExplicacao(false);
      onModeChange('clinico', false);
    }
  };

  const handleToggleExplicacao = () => {
    const novoValor = !mostrarExplicacao;
    setMostrarExplicacao(novoValor);
    setModoClinico(!novoValor);
    onModeChange(novoValor ? 'explicativo' : 'clinico', novoValor);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="modo-resposta-controls">
      <Button
        variant={modoClinico ? "default" : "outline"}
        size="sm"
        onClick={handleToggleClinico}
        disabled={disabled}
        data-testid="button-mode-clinico"
        className={modoClinico ? "bg-[#3cb371] hover:bg-[#2f9e62]" : ""}
      >
        <FileText className="w-4 h-4 mr-1" />
        Clínico
      </Button>

      <Toggle
        pressed={mostrarExplicacao}
        onPressedChange={handleToggleExplicacao}
        disabled={disabled}
        data-testid="toggle-explicacao-evidencias"
        className="data-[state=on]:bg-[#3cb371] data-[state=on]:text-white hover:bg-[#e9f8f0] dark:hover:bg-[#11221b]"
      >
        <BookOpen className="w-4 h-4 mr-1" />
        Explicação + Evidências
      </Toggle>

      {showSaveButton && onSave && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={disabled}
          data-testid="button-toggle-save-panel"
        >
          <Save className="w-4 h-4 mr-1" />
          Salvar
        </Button>
      )}
    </div>
  );
}
