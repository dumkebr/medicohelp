# 🚀 Motor Único - Sistema de Intent Detection

Sistema expandido que trata múltiplas intenções além de scores clínicos.

## 📋 Visão Geral

Pipeline unificado:
```
Entrada do médico
 → Normaliza texto (acentos/typos)
 → Router de intenção (detectIntent)
 → Seleciona template do intent
 → Gera resposta completa
 → Se faltar dado: 1 pergunta curta no final
 → Loga intenção + campos usados
```

## 🎯 Intenções Suportadas

| Tipo | Descrição | Exemplos |
|------|-----------|----------|
| **score** | Calculadoras clínicas | Alvarado, CURB-65, Wells, CHA₂DS₂-VASc |
| **protocolo** | Protocolos/Conduta | Dor torácica, Sepse, PCR, AVE, Dispneia |
| **posologia** | Prescrição/Posologia | Antibióticos, Analgesia, ajustes renais |
| **documento** | Documentos clínicos | Prontuário, Atestado, Encaminhamento |
| **explicacao** | Explicação + Evidências | Conceitos médicos, fisiopatologia |
| **administrativo** | Comandos do sistema | Salvar, renomear, buscar |
| **utilitario** | Ferramentas auxiliares | Interpretar exame, comparar |
| **unknown** | Não identificado | Responde melhor interpretação + pergunta |

## 📁 Arquitetura

```
server/
├── intent-detector.ts        # Router de intenção
├── templates/
│   └── index.ts               # Templates por tipo de intent
├── clinical-detector.ts       # Detector de scores (legado, ainda funciona)
└── routes.ts                  # Handler principal
```

## 🔍 Como Funciona o Intent Detector

### 1. Normalização de Texto

```typescript
"Escala de Alvarado" → "escala de alvarado"
"CURB-65!!!" → "curb 65"
"Protocolo de PCR" → "protocolo de pcr"
```

### 2. Sistema de Pontuação

```typescript
Match por keyword: +10 pontos
Match por contexto: +5 pontos
Indicador contextual: +3 pontos
Prioridade da entrada: +N pontos (1-10)
```

### 3. Threshold de Confiança

```typescript
score >= 8 → Intent detectado
score < 8  → Unknown (responder melhor interpretação + pergunta)
```

## 📝 Templates por Intenção

### A) Score/Calculadora

```
1️⃣ O que é/para quê serve (1 linha)
2️⃣ Checklist dos critérios (com pontos/unidades)
3️⃣ Cálculo + interpretação por faixas
4️⃣ Próximo passo prático
Se faltar dado: listar itens faltantes (1 linha)
```

### B) Protocolo/Conduta

```
⚡ PROTOCOLO CLÍNICO
1️⃣ Avaliação imediata (A-B-C-D-E)
2️⃣ Conduta passo a passo (doses/vias)
3️⃣ Fluxo de decisão (observação/alta/UTI)
4️⃣ 🚨 Red flags
```

### C) Prescrição/Posologia

```
💊 POSOLOGIA
Fármaco: [Nome]
Dose padrão: mg/kg/dose, mg/kg/dia
Apresentações comuns: mL/cp/gotas
Ajustes: renal/gestante/pediátrico
⚠️ Advertências
```

### D) Documento Clínico

```
PRONTUÁRIO:
- HISTÓRIA (identificação, QP, HDA)
- EXAME FÍSICO (geral, SV, aparelhos)
- HIPÓTESES DIAGNÓSTICAS
- CONDUTA

ATESTADO:
- Formato padrão com CID-10
- Afastamento de N dias

ENCAMINHAMENTO:
- Motivo, dados relevantes, urgência
```

### E) Explicação + Evidências

```
📚 EXPLICAÇÃO + EVIDÊNCIAS
1) O que é
2) Como fazer/calcular
3) Interpretação (faixas)
4) Limitações
5) Referências (2-3 essenciais)
```

## 💻 Uso no Código

### Exemplo Básico

```typescript
import { detectIntent } from "./intent-detector";
import { getTemplate } from "./templates";

// 1. Detectar intenção
const intent = detectIntent("qual o protocolo de sepse?");
// → { type: "protocolo", slug: "sepse", canonical: "Protocolo de Sepse", confidence: 25 }

// 2. Obter template
const template = getTemplate(intent);
// → { systemPrompt: "...", userPrompt: "..." }

// 3. Chamar LLM
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: template.systemPrompt },
    { role: "user", content: template.userPrompt },
  ],
});
```

### Exemplo com Handler Completo

```typescript
// server/routes.ts

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  
  // 1. Detectar intenção
  const intent = detectIntent(message);
  
  console.log(`Intent detectado: ${intent.type} (${intent.slug}) - confiança: ${intent.confidence}`);
  
  // 2. Casos especiais (administrativo - tratamento local)
  if (intent.type === "administrativo") {
    return handleAdministrativo(intent, message, res);
  }
  
  // 3. Obter template apropriado
  const template = getTemplate(intent);
  
  // 4. Construir mensagens
  const messages = [
    { role: "system", content: template.systemPrompt },
    ...history,
    { role: "user", content: template.userPrompt || message },
  ];
  
  // 5. Chamar OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    stream: true,
  });
  
  // 6. Retornar streaming
  // ... (código SSE existente)
});
```

## 🔄 Migração do Sistema Atual

### Estado Atual (Funciona)
```typescript
// clinical-detector.ts → Detecta 14 scores
// Retorna resposta estruturada ANTES da OpenAI
// ~4ms, 0 tokens, 100% consistente
```

### Novo Motor Único (Proposto)
```typescript
// intent-detector.ts → Detecta 7 tipos de intenção
// Usa templates + OpenAI para gerar resposta
// ~3000ms, ~200 tokens, mas muito mais flexível
```

### Estratégia Híbrida (Recomendada)

1. **Manter clinical-detector.ts** para scores específicos (Alvarado, CURB-65...)
   - Resposta instantânea, zero custo
   
2. **Usar intent-detector.ts** para outros casos (protocolos, posologia...)
   - Mais flexível, usa LLM com template

```typescript
// Ordem de prioridade no handler:
const clinicalMatch = detectClinicalScore(message);
if (clinicalMatch) {
  return structuredResponse(clinicalMatch); // 4ms, $0
}

const intent = detectIntent(message);
const template = getTemplate(intent);
return llmResponse(template); // 3000ms, ~$0.003
```

## 📊 Comparação de Abordagens

| Aspecto | Clinical Detector | Intent Detector |
|---------|------------------|-----------------|
| **Latência** | ~4ms | ~3000ms |
| **Custo** | $0 | ~$0.003 |
| **Flexibilidade** | Baixa (resposta fixa) | Alta (LLM gera) |
| **Consistência** | 100% | ~90% |
| **Tipos suportados** | 1 (scores) | 7 (todos) |
| **Quando usar** | Scores específicos | Outros casos |

## ✅ Checklist de Implementação

- [x] Criar intent-detector.ts
- [x] Criar templates/index.ts
- [x] Documentar sistema
- [ ] Integrar no routes.ts (opcional)
- [ ] Testar cada tipo de intent
- [ ] Adicionar logging de analytics
- [ ] Expandir léxico com mais casos

## 🎯 Próximos Passos

1. **Testar o sistema** com queries reais
2. **Expandir o léxico** com mais variações
3. **Adicionar mais protocolos** (IAMCSST, crise hipertensiva, anafilaxia...)
4. **Criar templates específicos** para cada slug
5. **Implementar logging** de analytics (qual intent mais usado?)

## 📝 Exemplos de Queries

```typescript
// SCORE
"calcular alvarado" → { type: "score", slug: "alvarado" }
"curb-65 pneumonia" → { type: "score", slug: "curb65" }

// PROTOCOLO
"protocolo de sepse" → { type: "protocolo", slug: "sepse" }
"conduta dor toracica" → { type: "protocolo", slug: "dor-toracica" }

// POSOLOGIA
"dose de amoxicilina criança" → { type: "posologia", slug: "antibiotico" }
"prescrever dipirona" → { type: "posologia", slug: "analgesia" }

// DOCUMENTO
"fazer prontuario" → { type: "documento", slug: "prontuario" }
"atestado 3 dias" → { type: "documento", slug: "atestado" }

// EXPLICACAO
"explica o curb-65" → { type: "explicacao", slug: "unknown" }
"o que é fibrilação atrial" → { type: "explicacao", slug: "unknown" }

// ADMINISTRATIVO
"salvar este atendimento" → { type: "administrativo", slug: "salvar" }
"renomear para dengue" → { type: "administrativo", slug: "renomear" }
```

---

**Versão:** 1.0  
**Status:** ✅ Implementado (não integrado no routes.ts)  
**Última Atualização:** 2025-10-22
