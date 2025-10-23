// server.js
// Backend mínimo para emitir um token efêmero e configurar sessão Realtime (WebRTC) com a OpenAI.
// Suba isso no Replit. Configure no Secrets: OPENAI_API_KEY
//
// O frontend vai chamar: GET /session  -> retorna { client_secret: { value: <token efêmero> }, model: "...", voice: "..." }

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Faltou definir OPENAI_API_KEY nos Secrets do Replit.");
}

const MODEL = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview"; // ajuste se necessário
const VOICE = process.env.REALTIME_VOICE || "aria"; // feminina (ajuste: "aria", "verse", etc., conforme disponível)

// Endpoint para criar um token efêmero (client secret) para o navegador abrir a sessão WebRTC direto com a OpenAI
app.get("/session", async (req, res) => {
  try {
    // Cria sessão/ticket efêmero de Realtime (formato conforme exemplos públicos do Realtime API)
    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        // Modalidades voz + texto
        modalities: ["text", "audio"],
        // Detecção de frase para turn-taking; a API pode expor chaves como "turn_detection"
        // ou "vad" nos exemplos. Mantemos compatibilidade com chaves comuns.
        turn_detection: { type: "server_vad" },
        // Config de áudio de saída; algumas versões aceitam "audio": { voice, format }
        audio: { voice: VOICE, format: "wav" } 
      })
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      return res.status(resp.status).json({ error: "Falha ao criar sessão Realtime", details: errTxt });
    }

    const data = await resp.json();
    // data deve incluir um client_secret efêmero (token) para o navegador iniciar a negociação WebRTC
    // Em versões alternativas, a OpenAI pode retornar chaves como { client_secret: { value }, ... }
    if (!data?.client_secret?.value) {
      return res.status(500).json({ error: "Resposta da OpenAI sem client_secret.value", raw: data });
    }

    res.json({
      client_secret: data.client_secret,
      model: MODEL,
      voice: VOICE
    });
  } catch (e) {
    console.error("Erro /session:", e);
    res.status(500).json({ error: "Erro inesperado no /session", details: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});