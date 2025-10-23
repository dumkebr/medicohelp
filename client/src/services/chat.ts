/**
 * MédicoHelp - Chat Service
 * Simplified API for sending messages to GPT-5
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
}

export async function sendChat(
  messages: ChatMessage[],
  opts: ChatOptions = {}
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
