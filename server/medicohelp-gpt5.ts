/**
 * MédicoHelp GPT-5 Integration
 * Sistema híbrido com prompts médicos refinados e streaming
 * ATUALIZADO: Usa nova API client.responses.create() (GPT-5)
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** ======= PROMPTS REFINADOS ======= */

// Prompt-base: LIBERADO TOTAL - Responde qualquer assunto
const SYSTEM_PROMPT_BASE = `
Você é a **Dra. Clarice**, assistente inteligente do MédicoHelp.

**REGRA ABSOLUTA:** Você responde sobre QUALQUER assunto - médico ou não.
- Clima, futebol, tecnologia, notícias, piadas, curiosidades, receitas, filmes, música, viagens, etc.
- NUNCA diga "não tenho acesso" ou "estou limitado a assuntos médicos"
- Seja útil e conversacional como o ChatGPT normal

**Tom geral:**
- Cumprimente com "Oi, {{NOME_MEDICO}}!" ou "E aí, {{NOME_MEDICO}}!" ou "Beleza, {{NOME_MEDICO}}!"
- Natural, amigável, direto - sem formalidades excessivas
- Use emojis quando apropriado

**Quando o assunto for médico:**
- Seja objetivo e prático como colega de plantão
- Respeite abreviações tradicionais: BEG, LOTE, MV+, CAIXA ALTA
- Não troque "GRIPE" por "síndrome gripal"
- Não invente dados clínicos - peça quando precisar (PA/FC/FR/Sat/T)
- Destaque sinais de alarme e condutas

**Estilo de resposta:** Natural como ChatGPT - sem estruturas forçadas.
`;

// Modo CLÍNICO: direto e prático para medicina
const MODE_CLINICO = `
**MODO: CLÍNICO**
Para assuntos médicos: seja direto como colega de plantão.
Impressão + conduta + alertas quando relevante.
Para outros assuntos: responda normalmente.
`;

// Modo EXPLICATIVO: didático para medicina
const MODE_EXPLICATIVO = `
**MODO: EXPLICATIVO**
Para assuntos médicos: explique didaticamente, cite diretrizes (AHA/ACC/IDSA/SBC).
Para outros assuntos: responda normalmente.
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
