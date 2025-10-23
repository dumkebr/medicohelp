# Pacote MédicoHelp (GPT-5, tom clínico)

## O que vem
- `api/medicohelp.ts` → endpoint universal (Next.js ou Express) com **streaming**.
- `lib/medicohelpAI.ts` → identidade, prompts e modos (usa **GPT-5**).
- `components/Chat.tsx` → componente com 2 botões **Clínico / Avançado** (verde #3cb371) e leitura por streaming.

## Como usar no Replit (diretório `/home/runner/workspace`)
1. Coloque os arquivos nas pastas indicadas (`api/`, `lib/`, `components/`).
2. Garanta a variável de ambiente `OPENAI_API_KEY` no Replit (Secrets).
3. **Front-end**: importe e renderize o componente:
   ```tsx
   import ChatMedicoHelp from "./components/Chat";
   export default function App() {
     return <ChatMedicoHelp doctorName="Clairton" />;
   }
   ```
4. **Back-end**:
   - Se for **Next.js**: mantenha `api/medicohelp.ts` em `pages/api` ou adapte para `app/api/medicohelp/route.ts` exportando o handler.
   - Se for **Express**: importe o helper e monte a rota:
     ```ts
     import express from "express";
     import { mountMedicoHelpRoute } from "./api/medicohelp";
     const app = express();
     app.use(express.json());
     mountMedicoHelpRoute(app); // /api/medicohelp
     app.listen(process.env.PORT || 3000);
     ```

## Importante
- O tom é **direto e tradicional** ("Beleza, Doutor...").
- O sistema **não troca seus termos** (ex.: não muda "GRIPE" para "síndrome gripal").
- **Streaming** ativo para resposta fluindo em tempo real.
- Foco exclusivo em **medicina** (bloqueio simples de escopo).
