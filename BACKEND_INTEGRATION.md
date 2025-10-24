# 🔗 MédicoHelp - Integração Backend V6

## ✅ O que foi criado

### 📁 Backend Separado (`medicohelp-backend/`)

```
medicohelp-backend/
├── server.js                 # Entry point
├── package.json              # Dependências
├── .env                      # Configuração
├── README.md                 # Documentação completa
├── QUICK_START.md           # Início rápido
├── DEPLOY.md                # Guia de deploy
├── src/
│   ├── services/
│   │   ├── db.js            # SQLite + schema
│   │   └── auth-mw.js       # Middleware de autenticação
│   └── routes/
│       ├── auth.js          # Login
│       ├── kb.js            # Knowledge Base CRUD
│       ├── logs.js          # Analytics
│       ├── sales.js         # Relatórios de vendas
│       ├── emails.js        # Gmail (placeholder)
│       └── protocols.js     # Protocolos médicos
└── data/
    ├── medicohelp.db        # SQLite database
    ├── kb/                  # Arquivos KB (JSON)
    └── protocols/           # Protocolos (JSON)
```

### 🎨 Frontend Updates

**Novo painel admin:** `/admin-api.html`
- Conecta ao backend via REST API
- Gerenciamento de KB
- Exportação de logs
- Upload de relatórios CSV
- Gestão de protocolos médicos

**Painel existente:** `/admin.html` (mantido para compatibilidade)
- Usa localStorage
- Funciona offline

## 🚀 Como usar

### 1. Rodar o Backend

```bash
cd medicohelp-backend
npm install
npm start
```

Backend: `http://localhost:3001`

### 2. Acessar Painel Admin

Abrir: `http://localhost:5000/admin-api.html`

### 3. Fazer Login

**Credenciais padrão:**
- Email: `admin@medicohelp.com.br`
- Senha: `medicohelp-admin`

## 📡 APIs Disponíveis

### Autenticação

```bash
# Login
POST /api/auth/login
{
  "email": "admin@medicohelp.com.br",
  "password": "medicohelp-admin"
}

# Response
{
  "token": "mh$...",
  "email": "admin@medicohelp.com.br",
  "role": "admin"
}
```

### Knowledge Base

```bash
# Listar arquivos
GET /api/kb
Headers: x-auth: <token>

# Ler arquivo
GET /api/kb/geral.json
Headers: x-auth: <token>

# Salvar arquivo
POST /api/kb/geral.json
Headers: x-auth: <token>
Body: {...conteúdo JSON...}

# Apagar arquivo (admin only)
DELETE /api/kb/geral.json
Headers: x-auth: <token>
```

### Analytics

```bash
# Salvar log
POST /api/logs
Headers: x-auth: <token>
Body: { "q": "Como tratar pneumonia?" }

# Listar logs
GET /api/logs
Headers: x-auth: <token>

# Exportar CSV
GET /api/logs/csv
Headers: x-auth: <token>
```

### Vendas

```bash
# Upload CSV
POST /api/sales/upload
Headers: x-auth: <token>
Content-Type: multipart/form-data
Body: file=vendas.csv

# Ver resumo
GET /api/sales/summary
Headers: x-auth: <token>
```

### Protocolos Médicos

```bash
# Listar protocolos
GET /api/protocols
Headers: x-auth: <token>

# Ler protocolo
GET /api/protocols/azitromicina-pneumonia
Headers: x-auth: <token>

# Salvar protocolo
POST /api/protocols/azitromicina-pneumonia
Headers: x-auth: <token>
Body: {
  "title": "Azitromicina em Pneumonia Adulto",
  "version": "2.1",
  "content_json": {...},
  "change_note": "Atualizada dosagem",
  "valid_from": "2025-01-01"
}
```

## 🔐 Roles

- **admin**: Tudo + criar usuários + deletar KB
- **editor**: Editar KB e protocolos

## 📊 Database Schema

**SQLite** em `data/medicohelp.db`

```sql
-- Usuários
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT, -- 'admin' | 'editor'
  created_at TEXT
);

-- Analytics
CREATE TABLE logs (
  id INTEGER PRIMARY KEY,
  user_question TEXT,
  at TEXT
);

-- Vendas
CREATE TABLE sales (
  id INTEGER PRIMARY KEY,
  date TEXT,
  product TEXT,
  amount REAL
);

-- Protocolos
CREATE TABLE protocols (
  id TEXT PRIMARY KEY,
  title TEXT,
  current_version TEXT,
  content_json TEXT,
  updated_at TEXT
);

-- Auditoria
CREATE TABLE protocol_changes (
  id INTEGER PRIMARY KEY,
  protocol_id TEXT,
  version TEXT,
  change_note TEXT,
  changed_by TEXT,
  valid_from TEXT,
  created_at TEXT
);
```

## 🎯 Próximos Passos

### Desenvolvimento

1. ✅ Backend rodando localmente
2. ✅ Painel admin conectado
3. 📝 Implementar features específicas
4. 🧪 Testar end-to-end

### Produção

1. 🚀 Deploy backend (Railway, Heroku, VPS)
2. 🔒 Trocar senhas e secrets
3. 🌐 Configurar domínio
4. ✅ Conectar frontend ao backend prod

## 📚 Documentação Completa

- `medicohelp-backend/README.md` - Referência completa
- `medicohelp-backend/QUICK_START.md` - Início rápido
- `medicohelp-backend/DEPLOY.md` - Guia de deploy

## 🛠️ Troubleshooting

**Backend não conecta?**
- Verificar se está rodando: `curl http://localhost:3001/health`
- Checar porta no `.env`

**Erro de autenticação?**
- Usar credenciais corretas
- Checar se token está sendo enviado no header `x-auth`

**Arquivos KB não aparecem?**
- Copiar de `client/public/kb/` para `medicohelp-backend/data/kb/`
- Ou criar via painel admin

**Database corrompido?**
```bash
rm medicohelp-backend/data/medicohelp.db
npm start  # Recria com admin padrão
```

## 🎨 Arquitetura

```
┌─────────────────┐       ┌──────────────────┐
│   Frontend      │       │   Backend V6     │
│   (Port 5000)   │◄─────►│   (Port 3001)    │
│                 │ REST  │                  │
│ - React         │       │ - Express        │
│ - Admin Panel   │       │ - SQLite         │
│ - localStorage  │       │ - JWT Auth       │
└─────────────────┘       └──────────────────┘
```

## 📝 Changelog

**V6.0** - Backend Separado
- ✅ Microserviços independente
- ✅ SQLite database
- ✅ REST APIs completas
- ✅ Sistema de roles (admin/editor)
- ✅ KB management via API
- ✅ Analytics centralizados
- ✅ Relatórios de vendas
- ✅ Protocolos médicos versionados
- ✅ Painel admin API-connected

---

**Empresa:** C.J.Dumke Tecnologia e Saúde LTDA / MEI  
**CNPJ:** 63.354.382/0001-71  
**Versão:** Backend V6 + Frontend Integrado
