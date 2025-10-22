/**
 * Templates por Intenção - Motor Único
 * 
 * Cada template define como responder a um tipo específico de intent
 */

import type { IntentMatch } from "../intent-detector";

export interface TemplateResponse {
  systemPrompt: string;
  userPrompt: string;
  structuredFormat?: string;
}

// ============ A) SCORE/CALCULADORA ============
export function getScoreTemplate(intent: IntentMatch): TemplateResponse {
  return {
    systemPrompt: `Você vai ajudar com: ${intent.canonical}

**FORMATO OBRIGATÓRIO:**

1️⃣ **O que é/para quê serve** (1 linha)

2️⃣ **Checklist dos critérios** (com pontos/unidades ao lado)

3️⃣ **Cálculo + interpretação por faixas**
   • [Faixa 1]: Interpretação e conduta
   • [Faixa 2]: Interpretação e conduta
   • [Faixa 3]: Interpretação e conduta

4️⃣ **Próximo passo prático**

**Se faltar dado essencial:** Liste APENAS os itens faltantes em UMA linha ao final.`,
    userPrompt: `Usuário pediu sobre: ${intent.canonical}. Responda usando o formato acima.`,
  };
}

// ============ B) PROTOCOLO/CONDUTA ============
export function getProtocoloTemplate(intent: IntentMatch): TemplateResponse {
  return {
    systemPrompt: `Você vai apresentar: ${intent.canonical}

**FORMATO OBRIGATÓRIO:**

⚡ **PROTOCOLO CLÍNICO**

1️⃣ **Avaliação imediata** (A-B-C-D-E se aplicável)
   • Sinais vitais críticos
   • Critérios de gravidade/instabilidade

2️⃣ **Conduta passo a passo**
   • Passo 1: [Ação] - dose/via/tempo
   • Passo 2: [Ação] - dose/via/tempo
   • Passo 3: [Exames/monitorização]

3️⃣ **Fluxo de decisão**
   • Se [condição] → Observação
   • Se [condição] → Internação
   • Se [condição] → UTI/especialista

4️⃣ **🚨 Red flags** (sinais de alarme para reavaliar imediatamente)

**Se faltar dado essencial:** Peça em UMA linha ao final.`,
    userPrompt: `Usuário pediu sobre: ${intent.canonical}. Aplique o protocolo.`,
  };
}

// ============ C) PRESCRIÇÃO/POSOLOGIA ============
export function getPosologiaTemplate(intent: IntentMatch): TemplateResponse {
  return {
    systemPrompt: `Você vai orientar prescrição/posologia: ${intent.canonical}

**FORMATO OBRIGATÓRIO:**

💊 **POSOLOGIA**

**Fármaco:** [Nome genérico]

**Dose padrão (adulto):**
• mg/kg/dose: [valor]
• mg/kg/dia: [valor]
• Intervalo: [6/6h, 8/8h, 12/12h, etc]
• Dose máxima por dose: [valor]
• Dose máxima por dia: [valor]

**Apresentações comuns:**
• [Forma farmacêutica 1]: [concentração] → [mL/cp/gotas por dose]
• [Forma farmacêutica 2]: [concentração] → [mL/cp/gotas por dose]

**Ajustes especiais:**
• Insuficiência renal: [orientação]
• Gestante: [categoria/restrição]
• Pediátrico: [ajuste se diferente]

⚠️ **Advertências:** [Curtas e clássicas, 1-2 linhas]

**Se precisar de dados:** Peça peso, idade ou clearance em UMA linha.`,
    userPrompt: `Usuário pediu prescrição/posologia. Oriente conforme formato acima.`,
  };
}

// ============ D) DOCUMENTO CLÍNICO ============
export function getDocumentoTemplate(intent: IntentMatch): TemplateResponse {
  const templates: Record<string, string> = {
    prontuario: `**FORMATO: PRONTUÁRIO/EVOLUÇÃO**

**HISTÓRIA:**
• Identificação: [nome, idade, sexo]
• Queixa principal: 
• HDA (história da doença atual):
• Revisão de sistemas:
• Antecedentes:

**EXAME FÍSICO:**
• Geral:
• Sinais vitais:
• Aparelhos:

**HIPÓTESES DIAGNÓSTICAS:**
1. [Principal]
2. [Diferencial]

**CONDUTA:**
• Exames solicitados:
• Medicações:
• Observação/alta:`,

    atestado: `**FORMATO: ATESTADO MÉDICO**

Atesto para os devidos fins que o(a) paciente [NOME], portador(a) do documento [TIPO] nº [NÚMERO], esteve sob meus cuidados médicos no dia [DATA] e necessita de afastamento de suas atividades por [DIAS] dias, a contar de [DATA INÍCIO].

**CID-10:** [código - descrição]

[Cidade], [data por extenso]

[Nome do médico]
CRM [UF] [número]`,

    encaminhamento: `**FORMATO: ENCAMINHAMENTO**

**Encaminho** o(a) paciente [NOME], [idade] anos, para avaliação por [ESPECIALIDADE].

**Motivo do encaminhamento:**
[Descrição clara do quadro e necessidade]

**Dados relevantes:**
• Queixa: 
• Exames realizados:
• Hipótese diagnóstica:

**Urgência:** [ ] Rotina  [ ] Prioridade  [ ] Urgente

Atenciosamente,
[Nome do médico]
CRM [UF] [número]`,
  };

  const format = templates[intent.slug] || templates.prontuario;

  return {
    systemPrompt: `Você vai ajudar a preencher: ${intent.canonical}

${format}

**INSTRUÇÕES:**
• Preencha com base nas informações fornecidas
• Se faltar dado essencial, peça em UMA linha
• Mantenha o formato profissional e padrão`,
    userPrompt: `Usuário pediu documento: ${intent.canonical}. Ajude a preencher.`,
  };
}

// ============ E) EXPLICAÇÃO + EVIDÊNCIAS ============
export function getExplicacaoTemplate(intent: IntentMatch): TemplateResponse {
  return {
    systemPrompt: `Você vai explicar: ${intent.canonical}

**FORMATO OBRIGATÓRIO:**

📚 **EXPLICAÇÃO + EVIDÊNCIAS**

**1) O que é**
[Definição clara em 2-3 frases]

**2) Como fazer/calcular/aplicar**
[Passo a passo ou critérios objetivos]

**3) Interpretação**
• [Faixa/valor 1]: Significado clínico
• [Faixa/valor 2]: Significado clínico
• [Faixa/valor 3]: Significado clínico

**4) Pontos de atenção/limitações**
• [Limitação 1]
• [Limitação 2]
• [Contexto de uso]

**5) Referências essenciais**
• [Sociedade/Guideline] - [Título/Ano]
• [Base de dados] - [Tópico]
• [Referência clássica]

> Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.`,
    userPrompt: `Usuário pediu explicação sobre: ${intent.canonical}. Explique conforme formato.`,
  };
}

// ============ ROUTER DE TEMPLATES ============
export function getTemplate(intent: IntentMatch): TemplateResponse {
  switch (intent.type) {
    case "score":
      return getScoreTemplate(intent);
    case "protocolo":
      return getProtocoloTemplate(intent);
    case "posologia":
      return getPosologiaTemplate(intent);
    case "documento":
      return getDocumentoTemplate(intent);
    case "explicacao":
      return getExplicacaoTemplate(intent);
    
    // Casos especiais (tratados diretamente no handler)
    case "administrativo":
    case "utilitario":
      return {
        systemPrompt: `Assistente do MédicoHelp - ${intent.canonical}`,
        userPrompt: intent.canonical,
      };
    
    default:
      // Unknown - responde melhor interpretação + 1 pergunta
      return {
        systemPrompt: `Você é o assistente do MédicoHelp.
- Responda ao pedido da forma mais objetiva possível
- Se a intenção não estiver 100% clara, responda a melhor interpretação E faça UMA pergunta objetiva para confirmar
- Priorize termos médicos consagrados
- Não mude de assunto`,
        userPrompt: "Responda da melhor forma possível.",
      };
  }
}
