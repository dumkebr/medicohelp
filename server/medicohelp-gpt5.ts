/**
 * MédicoHelp GPT-5 Integration
 * Sistema híbrido com prompts médicos refinados e streaming
 * ATUALIZADO: Usa nova API client.responses.create() (GPT-5)
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** ======= PROMPTS REFINADOS ======= */

// Prompt-base: TOM NATURAL E CONVERSACIONAL (igual ChatGPT)
const SYSTEM_PROMPT_BASE = `
Você é o **MédicoHelp**, um assistente inteligente e amigável que conversa naturalmente sobre QUALQUER assunto.

**Tom e personalidade:**
- Seja natural, amigável e humano — como um colega de confiança
- Converse normalmente, sem estruturas forçadas ou formalidades excessivas
- Use emojis quando apropriado para tornar a conversa mais leve
- Responda sobre qualquer tema: medicina, dia a dia, tecnologia, entretenimento, ou qualquer outro assunto

**Quando o assunto for médico:**
- Fale como médico experiente: objetivo, prático, sem floreios
- Respeite o jeito tradicional de registrar: mantenha CAIXA ALTA e abreviações (BEG, LOTE, MV+)
- Não troque termos do médico por "protocolares" (ex: "GRIPE" não vira "síndrome gripal")
- Não invente dados clínicos — se precisar de PA/FC/FR/Sat/T, peça
- Destaque sinais de alarme e condutas quando relevante

**Estilo de saudação:**
- Cumprimente naturalmente com "Oi, {{NOME_MEDICO}}!" ou "E aí, {{NOME_MEDICO}}!" ou "Beleza, {{NOME_MEDICO}}!"
- Seja informal e próximo, como um amigo

**NÃO force estruturas** — responda naturalmente como ChatGPT faria.
`;

// Modo CLÍNICO: mais objetivo quando assunto é medicina
const MODE_CLINICO = `
**MODO: CLÍNICO**
Quando o assunto for médico, seja direto e prático como colega de plantão.
Dê impressão clínica, conduta com doses, e alertas.
Você PODE usar emojis e estrutura quando fizer sentido, mas não é obrigatório.
Responda naturalmente — não force formatos.
`;

// Modo EXPLICATIVO: mais didático quando assunto é medicina
const MODE_EXPLICATIVO = `
**MODO: EXPLICATIVO**
Quando o assunto for médico, explique de forma didática e clara.
Cite diretrizes quando relevante (AHA/ACC, IDSA, OMS, SBC, AMB, CFM).
Você PODE usar estrutura quando fizer sentido, mas não é obrigatório.
Responda naturalmente — não force formatos.
`;

/**
 * REMOVIDO: Filtro de "só medicina" - agora responde qualquer assunto
 * Mantém apenas o tom médico tradicional
 */

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
 * USA NOVA API: client.responses.stream()
 */
export async function askMedicoHelpStreaming(
  userText: string,
  options: MedicoHelpOptions,
  onChunk: StreamCallback
): Promise<{ fullText: string; model: string; tokens: number }> {
  const medicalOk = true; // LIBERADO GERAL - sem filtro de assunto
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

  // Montar mensagens usando novo formato "input"
  const inputMessages: any[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: "Responda abaixo mantendo EXATAMENTE o estilo e os termos do usuário."
    },
  ];

  inputMessages.push({ role: "user", content: userText });

  // Determinar modelo
  const gpt5Available = await isGPT5Available();
  const modelToUse = gpt5Available ? "gpt-5" : "gpt-4o";
  
  console.log(`🤖 Usando modelo: ${modelToUse}${gpt5Available ? " (GPT-5 ativo!)" : " (fallback GPT-4o)"}`);

  let fullText = "";
  let tokenCount = 0;

  try {
    // Tentar streaming com NOVA API
    const stream = await (openai as any).responses.stream({
      model: modelToUse,
      input: inputMessages,
      temperature: 0.4,
      max_output_tokens: 16000, // LIBERADO: máximo permitido
    });

    // Processar chunks usando novo formato de eventos
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        const content = event.delta;
        
        if (content) {
          fullText += content;
          tokenCount++;
          onChunk(content);
        }
      }
    }

    console.log(`✅ ${modelToUse} streaming: ${tokenCount} tokens`);
    return { fullText, model: modelToUse, tokens: tokenCount };
    
  } catch (error: any) {
    console.log("⚠️ Erro no streaming GPT-5, tentando fallback:", error.message);
    
    // Fallback 1: Tentar GPT-4o com nova API
    if (modelToUse === "gpt-5") {
      try {
        console.log("🔄 Fallback para GPT-4o com nova API...");
        const stream = await (openai as any).responses.stream({
          model: "gpt-4o",
          input: inputMessages,
          temperature: 0.4,
          max_output_tokens: 16000, // LIBERADO: máximo permitido
        });

        fullText = "";
        tokenCount = 0;

        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            const content = event.delta;
            
            if (content) {
              fullText += content;
              tokenCount++;
              onChunk(content);
            }
          }
        }

        console.log(`✅ gpt-4o streaming fallback: ${tokenCount} tokens`);
        return { fullText, model: "gpt-4o", tokens: tokenCount };
      } catch (fallbackError: any) {
        console.log("⚠️ Nova API falhou, tentando API legada...", fallbackError.message);
      }
    }

    // Fallback 2: API legada (chat.completions)
    try {
      console.log("🔄 Usando API legada (chat.completions.create)...");
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: inputMessages,
        temperature: 0.4,
        max_tokens: 4096,
        stream: true,
      });

      fullText = "";
      tokenCount = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        
        if (content) {
          fullText += content;
          tokenCount++;
          onChunk(content);
        }
      }

      console.log(`✅ gpt-4o (legado) streaming: ${tokenCount} tokens`);
      return { fullText, model: "gpt-4o", tokens: tokenCount };
    } catch (legacyError: any) {
      console.error("❌ Todas as tentativas de streaming falharam:", legacyError);
      throw new Error("Streaming não disponível. Tente novamente.");
    }
  }
}

/**
 * Versão não-streaming (fallback)
 * USA NOVA API: client.responses.create()
 */
export async function askMedicoHelpNonStreaming(
  userText: string,
  options: MedicoHelpOptions
): Promise<{ fullText: string; model: string; tokens: number }> {
  const medicalOk = true; // LIBERADO GERAL - sem filtro de assunto
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

  const inputMessages: any[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: "Responda abaixo mantendo EXATAMENTE o estilo e os termos do usuário."
    },
  ];

  inputMessages.push({ role: "user", content: userText });

  const gpt5Available = await isGPT5Available();
  const modelToUse = gpt5Available ? "gpt-5" : "gpt-4o";
  
  console.log(`🤖 Usando modelo: ${modelToUse} (non-streaming)${gpt5Available ? " (GPT-5 ativo!)" : " (fallback GPT-4o)"}`);

  try {
    // Tentar NOVA API
    const response = await (openai as any).responses.create({
      model: modelToUse,
      input: inputMessages,
      temperature: 0.4,
      max_output_tokens: 16000, // LIBERADO: máximo permitido
    });

    const fullText = response.output_text || "Desculpe, não foi possível processar sua pergunta.";
    const tokens = fullText.length;

    console.log(`✅ ${modelToUse} non-streaming: ${tokens} chars`);
    return { fullText, model: modelToUse, tokens };
    
  } catch (error: any) {
    console.log("⚠️ Nova API falhou, tentando API legada...", error.message);
    
    // Fallback para API legada
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: inputMessages,
        temperature: 0.4,
        max_tokens: 16000, // LIBERADO: máximo permitido
        stream: false,
      });

      const fullText = completion.choices[0]?.message?.content || "Desculpe, não foi possível processar sua pergunta.";
      const tokens = fullText.length;

      console.log(`✅ gpt-4o (legado) non-streaming: ${tokens} chars`);
      return { fullText, model: "gpt-4o", tokens };
    } catch (legacyError: any) {
      console.error("❌ Todas as tentativas falharam:", legacyError);
      throw new Error("Não foi possível processar sua pergunta. Tente novamente.");
    }
  }
}
