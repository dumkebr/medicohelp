# 🚀 MédicoHelp Backend - Quick Start

## Instalação Rápida

```bash
# 1. Navegar para o backend
cd medicohelp-backend

# 2. Instalar dependências
npm install

# 3. Rodar o servidor
npm start
```

**Servidor estará em:** `http://localhost:3001`

## ✅ Verificar se está funcionando

```bash
curl http://localhost:3001/health
# Deve retornar: {"ok":true}
```

## 🔐 Login Inicial

**Credenciais padrão:**
- Email: `admin@medicohelp.com.br`
- Senha: `medicohelp-admin`

## 📡 Testar Login via API

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medicohelp.com.br","password":"medicohelp-admin"}'

# Retorna: {"token":"mh$...","email":"...","role":"admin"}
```

## 🎯 Usar o Painel Admin

1. Abrir: `http://localhost:5000/admin-api.html`
2. Configurar Backend URL: `http://localhost:3001`
3. Clicar "Testar Conexão"
4. Fazer login
5. Gerenciar KB, Logs e Vendas!

## 📊 Estrutura do Banco de Dados

Arquivo: `data/medicohelp.db` (SQLite)

**Tabelas:**
- `users` - Usuários admin/editor
- `logs` - Perguntas da Clarice
- `sales` - Dados de vendas
- `protocols` - Protocolos médicos
- `protocol_changes` - Auditoria de mudanças

## 🛠️ Comandos Úteis

```bash
# Dev mode (auto-restart)
npm run dev

# Ver logs do banco
sqlite3 data/medicohelp.db "SELECT * FROM users;"

# Resetar banco (CUIDADO!)
rm data/medicohelp.db
npm start  # Recria com admin padrão
```

## 🔧 Troubleshooting

**Porta 3001 ocupada?**
```bash
# Editar .env
PORT=3002
```

**Banco corrompido?**
```bash
rm data/medicohelp.db
npm start
```

## 📚 Próximos Passos

1. ✅ Backend rodando
2. ✅ Login funcionando
3. 📝 Ler `README.md` para APIs completas
4. 🎨 Usar painel `/admin-api.html`
5. 🔒 Trocar senhas em produção
