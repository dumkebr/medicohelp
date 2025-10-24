# MédicoHelp - Site Oficial V7 Integrado ✅

## 🎨 Site Oficial Profissional

### ✅ Arquivos Integrados

#### 📄 HTML (client/public/site/)
```
/site/index.html          → Landing oficial com Dra. Clarice
/site/cadastro.html       → Página de cadastro
/site/admin.html          → Admin local
/site/admin-api.html      → Admin com backend
/site/termo-confidencialidade.html
/site/privacidade.html
```

#### 🎨 Assets Oficiais (client/public/site/assets/)
```
clarice.png       → PNG transparente da Dra. Clarice (1.1MB)
logo-icon.png     → Logo ícone (343KB)
logo-lockup.png   → Logo completo horizontal (4.3KB)
```

#### 💅 CSS/JS
```
/site/css/style.css       → Tema verde escuro profissional
/site/js/app.js           → Scripts e modais
```

#### 🧩 Componentes
```
/site/partials/features.html  → Bloco O QUE É / RECURSOS / EM BREVE
```

## 🏗️ Estrutura Final

```
client/public/
├── site/                       ⭐ SITE OFICIAL
│   ├── index.html              (landing profissional)
│   ├── assets/
│   │   ├── clarice.png
│   │   ├── logo-icon.png
│   │   └── logo-lockup.png
│   ├── css/style.css
│   ├── js/app.js
│   ├── partials/
│   │   └── features.html
│   ├── cadastro.html
│   ├── admin.html
│   ├── admin-api.html
│   ├── termo-confidencialidade.html
│   └── privacidade.html
│
├── assets/                     ⭐ ASSETS GLOBAIS
│   ├── clarice.png             (site oficial - 1.1MB)
│   ├── clarice-hero.png        (React app)
│   ├── logo-icon.png           (novo!)
│   ├── logo-lockup.png         (novo!)
│   └── logo_main.png
│
└── kb/                         ⭐ KNOWLEDGE BASE V7
    ├── index.json
    ├── geral.json
    ├── assinatura.json
    ├── conta.json
    └── tecnico.json
```

## 🎯 URLs de Acesso

| URL | Descrição |
|-----|-----------|
| `/` | **App React** - MédicoHelp completo |
| `/site/` | **Site Oficial** - Landing profissional |
| `/site/index.html` | Landing com Dra. Clarice |

## ✨ Features do Site Oficial

### 🎨 Design Profissional
- Tema verde escuro (#0d3b3a)
- Accent teal (#19c29e)
- Logo oficial horizontal
- PNG transparente da Dra. Clarice
- Sombras e bordas sutis
- Responsivo mobile-first

### 🧩 Componentes
- Header com navegação
- Hero com Clarice PNG
- CTAs principais:
  - Começar agora
  - Ligar para Dra. Clarice
  - Enviar exame
- Features dinâmicas (carregadas via partial)
- Seções: O QUE É / RECURSOS / EM BREVE
- Planos (Essencial / Profissional)
- Footer com links

### ⚙️ Funcionalidades
- `window.MedicoHelp.navigate(route)` - Navegação
- `window.MedicoHelp.openVoice()` - Modal voz
- `window.MedicoHelp.openUploader()` - Modal upload
- `window.MedicoHelp.createHistory(opts)` - Criar história SOAP
- Modais interativos
- Features carregadas dinamicamente

## 🎨 Tema Visual

```css
:root {
  --bg: #0d3b3a;
  --panel: #0f4a47;
  --panel-2: #0e4441;
  --chip: #123f3d;
  --accent: #19c29e;
  --txt: #e8fffb;
  --muted: #a7d6cd;
  --radius: 18px;
}
```

## 📦 Assets Copiados

### ✅ Para /site/assets/ (site oficial)
- clarice.png (1.1MB)
- logo-icon.png (343KB)
- logo-lockup.png (4.3KB)

### ✅ Para /assets/ (global)
- Mesmos arquivos copiados também

## 🚀 Como Testar

### 1. Site Oficial
```
http://localhost:5000/site/
http://localhost:5000/site/index.html
```

### 2. App React
```
http://localhost:5000/
```

### 3. Navegação
- Header: Início, MedPrime, Recursos, Planos, Entrar
- CTAs: Começar, Voz, Upload
- Cards de features são clicáveis

## 🔗 Integração com React

O site oficial usa `window.MedicoHelp` para navegação:

```javascript
// Navegação para rotas React
window.MedicoHelp.navigate('/medprime')
window.MedicoHelp.navigate('/recursos')

// Abrir modais
window.MedicoHelp.openVoice()
window.MedicoHelp.openUploader()

// Criar histórias
window.MedicoHelp.createHistory({mode:'SOAP'})
```

## ✨ Diferenças Site vs App

| Site Oficial (`/site/`) | App React (`/`) |
|-------------------------|-----------------|
| Landing/Marketing | Plataforma completa |
| HTML estático | SPA dinâmica |
| Apresentação | Funcionalidades |
| Sem login | Login/Auth |
| Modais simulados | Features reais |

## 📝 Próximos Passos

1. ✅ Site oficial em `/site/` funcionando
2. ✅ Assets profissionais integrados
3. ✅ Logos oficiais disponíveis
4. 🔜 Conectar `window.MedicoHelp` com rotas React
5. 🔜 Substituir modais simulados por features reais

---

**Status:** ✅ SITE OFICIAL V7 INTEGRADO  
**Data:** 24 Outubro 2025  
**Assets:** 3 logos profissionais + Clarice PNG  
**Tema:** Verde escuro profissional (#0d3b3a / #19c29e)
