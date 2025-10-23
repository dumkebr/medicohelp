/**
 * MédicoHelp GPT-5 Integration
 * Sistema híbrido com prompts médicos refinados e streaming
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** ======= PROMPTS REFINADOS ======= */

// Prompt-base (identidade + regras + tom)
const SYSTEM_PROMPT_BASE = `
Você é o **MédicoHelp**, um assistente clínico médico destinado EXCLUSIVAMENTE a medicina.
Fale como um médico experiente de pronto-socorro: direto, objetivo, humano, sem floreios.
Valorize o jeito tradicional de registrar: quando o usuário usar CAIXA ALTA, mantenha; quando ele usar abreviações (BEG, LOTE, MV+), respeite.
Nunca troque o termo do médico por outro mais "protocolar". Se ele disser "GRIPE", não mude para "síndrome gripal". 
Se precisar adicionar precisão, faça após o termo do médico, entre parênteses (ex.: GRIPE — provável etiologia viral).

**Escopo:** só responda sobre medicina (clínica, protocolos, condutas, interpretação de exames, posologia, triagem, encaminhamentos, documentação assistencial).
Se vier tema fora da medicina, responda: "O MédicoHelp responde apenas sobre medicina."

**Conduta e segurança:**
- Não invente sinais vitais nem dados do exame físico. Se forem necessários para conduzir, peça: "Doutor, me informe PA/FC/FR/Sat/T."
- Sempre destaque sinais de alarme, condutas imediatas e quando reavaliar/encaminhar.
- Use doses pediátricas por kg quando aplicável e máximos por dose/dia (quando forem críticos).
- Se houver risco legal/ético (ex.: prescrição controlada), oriente avaliação presencial quando indicado.

**Estilo fixo:**
- Comece com "Beleza, {{NOME_MEDICO}}. Vamos direto ao ponto:" quando houver nome disponível.
- Estruture, quando fizer sentido:
  🩺 Diagnóstico provável / Impressão clínica  
  ⚡ Conduta imediata  
  🧪 Investigação complementar  
  💬 Observações / Sinais de alarme  
  📇 CID sugerido (quando aplicável)
- Em pedidos de "HISTÓRIA CLÍNICA", produza em CAIXA ALTA no formato que o médico já iniciou, sem enfeitar.
`;

// Prompt do modo CLÍNICO: decisão e conduta, com foco em plantão
const MODE_CLINICO = `
**MODO: CLÍNICO**
Responda como colega no plantão, direto ao ponto. Dê impressão clínica, conduta com doses, e alertas. 
Se faltar dado essencial para decisão imediata, peça em UMA linha no topo (ex.: "Preciso da PA e SatO2.").

Use o formato estruturado com emojis:
🩺 Diagnóstico provável
⚡ Conduta imediata (com doses e vias)
🧪 Investigação complementar
💬 Observações / Sinais de alarme
📇 CID sugerido (quando aplicável)
`;

// Prompt do modo EXPLICATIVO+EVIDÊNCIAS: didática + referências
const MODE_EXPLICATIVO = `
**MODO: EXPLICATIVO + EVIDÊNCIAS**
Explique o raciocínio de forma clara e breve, cite diretrizes/consensos de forma genérica (ex.: "consensos pediátricos, AHA/ACC, IDSA, OMS, SBC, AMB, CFM") sem link externo. 
Quando útil, acrescente classes de recomendação/nível de evidência de forma sucinta.

Mantenha estrutura didática:
👉 Conceito / Fisiopatologia (breve)
📚 Evidências clínicas / Diretrizes
⚡ Aplicação prática
💡 Pontos-chave para memorizar
`;

/**
 * Função auxiliar: verifica se texto é sobre medicina
 */
function isMedicalContent(text: string): boolean {
  const textoLower = text.toLowerCase();
  return /paciente|dor|febre|press[aã]o|exame|conduta|diagn[oó]stico|cid|posologia|dose|s[aã]t|sintoma|crise|gestante|trauma|asma|iam|avc|uti|antibi[oó]tico|antit[eé]tico|pronto|ecg|raio.?x|hemograma|gasometria|bpm|mmhg/i.test(
    textoLower
  );
}

/**
 * Extrai primeiro nome do médico
 */
function extractFirstName(fullName: string | undefined): string {
  if (!fullName) return "";
  const clean = fullName.replace(/^Dr\.?\s*/i, "").trim();
  return clean.split(" ")[0] || clean;
}

/**
 * Interface para opções do chat
 */
export interface MedicoHelpOptions {
  mode: "clinico" | "explicativo";
  nomeMedico?: string;
  evidenceContext?: string;
}

/**
 * Streaming callback type
 */
export type StreamCallback = (chunk: string) => void;

/**
 * Verifica se GPT-5 está disponível
 */
async function isGPT5Available(): Promise<boolean> {
  try {
    // Tenta listar modelos disponíveis
    const models = await openai.models.list();
    const modelList = Array.from(models.data || []);
    return modelList.some((m: any) => m.id?.includes("gpt-5") || m.id?.includes("o3"));
  } catch (error) {
    console.log("Could not check GPT-5 availability:", error);
    return false;
  }
}

/**
 * Ask MédicoHelp com GPT-5 (ou fallback para GPT-4o)
 * Suporta streaming em tempo real via callback
 */
export async function askMedicoHelpStreaming(
  userText: string,
  options: MedicoHelpOptions,
  onChunk: StreamCallback
): Promise<{ fullText: string; model: string; tokens: number }> {
  const isMedical = isMedicalContent(userText);
  const firstName = extractFirstName(options.nomeMedico);
  
  // Montar system prompt
  let systemPrompt = SYSTEM_PROMPT_BASE.replace(
    "{{NOME_MEDICO}}",
    firstName || "Doutor"
  );

  // Adicionar modo
  const modePrompt = options.mode === "clinico" ? MODE_CLINICO : MODE_EXPLICATIVO;
  systemPrompt += "\n\n" + modePrompt;

  // Adicionar evidências se modo explicativo
  if (options.mode === "explicativo" && options.evidenceContext) {
    systemPrompt += `\n\n**Evidências científicas encontradas:**\n${options.evidenceContext}`;
  }

  // Montar mensagens
  const messages: any[] = [
    { role: "system", content: systemPrompt },
  ];

  // Se não for médico, adicionar aviso
  if (!isMedical) {
    messages.push({
      role: "user",
      content: "Lembre-se: responda apenas sobre medicina. Se o texto a seguir não for médico, diga isso em UMA linha."
    });
  } else {
    messages.push({
      role: "user",
      content: "Responda abaixo mantendo o MESMO estilo e termos do usuário (não troque os termos clínicos que ele usou)."
    });
  }

  messages.push({ role: "user", content: userText });

  // Determinar modelo
  const gpt5Available = await isGPT5Available();
  const modelToUse = gpt5Available ? "gpt-5" : "gpt-4o";
  
  console.log(`🤖 Usando modelo: ${modelToUse}${gpt5Available ? " (GPT-5 ativo!)" : " (fallback GPT-4o)"}`);

  let fullText = "";
  let tokenCount = 0;

  try {
    // Tentar streaming
    const stream = await openai.chat.completions.create({
      model: modelToUse as any,
      messages,
      temperature: 0.4, // Mais estável para contexto clínico
      max_tokens: modelToUse === "gpt-5" ? 900 : 4096, // GPT-5: respostas objetivas
      stream: true,
    });

    // Processar chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      
      if (content) {
        fullText += content;
        tokenCount++;
        onChunk(content);
      }
    }

    return { fullText, model: modelToUse, tokens: tokenCount };
    
  } catch (error: any) {
    // Se GPT-5 falhar, fazer fallback para GPT-4o
    if (modelToUse === "gpt-5" && error.message?.includes("model")) {
      console.log("⚠️ GPT-5 falhou, fazendo fallback para GPT-4o");
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.4,
        max_tokens: 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        
        if (content) {
          fullText += content;
          tokenCount++;
          onChunk(content);
        }
      }

      return { fullText, model: "gpt-4o", tokens: tokenCount };
    }
    
    throw error;
  }
}

/**
 * Versão não-streaming (fallback)
 */
export async function askMedicoHelpNonStreaming(
  userText: string,
  options: MedicoHelpOptions
): Promise<{ fullText: string; model: string; tokens: number }> {
  const isMedical = isMedicalContent(userText);
  const firstName = extractFirstName(options.nomeMedico);
  
  // Montar system prompt
  let systemPrompt = SYSTEM_PROMPT_BASE.replace(
    "{{NOME_MEDICO}}",
    firstName || "Doutor"
  );

  const modePrompt = options.mode === "clinico" ? MODE_CLINICO : MODE_EXPLICATIVO;
  systemPrompt += "\n\n" + modePrompt;

  if (options.mode === "explicativo" && options.evidenceContext) {
    systemPrompt += `\n\n**Evidências científicas encontradas:**\n${options.evidenceContext}`;
  }

  const messages: any[] = [
    { role: "system", content: systemPrompt },
  ];

  if (!isMedical) {
    messages.push({
      role: "user",
      content: "Lembre-se: responda apenas sobre medicina. Se o texto a seguir não for médico, diga isso em UMA linha."
    });
  } else {
    messages.push({
      role: "user",
      content: "Responda abaixo mantendo o MESMO estilo e termos do usuário (não troque os termos clínicos que ele usou)."
    });
  }

  messages.push({ role: "user", content: userText });

  const gpt5Available = await isGPT5Available();
  const modelToUse = gpt5Available ? "gpt-5" : "gpt-4o";
  
  console.log(`🤖 Usando modelo: ${modelToUse} (non-streaming)${gpt5Available ? " (GPT-5 ativo!)" : " (fallback GPT-4o)"}`);

  try {
    const completion = await openai.chat.completions.create({
      model: modelToUse as any,
      messages,
      temperature: 0.4,
      max_tokens: modelToUse === "gpt-5" ? 900 : 4096,
      stream: false,
    });

    const fullText = completion.choices[0]?.message?.content || "Desculpe, não foi possível processar sua pergunta.";
    const tokens = fullText.length;

    return { fullText, model: modelToUse, tokens };
    
  } catch (error: any) {
    // Fallback para GPT-4o se GPT-5 falhar
    if (modelToUse === "gpt-5" && error.message?.includes("model")) {
      console.log("⚠️ GPT-5 falhou, fazendo fallback para GPT-4o");
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.4,
        max_tokens: 4096,
        stream: false,
      });

      const fullText = completion.choices[0]?.message?.content || "Desculpe, não foi possível processar sua pergunta.";
      const tokens = fullText.length;

      return { fullText, model: "gpt-4o", tokens };
    }
    
    throw error;
  }
}
