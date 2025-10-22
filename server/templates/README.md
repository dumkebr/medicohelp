# 📝 Templates do Motor Único

Templates estruturados para cada tipo de intenção detectada.

## 🎯 Estrutura Geral

Cada template retorna:
```typescript
{
  systemPrompt: string;  // Instrução para o LLM
  userPrompt: string;    // Mensagem processada do usuário
  structuredFormat?: string; // Formato opcional
}
```

## 📋 Templates Disponíveis

### 1. Score/Calculadora (`getScoreTemplate`)

**Usado para:** Escalas clínicas, calculadoras

**Formato de saída:**
```
1️⃣ O que é/para quê serve (1 linha)
2️⃣ Checklist dos critérios (com pontos/unidades)
3️⃣ Cálculo + interpretação por faixas
4️⃣ Próximo passo prático
```

**Exemplo de uso:**
```typescript
const intent = { type: "score", slug: "curb65", canonical: "CURB-65" };
const template = getScoreTemplate(intent);
// Retorna instruções para formatar resposta sobre CURB-65
```

### 2. Protocolo/Conduta (`getProtocoloTemplate`)

**Usado para:** Protocolos clínicos, condutas, manejo

**Formato de saída:**
```
⚡ PROTOCOLO CLÍNICO
1️⃣ Avaliação imediata (A-B-C-D-E)
2️⃣ Conduta passo a passo
3️⃣ Fluxo de decisão
4️⃣ 🚨 Red flags
```

**Slugs disponíveis:**
- `dor-toracica` - Protocolo de Dor Torácica
- `sepse` - Bundle de Sepse
- `pcr` - ACLS/PCR
- `ave` - Protocolo de AVE
- `dispneia` - Abordagem de Dispneia

### 3. Posologia (`getPosologiaTemplate`)

**Usado para:** Prescrições, doses, posologia

**Formato de saída:**
```
💊 POSOLOGIA
Fármaco: [Nome]
Dose padrão: mg/kg/dose, mg/kg/dia, intervalo
Apresentações comuns: conversão para mL/cp/gotas
Ajustes: renal/gestante/pediátrico
⚠️ Advertências
```

**Slugs disponíveis:**
- `antibiotico` - Antibióticos em geral
- `analgesia` - Analgésicos/anti-inflamatórios

### 4. Documento (`getDocumentoTemplate`)

**Usado para:** Documentação clínica

**Formatos disponíveis:**

#### `prontuario` - Prontuário/Evolução
```
HISTÓRIA:
- Identificação, QP, HDA
EXAME FÍSICO:
- Geral, SV, Aparelhos
HIPÓTESES DIAGNÓSTICAS:
CONDUTA:
```

#### `atestado` - Atestado Médico
```
Atesto que... [formato oficial]
CID-10: [código]
[Assinatura médica]
```

#### `encaminhamento` - Encaminhamento
```
Encaminho para [especialidade]
Motivo: [quadro clínico]
Dados relevantes
Urgência: [ ] Rotina [ ] Prioridade [ ] Urgente
```

### 5. Explicação (`getExplicacaoTemplate`)

**Usado para:** Explicações educacionais com evidências

**Formato de saída:**
```
📚 EXPLICAÇÃO + EVIDÊNCIAS
1) O que é
2) Como fazer/calcular
3) Interpretação
4) Limitações
5) Referências (2-3 essenciais)
```

## 🔧 Adicionando Novos Templates

### Passo 1: Adicionar ao Intent Detector

```typescript
// server/intent-detector.ts
{
  type: "protocolo",
  slug: "anafilaxia",
  canonical: "Protocolo de Anafilaxia",
  keywords: ["anafilaxia", "choque anafilatico", "alergia grave"],
  priority: 9
},
```

### Passo 2: (Opcional) Criar Template Específico

```typescript
// server/templates/protocolos.ts
export const PROTOCOLO_ANAFILAXIA = `
⚡ PROTOCOLO DE ANAFILAXIA

1️⃣ **Reconhecimento imediato**
   • Critérios de anafilaxia (1 de 3)
   • Sinais de gravidade (hipotensão, broncoespasmo, angioedema)

2️⃣ **Conduta ABC**
   • A: Via aérea (O2 alto fluxo, IOT se necessário)
   • B: Adrenalina 0,3-0,5mg IM (coxa) - PRIMEIRA LINHA
   • C: Acesso venoso calibroso, SF 0,9% 20mL/kg rápido

3️⃣ **Medicações adjuvantes**
   • Anti-histamínicos: Difenidramina 50mg IV
   • Corticoides: Hidrocortisona 200mg IV ou Metilprednisolona 125mg IV
   • Broncodilatadores se broncoespasmo

4️⃣ **Observação e alta**
   • Mínimo 4-6h de observação (risco de reação bifásica)
   • Alta com receita de EpiPen (se disponível)
   • Orientar evitar alérgeno identificado

🚨 **Red flags:**
• Repetir adrenalina IM a cada 5-15min se necessário
• Se refratário: adrenalina EV em BIC (cuidado com arritmias)
• Considerar vasopressores (noradrenalina) se choque persistente
`;
```

### Passo 3: Importar no Router

```typescript
// server/templates/index.ts
import { PROTOCOLO_ANAFILAXIA } from "./protocolos";

export function getProtocoloTemplate(intent: IntentMatch): TemplateResponse {
  const protocolos: Record<string, string> = {
    "anafilaxia": PROTOCOLO_ANAFILAXIA,
    "dor-toracica": PROTOCOLO_DOR_TORACICA,
    // ...
  };
  
  const format = protocolos[intent.slug] || defaultProtocolo;
  // ...
}
```

## 📊 Prioridades de Template

| Tipo | Prioridade | Motivo |
|------|-----------|--------|
| **score** | 10 | Resposta mais estruturada |
| **protocolo** | 8-10 | Urgência clínica |
| **posologia** | 7 | Segurança |
| **documento** | 8 | Formato oficial |
| **explicacao** | 7 | Educacional |

## ✅ Boas Práticas

1. **Manter formato consistente** - Todos os templates de um tipo devem seguir a mesma estrutura
2. **Usar emojis visuais** - 1️⃣, 2️⃣, ⚡, 💊, 🚨 para facilitar leitura rápida
3. **Doses precisas** - Sempre mg/kg/dose e mg/kg/dia quando aplicável
4. **Referências** - Citar sociedades médicas (SBC, AHA, ESC, etc)
5. **Disclaimer** - Sempre incluir ao final (responsabilidade médica)

## 🧪 Testando Templates

```typescript
import { detectIntent } from "../intent-detector";
import { getTemplate } from "./index";

// Testar detecção + template
const message = "protocolo de sepse";
const intent = detectIntent(message);
const template = getTemplate(intent);

console.log("Intent:", intent);
console.log("System Prompt:", template.systemPrompt);
```

---

**Versão:** 1.0  
**Última Atualização:** 2025-10-22
