# TopControls - Componente de Controle de Abas para MédicoHelp

## 📋 Visão Geral

O componente `TopControls` fornece uma interface com três abas principais para o fluxo de atendimento médico:

1. **Clínico** - Chat médico com IA (modo padrão)
2. **Explicação + Evidências** - Respostas detalhadas com referências científicas
3. **Calculadoras** - Acesso rápido a calculadoras clínicas

---

## 🎯 Uso Básico

```typescript
import TopControls from "@/components/TopControls";

export default function MinhaPage() {
  const handleSave = () => {
    console.log("Salvar atendimento");
  };

  const handleTabChange = (tab: "clinico" | "evidencias" | "calculadoras") => {
    console.log("Aba alterada:", tab);
  };

  return (
    <div className="p-6">
      <TopControls
        currentTitle="Paciente com taquicardia"
        onSave={handleSave}
        initialTab="clinico"
        onTabChange={handleTabChange}
      />
      
      {/* Sua área de conteúdo aqui */}
    </div>
  );
}
```

---

## 📦 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `currentTitle` | `string` | `"Novo atendimento"` | Título exibido no cabeçalho |
| `onSave` | `() => void` | `undefined` | Callback ao clicar em "Salvar" |
| `initialTab` | `"clinico" \| "evidencias" \| "calculadoras"` | `"clinico"` | Aba inicial |
| `onTabChange` | `(tab) => void` | `undefined` | Callback quando a aba muda |

---

## 🎨 Estrutura Visual

```
┌─────────────────────────────────────────┐
│ Novo atendimento            [Salvar]    │
├─────────────────────────────────────────┤
│ [Clínico] [Evidências] [Calculadoras]   │
├─────────────────────────────────────────┤
│                                         │
│  Conteúdo da aba selecionada           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📑 Conteúdo das Abas

### 1. **Aba Clínico**
- **Comportamento:** Não renderiza conteúdo adicional
- **Uso:** Você deve renderizar o chat médico abaixo do TopControls
- **Quando usar:** Modo padrão para conversação com IA

### 2. **Aba Evidências**
- **Renderiza:** Card explicativo sobre o modo de evidências
- **Conteúdo:**
  - Descrição do modo explicativo
  - Informações sobre busca automática de evidências
- **Quando usar:** Quando usuário quer explicações detalhadas

### 3. **Aba Calculadoras**
- **Renderiza:** Lista de calculadoras clínicas
- **Calculadoras disponíveis:**
  - CURB-65 (Pneumonia)
  - Wells Score (TVP/TEP)
  - CHA₂DS₂-VASc
  - HAS-BLED
  - qSOFA, SIRS
  - Escala de Glasgow
  - IMC
  - Gasometria Arterial/Venosa
  - Idade Gestacional
  - Escore de Bishop
  - Escore de Apgar
- **Comportamento:** Ao clicar, abre calculadora (atualmente mostra alert)

---

## 🔧 Exemplo de Integração Completa

```typescript
import { useState } from "react";
import TopControls from "@/components/TopControls";

export default function AtendimentoPage() {
  const [activeTab, setActiveTab] = useState<"clinico" | "evidencias" | "calculadoras">("clinico");
  const [atendimentoTitle, setAtendimentoTitle] = useState("Novo atendimento");

  const handleSave = () => {
    // Salvar atendimento no localStorage ou backend
    console.log("Salvando atendimento...");
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <TopControls
            currentTitle={atendimentoTitle}
            onSave={handleSave}
            initialTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Renderizar chat apenas em modo clínico */}
          {activeTab === "clinico" && (
            <div className="mt-6">
              {/* Seu componente de chat aqui */}
              <ChatInterface />
            </div>
          )}

          {/* Evidências e Calculadoras são renderizadas pelo TopControls */}
        </div>
      </div>

      {/* Composer fixo (visível apenas em modo clínico) */}
      {activeTab === "clinico" && (
        <footer className="border-t p-4">
          <ChatComposer />
        </footer>
      )}
    </div>
  );
}
```

---

## 🚀 Demo

Acesse `/demo-top-controls` para ver uma demonstração funcional do componente.

---

## 🎯 Roadmap

### Melhorias Futuras:
- [ ] Integrar com sistema de calculadoras em modal
- [ ] Conectar aba Evidências com API de busca científica
- [ ] Adicionar histórico de calculadoras usadas
- [ ] Permitir customização de quais calculadoras exibir
- [ ] Adicionar atalhos de teclado para trocar abas

---

## 📝 Notas Técnicas

- **Componente controlado:** Use `initialTab` + `onTabChange` para controlar externamente
- **Responsividade:** Abas se adaptam em telas pequenas com `flex-wrap`
- **Data testids:** Todos os botões têm `data-testid` para testes:
  - `tab-clinico`
  - `tab-evidencias`
  - `tab-calculadoras`
  - `button-save-atendimento`
  - `calc-{id}` para cada calculadora

---

## 🐛 Troubleshooting

**P: O chat não aparece quando clico em "Clínico"**
R: O TopControls não renderiza o chat automaticamente. Você precisa renderizar seu componente de chat quando `activeTab === "clinico"`.

**P: Como integrar com as calculadoras reais?**
R: Modifique a função `openCalculadora()` em `TopControls.tsx` para abrir seu modal ou página de calculadora.

**P: Posso esconder o botão "Salvar"?**
R: Sim! Apenas não passe a prop `onSave` que o botão não será renderizado.

---

**Criado para MédicoHelp** 🩺
