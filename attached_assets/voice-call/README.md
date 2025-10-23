# MédicoHelp — Modo Voz (Chamada em tempo real)

Este pacote habilita a **chamada de voz** (estilo telefone) com a IA (“Dra. Clarice”) via **WebRTC + OpenAI Realtime API**.

## Como usar no Replit

1. **Suba estes arquivos** no seu projeto.
2. Vá em **Secrets** do Replit e crie:
   - `OPENAI_API_KEY` = sua API key da OpenAI
   - (opcional) `REALTIME_MODEL` = `gpt-4o-realtime-preview`
   - (opcional) `REALTIME_VOICE` = `aria` (voz feminina)
3. `npm install`
4. `npm start` (o servidor sobe e expõe `GET /session`)
5. No seu frontend, use o componente `VoiceCallButton.jsx` (veja exemplo em `client/example-usage.md`).

> O botão telefônico inicia/encerra a **chamada de voz** full‑duplex com barge‑in (interrupção).

## Observação importante
- A rota `/session` **não expõe** a sua chave. Ela pede à OpenAI um **token efêmero** (`client_secret.value`) e retorna isso ao navegador, que então abre a sessão WebRTC diretamente com a OpenAI com segurança.
- Se o seu plano/conta não tiver acesso ao Realtime API, a chamada pode falhar. Isso não é erro do código.