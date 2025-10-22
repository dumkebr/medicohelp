# Clinical Score Detector

Sistema de detecção semântica de escalas e scores clínicos que intercepta consultas ANTES de chamar a OpenAI, retornando respostas estruturadas instantaneamente.

## 📋 Visão Geral

O **Clinical Detector** identifica quando o usuário está perguntando sobre uma escala/score médico e retorna uma resposta estruturada com instruções para cálculo, economizando:
- ⚡ **~3000ms de latência** (4ms vs 3000ms)
- 💰 **100% dos tokens OpenAI** (resposta local)
- 🎯 **Consistência** (respostas padronizadas)

## 🔍 Como Funciona

### 1. Detecção Semântica

O sistema usa **3 camadas de detecção**:

#### Camada 1: Keywords Principais
```typescript
keywords: ["alvarado", "alvorado", "alvorada", "alvaro"]
```
Detecta variações comuns (typos, abreviações).

#### Camada 2: Indicadores de Escala
```typescript
SCALE_INDICATORS = ["escala", "score", "escore", "índice", "calcular"]
```
Palavras que sinalizam busca por calculadora.

#### Camada 3: Contexto Médico
```typescript
context: ["apendicite", "apêndice", "dor abdominal"]
```
Termos que reforçam a probabilidade da escala correta.

### 2. Normalização de Texto

Remove acentos e converte para lowercase:
```typescript
"Escala de Alvarado" → "escala de alvarado"
"Cálculo do CURB-65" → "calculo do curb-65"
```

## 🎯 Escalas Detectadas (14 total)

### Clínicas (11)
1. **Alvarado** - Apendicite aguda
2. **CURB-65** - Gravidade de pneumonia
3. **Wells TVP** - Probabilidade de trombose venosa profunda
4. **Wells TEP** - Probabilidade de embolia pulmonar
5. **CHA₂DS₂-VASc** - Risco de AVC em FA
6. **HAS-BLED** - Risco de sangramento
7. **qSOFA** - Rastreio de sepse
8. **SIRS** - Resposta inflamatória sistêmica
9. **Glasgow (GCS)** - Nível de consciência
10. **IMC** - Índice de massa corporal
11. **Gasometria** - Interpretação de gases arteriais

### Obstétricas (3)
12. **Idade Gestacional** - DUM/DPP/USG
13. **Bishop** - Avaliação pré-indução
14. **Apgar** - Vitalidade do recém-nascido

## 💻 Uso no Backend

### Integração no Chat Endpoint

```typescript
// server/routes.ts
import { detectClinicalScore, generateScoreResponse } from "./clinical-detector";

app.post("/api/chat", async (req, res) => {
  // ... validação da requisição
  
  // 🎯 Detectar escala ANTES da OpenAI
  const clinicalMatch = detectClinicalScore(message);
  if (clinicalMatch) {
    // Retornar resposta estruturada imediatamente
    await storage.incrementQuota(userId);
    return res.json({
      response: generateScoreResponse(clinicalMatch),
      tokensUsed: 0,
      duration: Date.now() - startTime,
      scoreDetected: {
        id: clinicalMatch.scoreId,
        name: clinicalMatch.scoreName,
      }
    });
  }
  
  // ... fluxo normal com OpenAI
});
```

## ✅ Exemplos de Detecção

### ✓ Detecta Corretamente

```typescript
// Variações de escrita
"escore de alvarado" → ✓ Alvarado
"alvorado" → ✓ Alvarado (typo comum)
"alvaro score" → ✓ Alvarado

// Com indicadores
"qual a escala de wells?" → ✓ Wells TVP
"calcular curb65" → ✓ CURB-65
"como calcular glasgow?" → ✓ Glasgow

// Com contexto
"paciente com apendicite, alvarado" → ✓ Alvarado
"pneumonia, usar curb" → ✓ CURB-65
```

### ✗ Não Detecta (Comportamento Esperado)

```typescript
// Perguntas genéricas sem indicadores
"qual o tratamento da pneumonia?" → ✗ (vai para OpenAI)
"hipertensão arterial" → ✗ (vai para OpenAI)

// Menções casuais sem intenção de cálculo
"o paciente tem apendicite" → ✗ (sem "escala", "calcular")
```

## 🔧 Adicionando Nova Escala

```typescript
// server/clinical-detector.ts
const CLINICAL_SCORES = [
  // ... escalas existentes
  {
    id: "ranson",
    name: "Critérios de Ranson",
    keywords: ["ranson", "ransom"], // Variações
    context: ["pancreatite", "pancreatite aguda"],
    description: "Critérios de Ranson para gravidade de pancreatite",
    suggestion: `Vamos calcular os Critérios de Ranson...
    
    **Na admissão:**
    • Idade >55 anos?
    • Leucócitos >16.000/mm³?
    ...
    
    Acesse **Calculadoras** → **Ranson**`
  }
];
```

## 📊 Performance

| Métrica | Com Detector | Sem Detector (OpenAI) |
|---------|--------------|----------------------|
| Latência | ~4ms | ~3000ms |
| Tokens | 0 | ~150-300 |
| Custo | $0 | ~$0.002-0.004 |
| Consistência | 100% | ~85% |

## 🧪 Testes

```bash
# Teste básico
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "x-user-id: test" \
  -d '{"message":"calcular escore de alvarado","history":[]}'

# Deve retornar:
# - tokensUsed: 0
# - duration: ~4ms
# - scoreDetected: { id: "alvarado", name: "Escala de Alvarado" }
```

## 📝 Notas Técnicas

1. **Normalização**: Remove acentos com NFD + regex para consistência
2. **Prioridade**: Detector roda ANTES da OpenAI (economia máxima)
3. **Quota**: Conta como consulta válida (incrementa quota)
4. **Fallback**: Se não detectar, segue fluxo normal para OpenAI
5. **Manutenção**: Centralizado em `server/clinical-detector.ts`

## 🚀 Expansões Futuras

- [ ] Adicionar mais escalas (APACHE II, SOFA, MELD)
- [ ] Suporte a múltiplas escalas na mesma mensagem
- [ ] Analytics de quais escalas são mais consultadas
- [ ] Cache de respostas personalizadas por usuário
- [ ] Integração com histórico de atendimentos
