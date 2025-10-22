import TopControls from "@/components/TopControls";

/**
 * Página de demonstração do TopControls
 * 
 * Esta é uma versão simplificada mostrando como usar o TopControls.
 * Para integrar na página principal de atendimento:
 * 
 * 1. Adicione TopControls no topo do main
 * 2. Controle qual conteúdo exibir baseado na aba selecionada
 * 3. Quando aba="clinico", mostre o chat normal
 * 4. Quando aba="evidencias" ou "calculadoras", TopControls já renderiza o conteúdo
 */
export default function DemoTopControls() {
  const handleSave = () => {
    console.log("Salvar atendimento");
    alert("Atendimento salvo!\n\n(Função de demonstração)");
  };

  const handleTabChange = (tab: string) => {
    console.log("Aba mudou para:", tab);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header simples */}
      <header className="border-b p-4">
        <div className="text-lg font-bold">Demo TopControls - MédicoHelp</div>
      </header>

      {/* Main com TopControls */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <TopControls
            currentTitle="Paciente com taquicardia"
            onSave={handleSave}
            initialTab="clinico"
            onTabChange={handleTabChange}
          />

          {/* Área do chat (visível apenas em modo "clinico") */}
          <div className="mt-6 p-6 border rounded-lg bg-neutral-50 dark:bg-neutral-900">
            <div className="text-sm text-muted-foreground text-center">
              <p className="font-medium mb-2">💬 Área do Chat</p>
              <p>Esta área é visível quando a aba "Clínico" está ativa.</p>
              <p className="text-xs mt-2">
                Em modo "Evidências" ou "Calculadoras", o TopControls renderiza o conteúdo específico.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer com composer (fixo) */}
      <footer className="border-t p-4 bg-white dark:bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua pergunta..."
              className="flex-1 px-4 py-2 rounded-lg border"
            />
            <button className="px-4 py-2 bg-[#3cb371] text-white rounded-lg">
              Enviar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
