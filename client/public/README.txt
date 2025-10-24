# Pacote Legal – MédicoHelp

Arquivos principais:
- `cadastro.html` – exemplo de página de cadastro com **aceite obrigatório**.
- `legal/termo.html` – Termo de Uso.
- `legal/privacidade.html` – Política de Privacidade.
- `static/style.css` – estilo simples (verde MédicoHelp).

## Como integrar no seu projeto (Replit)
1. Suba a pasta `legal` e `static` para a raiz do projeto.
2. Garanta que o botão "Ler termo" aponte para `legal/termo.html` com `target="_blank"`.
3. No formulário de cadastro, inclua o `checkbox` com `required` e o link para o termo:
   ```html
   <input id="aceite" type="checkbox" required>
   <label for="aceite">Declaro que <a href="legal/termo.html" target="_blank">li e aceito o Termo de Uso</a>.</label>
   ```
4. Se tiver backend, registre o `timestamp` do aceite no banco. No exemplo, é salvo no `localStorage`.

Qualquer ajuste de texto jurídico, trocamos fácil depois que o CNPJ estiver definido.
