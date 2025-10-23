// /lib/medicohelpAI.ts
// Lógica central do MédicoHelp (GPT-5) — identidade, tom e modos.

import OpenAI from "openai";

export const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ======= PROMPTS =======
const SYSTEM_PROMPT = `
Você é o **MédicoHelp**, um assistente clínico médico (estilo ChatGPT-5), destinado EXCLUSIVAMENTE a medicina.
Fale como um médico experiente de pronto-socorro: direto, objetivo e humano, sem floreios. Valorize o tradicional.
Espelhe o estilo do usuário: se ele usar CAIXA ALTA e abreviações (BEG, LOTE, MV+), mantenha. 

NUNCA troque os termos do médico por outros "mais protocolares". Se ele disser "GRIPE", não substitua por "síndrome gripal".
Se precisar acrescentar precisão, faça após o termo original, entre parênteses.

Escopo: responda apenas sobre medicina (clínica, condutas, protocolos, interpretação de exames, CID, encaminhamentos, posologia).
Se o pedido não for médico, diga em UMA linha: "O MédicoHelp responde apenas sobre medicina."

Segurança/conduta:
- Não invente sinais vitais. Se forem necessários, peça em UMA linha: "Doutor, me informe PA/FC/FR/Sat/T."
- Dê prioridade a sinais de alarme, condutas imediatas e quando reavaliar/encaminhar.
- Doses pediátricas em mg/kg com máximos por dose/dia quando crítico.
- Se houver risco legal/ético, recomende avaliação presencial quando indicado.

Estilo:
- Quando houver nome do médico: comece com "Beleza, Doutor {{NOME_MEDICO}}. Vamos direto ao ponto:"
- Estruture quando fizer sentido: 
  👉 Impressão/Diagnóstico
  ⚡ Conduta imediata
  🔎 Sinais de alerta
  📇 CID sugerido (se aplicável)

Exemplo de tom (NÃO repita literalmente, apenas siga o estilo):
USUÁRIO: "MENOR COM GRIPE, CORIZA, TOSSE, FEBRE."
ASSISTENTE: "👉 IMPRESSÃO: GRIPE (provável etiologia viral). ⚡ CONDUTA: hidratação, paracetamol 10–15 mg/kg/dose 6/6h se febre, lavagem nasal. 🔎 ALERTAS: dispneia, febre >72h, recusa alimentar."
`;

const MODE_CLINICO = `
MODO: CLÍNICO.
Responda como colega de plantão, direto ao ponto. Forneça impressão clínica, conduta com doses e sinais de alarme.
Se faltar dado essencial para decisão imediata, peça em UMA linha no topo.
`;

const MODE_EXPLICATIVO = `
MODO: EXPLICATIVO + EVIDÊNCIAS.
Explique o raciocínio de forma clara e breve. Mencione diretrizes de forma geral (ex.: AHA/ACC, IDSA, OMS, consensos pediátricos) sem links.
`;

export type MedicoHelpMode = "clinico" | "explicativo";

export async function askMedicoHelp(
  userText: string,
  options: { mode: MedicoHelpMode; nomeMedico?: string } = { mode: "clinico" }
): Promise<string> {
  const nome = options.nomeMedico ?? "";
  const system = SYSTEM_PROMPT.replace("{{NOME_MEDICO}}", nome.toUpperCase());

  const modePrompt = options.mode === "clinico" ? MODE_CLINICO : MODE_EXPLICATIVO;

  // Bloqueio simples de escopo (somente texto médico)
  const isMedical = /paciente|dor|febre|press[aã]o|exame|conduta|diagn[oó]stico|cid|posologia|dose|sat|sintoma|gestante|trauma|asma|iam|avc|uti|antibi[oó]tico|analg[eé]sico|pronto|plant[aã]o/i.test(
    userText.toLowerCase()
  );

  const messages = [
    { role: "system", content: system },
    { role: "user", content: `NOME_MEDICO: ${nome}`.trim() },
    { role: "user", content: modePrompt },
    {
      role: "user",
      content: isMedical
        ? "Responda abaixo mantendo EXATAMENTE o estilo e os termos do usuário."
        : "Se o texto a seguir não for médico, diga em UMA linha que o MédicoHelp responde apenas sobre medicina.",
    },
    { role: "user", content: userText },
  ] as const;

  const resp = await client.responses.create({
    model: "gpt-5",
    input: messages,
    temperature: 0.4,
    max_output_tokens: 900,
  });

  // Compatibilidade
  // @ts-ignore
  const out = (resp as any).output_text ?? JSON.stringify(resp);
  return String(out).trim();
}

// ===== Streaming (opcional) =====
// Retorna um AsyncGenerator de strings (chunks) para uso no endpoint.
export async function* streamMedicoHelp(
  userText: string,
  options: { mode: MedicoHelpMode; nomeMedico?: string } = { mode: "clinico" }
) {
  const nome = options.nomeMedico ?? "";
  const system = SYSTEM_PROMPT.replace("{{NOME_MEDICO}}", nome.toUpperCase());
  const modePrompt = options.mode === "clinico" ? MODE_CLINICO : MODE_EXPLICATIVO;

  const isMedical = /paciente|dor|febre|press[aã]o|exame|conduta|diagn[oó]stico|cid|posologia|dose|sat|sintoma|gestante|trauma|asma|iam|avc|uti|antibi[oó]tico|analg[eé]sico|pronto|plant[aã]o/i.test(
    userText.toLowerCase()
  );

  const messages = [
    { role: "system", content: system },
    { role: "user", content: `NOME_MEDICO: ${nome}`.trim() },
    { role: "user", content: modePrompt },
    {
      role: "user",
      content: isMedical
        ? "Responda abaixo mantendo EXATAMENTE o estilo e os termos do usuário."
        : "Se o texto a seguir não for médico, diga em UMA linha que o MédicoHelp responde apenas sobre medicina.",
    },
    { role: "user", content: userText },
  ] as const;

  const stream = await client.responses.stream({
    model: "gpt-5",
    input: messages,
    temperature: 0.4,
    max_output_tokens: 900,
  });

  // Emissão incremental de texto
  let buffer = "";
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      buffer += event.delta;
      yield event.delta;
    }
  }
}
