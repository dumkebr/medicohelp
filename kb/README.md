# 🧠 Knowledge Base da Dra. Clarice V5 - Modular

## 📖 Como Funciona

A Dra. Clarice usa um sistema **modular de Knowledge Base** com arquivos JSON separados por categoria para responder perguntas automaticamente no chat da landing page.

## 🎯 Alimentar o Bot (Sem Dor de Cabeça)

### V5 - Sistema Modular por Categoria

Os arquivos KB estão organizados em **4 categorias**:

```
client/public/kb/
├── geral.json        ← Sobre plataforma, modos do chat
├── assinatura.json   ← Planos, preços, cancelamento
├── conta.json        ← Cadastro, trocar email
└── tecnico.json      ← Termos, privacidade, contato
```

### Passo a Passo

1. **Escolha o arquivo da categoria:**
   - `geral.json` - Perguntas gerais sobre a plataforma
   - `assinatura.json` - Tudo sobre planos e pagamentos
   - `conta.json` - Gestão de conta e cadastro
   - `tecnico.json` - Termos legais e suporte técnico

2. **Estrutura de cada item:**
```json
{
  "id": "seu_id_unico",
  "perguntas": ["palavra1", "palavra2", "frase completa"],
  "resposta_html": "<b>Texto</b> com <a href='#'>HTML</a> que a Clarice vai responder"
}
```

3. **Salve o arquivo** → **Já funciona!** ✨

---

## ⚡ NOVIDADES DA V5

### 1️⃣ **Botões Interativos de Ação**

Agora você pode adicionar **botões clicáveis** nas respostas:

```json
{
  "id": "cancelar_assinatura",
  "perguntas": ["cancelar assinatura", "quero cancelar"],
  "resposta_html": "Posso te ajudar com o cancelamento.<br/><button class='clarice-action' data-action='cancelar'>Cancelar assinatura</button>"
}
```

**Ações disponíveis:**
- `data-action='cancelar'` → Abre WhatsApp para cancelar
- `data-action='trocar_email'` → Abre WhatsApp para trocar email

**Adicione suas próprias ações** editando `handleAction()` em `client/src/lib/clarice-brain.ts`!

---

### 2️⃣ **Sistema de Analytics Automático**

✅ **Todas as perguntas são logadas automaticamente** em `localStorage`  
✅ **Formato:** `{ q: "pergunta do usuário", at: "2025-10-24T..." }`  
✅ **Exportação:** Use `exportLogs()` para baixar JSON

**Como usar:**
```typescript
import { exportLogs } from '@/lib/clarice-brain';

// Chame em algum botão admin
<button onClick={exportLogs}>Baixar logs das perguntas</button>
```

---

## 🔍 Exemplos Práticos

### Exemplo 1: Adicionar resposta com botão de ação

**Arquivo:** `assinatura.json`

```json
{
  "id": "atualizar_cartao",
  "perguntas": [
    "atualizar cartão",
    "mudar forma de pagamento",
    "trocar cartão"
  ],
  "resposta_html": "Vou te ajudar a atualizar seu cartão!<br/><button class='clarice-action' data-action='atualizar_cartao'>Atualizar cartão</button>"
}
```

Depois adicione a ação em `clarice-brain.ts`:

```typescript
export function handleAction(action: string): void {
  if (action === 'atualizar_cartao') {
    window.open('https://wa.me/5544991065757?text=Quero%20atualizar%20meu%20cartão', '_blank');
  }
}
```

---

### Exemplo 2: Link estilizado do WhatsApp

**Arquivo:** `tecnico.json`

```json
{
  "id": "suporte_urgente",
  "perguntas": ["urgente", "emergência", "ajuda agora"],
  "resposta_html": "Entendo! Te encaminho agora:<br/><a class='clarice-whats' href='https://wa.me/5544991065757?text=Preciso%20de%20ajuda%20urgente' target='_blank'>Falar com suporte AGORA</a>"
}
```

---

### Exemplo 3: Resposta com múltiplas opções

**Arquivo:** `geral.json`

```json
{
  "id": "recursos_completos",
  "perguntas": ["recursos", "funcionalidades", "o que tem"],
  "resposta_html": "<b>Recursos do MédicoHelp:</b><br/>• Modo Clínico (direto ao ponto)<br/>• Evidências Clínicas (com referências)<br/>• MedPrime (calculadoras médicas)<br/>• Modo Voz com Dra. Clarice<br/><br/><a href='/register' style='color: #1affb8; font-weight: 600;'>Começar agora</a>"
}
```

---

## 🎨 Classes CSS Disponíveis

### Botões de Ação
```html
<button class='clarice-action' data-action='nome_da_acao'>Texto do botão</button>
```
- Verde #00d9a3
- Hover: mais claro #1affb8
- Efeito de elevação

### Links WhatsApp Estilizados
```html
<a class='clarice-whats' href='URL' target='_blank'>Texto do link</a>
```
- Verde claro #1affb8
- Sublinhado suave
- Hover: sublinhado mais forte

### Formatação HTML Geral
```html
<b>Negrito</b>
<br/> <!-- quebra de linha -->
<a href='URL' target='_blank' style='color: #1affb8;'>Link colorido</a>
```

---

## 📋 Estrutura Atual da KB (V5)

### `geral.json` (3 itens)
- `o_que_e` - Sobre a plataforma
- `modos_chat` - Modo Clínico vs Evidências
- `modo_voz` - Como usar modo voz

### `assinatura.json` (2 itens)
- `planos_precos` - Informações sobre planos
- `cancelar_assinatura` - **COM BOTÃO** de cancelamento

### `conta.json` (2 itens)
- `cadastro` - Como se cadastrar
- `trocar_email` - **COM BOTÃO** para trocar email

### `tecnico.json` (2 itens)
- `termos` - Termo e privacidade
- `whatsapp_contato` - Contato com equipe

**Total:** 9 itens divididos em 4 categorias

---

## 🚀 Arquivos do Sistema V5

```
client/public/kb/
├── geral.json          ← EDITE AQUI (perguntas gerais)
├── assinatura.json     ← EDITE AQUI (planos/pagamentos)
├── conta.json          ← EDITE AQUI (cadastro/conta)
└── tecnico.json        ← EDITE AQUI (termos/suporte)

client/src/lib/clarice-brain.ts  ← Lógica (adicione ações aqui)
client/src/pages/landing.tsx     ← Interface (não mexer)
kb/README.md                     ← Esta documentação
```

---

## 🧪 Como o Sistema Funciona (V5)

1. **Carregamento:** `loadAllKB()` carrega os 4 arquivos JSON no mount
2. **Merge:** Todos os itens são combinados em um único array
3. **Busca:** `findAnswer()` normaliza texto e busca por palavra-chave
4. **Resposta:** HTML é renderizado com suporte a botões/links
5. **Analytics:** Pergunta é salva automaticamente em `localStorage`
6. **Ações:** Clicks em `.clarice-action` disparam `handleAction()`

---

## 💡 Vantagens da V5

✅ **Organização modular** - Fácil encontrar e editar por categoria  
✅ **Botões interativos** - Ações diretas sem múltiplos cliques  
✅ **Analytics automático** - Rastreie o que usuários perguntam  
✅ **Zero código** - Apenas edite os JSONs  
✅ **Respostas ricas** - HTML completo + CSS customizado  
✅ **Escalável** - Adicione quantos arquivos/categorias quiser  

---

## 🎯 Próximos Passos

1. ✏️ **Edite** os 4 arquivos JSON e personalize as respostas
2. 🔘 **Adicione** mais botões de ação conforme necessário
3. 📊 **Monitore** analytics via `exportLogs()`
4. 🎨 **Customize** CSS dos botões/links se quiser
5. 📚 **Expanda** criando novos arquivos JSON (adicione em `KB_FILES`)

---

## ⚙️ Como Adicionar Nova Categoria

1. Crie `client/public/kb/sua_categoria.json`
2. Edite `client/src/lib/clarice-brain.ts`:
```typescript
const KB_FILES = [
  'geral.json', 
  'assinatura.json', 
  'conta.json', 
  'tecnico.json',
  'sua_categoria.json'  // ← Adicione aqui
];
```
3. Pronto! A nova categoria será carregada automaticamente

---

**🚀 Sistema V5 100% operacional! Modular, interativo e com analytics integrado!**
