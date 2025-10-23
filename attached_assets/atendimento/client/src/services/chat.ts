
export async function sendChat(
  messages: {role:"system"|"user"|"assistant"; content:string}[],
  opts: { model?: string; temperature?: number } = {}
){
  const r = await fetch("/api/chat",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      model: opts.model ?? "gpt-5",
      temperature: opts.temperature ?? 0.2,
      messages
    })
  });
  const data = await r.json();
  if(!r.ok) throw new Error(data?.error || "Falha na API");
  return data?.choices?.[0]?.message?.content || "";
}
