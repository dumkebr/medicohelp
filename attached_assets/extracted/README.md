# MédicoHelp — Dra. Clarice Liberada (Replit-ready)

## Como usar no Replit
1. Crie um Repl do tipo **Node.js**.
2. Envie este `.zip` e **extraia** na raiz.
3. No shell do Replit, rode:
   ```bash
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   npm run dev
   ```
   - Abre duas portas: servidor (3000) e web (5173). No Replit, exponha a do **cliente** (5173).  
   - Em produção, use `npm run build` e depois `npm start` (o server ficará na 3000).

4. (Opcional) Para respostas reais da OpenAI, adicione no **Secrets** do Replit:  
   - `OPENAI_API_KEY`

## O que muda
- **/api/chat/general** → Clarice **liberada** (qualquer assunto).
- **/api/chat/clinical** → Clarice **Modo Clínico** (conduta direta e segura).
- **/api/weather** → Previsão simples via wttr.in (sem chave).

O front já vem com:
- Abas **Modo Clínico** e **Fundamentação Teórica** (usa o general por padrão).
- Botão **Ligar** com status "Ligando para Dra. Clarice…".
- Botão **Exemplo de clima** para testar o endpoint web.

Ajuste o layout conforme sua identidade visual.