/**
 * MédicoHelp - Chat Service with Streaming Support
 * Supports both simple POST requests and Server-Sent Events (SSE) streaming
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChunk {
  type: "chunk" | "references" | "complete" | "error";
  content?: string;
  references?: any[];
  message?: string;
}

export interface StreamOptions {
  mode?: "clinico" | "explicativo";
  onChunk?: (chunk: string) => void;
  onReferences?: (refs: any[]) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

/**
 * Send a message and receive a streaming response
 */
export async function sendChatStream(
  message: string,
  history: Array<{ role: string; content: string }>,
  options: StreamOptions = {}
): Promise<string> {
  const {
    mode = "clinico",
    onChunk,
    onReferences,
    onComplete,
    onError,
    signal
  } = options;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      mode,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Backend indisponível");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("Streaming não suportado");
  }

  let fullResponse = "";
  let buffer = "";
  let currentEvent = "";
  let dataBuffer: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (dataStr) {
            dataBuffer.push(dataStr);
          }
        } else if (line === "" && dataBuffer.length > 0) {
          const fullDataStr = dataBuffer.join("");
          dataBuffer = [];

          try {
            const eventData = JSON.parse(fullDataStr);

            if (currentEvent === "chunk") {
              const chunk = eventData.content || "";
              fullResponse += chunk;
              onChunk?.(fullResponse);
            } else if (currentEvent === "references" && eventData.references) {
              onReferences?.(eventData.references);
            } else if (currentEvent === "complete") {
              onComplete?.();
            } else if (currentEvent === "error") {
              const errorMsg = eventData.message || "Erro desconhecido";
              onError?.(errorMsg);
              throw new Error(errorMsg);
            }
          } catch (parseError) {
            console.error("Erro ao parsear evento SSE:", parseError);
          }

          currentEvent = "";
        }
      }
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Requisição cancelada");
    }
    throw error;
  }

  return fullResponse;
}

/**
 * Simple chat function without streaming (fallback)
 */
export async function sendChat(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number } = {}
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? "gpt-5",
      temperature: opts.temperature ?? 0.2,
      messages
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data?.error || "Falha na API");
  }
  
  return data?.choices?.[0]?.message?.content || "";
}
