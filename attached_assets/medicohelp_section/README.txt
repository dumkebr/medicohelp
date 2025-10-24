# MédicoHelp – Bloco O QUE É / RECURSOS / EM BREVE
Pacote pronto para colar no Replit ou na sua SPA.

## Arquivos
- `index.html` – página demo com o componente.
- `style.css` – estilos do componente (independente).
- `script.js` – amarrações de clique com rotas configuráveis.

## Integração na sua app
1. Copie o conteúdo do `<section class="mh-wrap">...</section>` para onde deseja exibir.
2. Garanta que `style.css` esteja importado no seu CSS global OU copie as regras para sua folha.
3. Importe `script.js` e ajuste as rotas no objeto `ROUTES`.

### Hooks opcionais (se existirem na sua SPA)
- `window.MedicoHelp.navigate(route)` – navegação interna.
- `window.MedicoHelp.openVoice()` – abre o modo voz (chamada).
- `window.MedicoHelp.openUploader()` – abre o uploader de anexos.
- `window.MedicoHelp.createHistory({mode:'SOAP'})` – inicia história clínica.

Se os hooks não existirem, o script faz fallback para `window.location.href`.
