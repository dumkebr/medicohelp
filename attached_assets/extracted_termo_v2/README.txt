# Pacote Legal – MédicoHelp (v2)

Inclui Claju MEI e endereço institucional no rodapé e nos documentos legais. CNPJ será inserido quando disponível.

Arquivos:
- `cadastro.html` – formulário com aceite obrigatório e rodapé com endereço.
- `legal/termo.html` – Termo de Uso.
- `legal/privacidade.html` – Política de Privacidade.
- `static/style.css` – estilo.

## Integração no Replit
1. Suba as pastas **/legal** e **/static** e o `cadastro.html` para a raiz do projeto.
2. Aponte o botão “Ler termo” para `legal/termo.html` (target="_blank").
3. Garanta o checkbox `required` no cadastro.
4. Se houver backend, salve o timestamp do aceite no banco (no exemplo usamos `localStorage`).
