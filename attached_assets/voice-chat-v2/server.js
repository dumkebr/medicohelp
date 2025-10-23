// server.js (v2) - igual ao v1, apenas mantendo config de voz feminina e sessão Realtime
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";
const VOICE = process.env.REALTIME_VOICE || "aria";

if (!OPENAI_API_KEY) {
  console.warn("[Atenção] Defina OPENAI_API_KEY nos Secrets do Replit.");
}

app.get("/session", async (req, res) => {
  try {
    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        modalities: ["text", "audio"],
        turn_detection: { type: "server_vad" },
        audio: { voice: VOICE, format: "wav" }
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(resp.status).json({ error: "Falha ao criar sessão Realtime", details: txt });
    }
    const data = await resp.json();
    if (!data?.client_secret?.value) {
      return res.status(500).json({ error: "Resposta sem client_secret.value", raw: data });
    }
    res.json({ client_secret: data.client_secret, model: MODEL, voice: VOICE });
  } catch (e) {
    console.error("Erro /session:", e);
    res.status(500).json({ error: "Erro inesperado no /session", details: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[MédicoHelp Voz] v2 rodando na porta ${PORT}`));