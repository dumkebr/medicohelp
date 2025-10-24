# MédicoHelp — Backend API

Backend Node.js com Express para gerenciar Knowledge Base, Analytics, Protocolos Médicos e Relatórios.

## 🚀 Instalação

```bash
cd medicohelp-backend
npm install
cp .env.example .env
npm start
```

Servidor abre em: `http://localhost:3001`

## 🔐 Credenciais Padrão

```
Email: admin@medicohelp.com.br
Senha: medicohelp-admin
```

## 📡 APIs Disponíveis

### Públicas

- **GET /health** - Health check

### Autenticação

- **POST /api/auth/login** - Login (retorna token)
  ```json
  { "email": "admin@...", "password": "..." }
  ```
- **POST /api/auth/users** - Criar usuário (admin only)

### Knowledge Base (autenticado)

- **GET /api/kb** - Lista arquivos KB
- **GET /api/kb/:file** - Lê arquivo KB
- **POST /api/kb/:file** - Cria/atualiza KB (editor+)
- **DELETE /api/kb/:file** - Apaga KB (admin only)

### Analytics (autenticado)

- **POST /api/logs** - Salva pergunta `{ "q": "..." }`
- **GET /api/logs** - Lista logs (JSON)
- **GET /api/logs/csv** - Exporta CSV

### Vendas (autenticado)

- **POST /api/sales/upload** - Upload CSV (multipart)
- **GET /api/sales/summary** - Resumo de vendas

### Protocolos Médicos (autenticado)

- **GET /api/protocols** - Lista protocolos
- **GET /api/protocols/:id** - Lê protocolo
- **POST /api/protocols/:id** - Cria/atualiza (editor+)

## 🔑 Autenticação

Header: `x-auth: <token>`

Token é retornado no login.

## 📊 Database

SQLite em `data/medicohelp.db`

Tabelas:
- users (auth)
- logs (analytics)
- sales (relatórios)
- protocols (protocolos médicos)
- protocol_changes (auditoria)

## 🗂️ Estrutura

```
medicohelp-backend/
├── server.js              # Entry point
├── package.json
├── .env                   # Config
├── src/
│   ├── services/
│   │   ├── db.js         # SQLite
│   │   └── auth-mw.js    # Auth middleware
│   └── routes/
│       ├── auth.js       # Login
│       ├── kb.js         # Knowledge Base
│       ├── logs.js       # Analytics
│       ├── sales.js      # Vendas
│       ├── emails.js     # Gmail (placeholder)
│       └── protocols.js  # Protocolos
└── data/
    ├── medicohelp.db     # Database
    ├── kb/               # Arquivos KB
    └── protocols/        # Arquivos protocolos
```

## 🛡️ Roles

- **admin** - Tudo + criar usuários + deletar KB
- **editor** - Editar KB e protocolos

## 🔧 Dev Mode

```bash
npm run dev  # Auto-restart on changes
```

## 📝 TODO

- [ ] Migrar hash para bcrypt
- [ ] Implementar Gmail OAuth
- [ ] Rate limiting por usuário
- [ ] Logs de auditoria
- [ ] Backup automático
