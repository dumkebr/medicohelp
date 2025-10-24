# 🧠 Knowledge Base da Dra. Clarice

## 📖 Como Funciona

A Dra. Clarice usa um sistema de **Knowledge Base (KB)** baseado em JSON para responder perguntas automaticamente no chat da landing page.

## 🎯 Alimentar o Bot (Sem Dor de Cabeça)

### Passo a Passo

1. **Abra o arquivo:** `client/public/kb/clarice_kb.json`

2. **Estrutura de cada item:**
```json
{
  "id": "identificador_unico",
  "perguntas": ["palavra1", "palavra2", "frase completa"],
  "resposta_html": "<b>Texto</b> com <a href='#'>HTML</a> que a Clarice vai responder"
}
```

3. **Adicione ou edite perguntas:**
   - Adicione palavras-chave em `perguntas[]`
   - Escreva a resposta em HTML em `resposta_html`

4. **Salve o arquivo** → **Já funciona!** ✨

## 🔍 Exemplos

### Exemplo 1: Sobre Planos
```json
{
  "id": "planos_precos",
  "perguntas": [
    "planos",
    "preços",
    "quanto custa",
    "mensalidade",
    "assinatura"
  ],
  "resposta_html": "<b>Planos:</b> Oferecemos plano gratuito e plano PRO. Fale com a equipe para saber mais!"
}
```

### Exemplo 2: Contato
```json
{
  "id": "contato",
  "perguntas": [
    "contato",
    "falar com a equipe",
    "suporte",
    "whatsapp"
  ],
  "resposta_html": "Posso te encaminhar para a equipe pelo WhatsApp.<br/>👉 <a class='clarice-whats' href='https://wa.me/554491065757' target='_blank'>Falar com a equipe</a>"
}
```

## 🎨 Dicas de HTML na Resposta

- Use `<b>texto</b>` para **negrito**
- Use `<br/>` para quebra de linha
- Use `<a href='url' target='_blank'>link</a>` para links
- Estilos inline: `style="color: #1affb8; font-weight: 600;"`

## 🧪 Sistema Inteligente

O sistema:
1. **Normaliza** texto (remove acentos, lowercase)
2. **Busca exata** nas perguntas
3. **Fallback heurístico** (padrões semânticos)
4. **Resposta padrão** se não encontrar nada

## 📝 Itens Atuais na KB

| ID | Tema | Perguntas |
|---|---|---|
| `o_que_e` | Sobre a plataforma | "o que é", "como funciona" |
| `cadastro` | Cadastro | "cadastrar", "criar conta" |
| `contato` | Contato | "contato", "suporte", "whatsapp" |
| `planos_precos` | Planos | "planos", "preços", "quanto custa" |
| `modo_voz` | Modo voz | "modo voz", "ligação", "telefonar" |
| `modos_chat` | Modos do chat | "clínico", "evidências", "fundamentação" |
| `termos` | Termos legais | "termo", "privacidade", "lgpd" |
| `elegibilidade` | Quem pode usar | "quem pode usar", "médico" |
| `duvida_geral` | Dúvidas gerais | "ajuda", "dúvida", "não sei" |

## 🚀 Arquivos do Sistema

- **KB JSON:** `client/public/kb/clarice_kb.json` (dados)
- **Brain TS:** `client/src/lib/clarice-brain.ts` (lógica)
- **Landing:** `client/src/pages/landing.tsx` (interface)

## ✅ Vantagens

✅ Sem código - apenas edite o JSON  
✅ Respostas ricas em HTML  
✅ Sistema inteligente de busca  
✅ Fácil manutenção  
✅ Escalável (adicione quantos itens quiser)

---

**💡 Dica:** Teste suas mudanças abrindo o chat na landing page e enviando uma das palavras-chave!
