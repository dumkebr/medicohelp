# 🚀 Deploy do Backend MédicoHelp

## Opções de Deploy

### 1. Replit (Mesma conta)

**Criar novo Repl:**
1. Novo Repl → Import from GitHub ou Upload
2. Fazer upload da pasta `medicohelp-backend/`
3. Configurar `.env`
4. Rodar `npm install && npm start`
5. Anotar URL do Repl (ex: `https://medicohelp-backend.usuario.repl.co`)

**Conectar frontend:**
- Editar `client/public/admin-api.html`
- Trocar `http://localhost:3001` pela URL do Repl

### 2. Heroku (Grátis com Eco Dynos)

```bash
# Instalar Heroku CLI
brew install heroku/brew/heroku  # Mac
# ou baixar em heroku.com

# Login e deploy
cd medicohelp-backend
git init
heroku create medicohelp-backend
heroku config:set JWT_SECRET=seu-secret-aqui
git add .
git commit -m "Backend inicial"
git push heroku main

# Ver URL
heroku open
```

### 3. Railway (Muito fácil)

1. Acessar [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Selecionar pasta `medicohelp-backend/`
4. Adicionar variáveis no painel
5. Deploy automático!

### 4. Vercel Serverless

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd medicohelp-backend
vercel

# Seguir instruções
```

**⚠️ Nota:** Vercel é serverless, então SQLite não persiste. Use PostgreSQL ou Railway.

### 5. VPS/Servidor Próprio

```bash
# SSH no servidor
ssh user@seu-servidor.com

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Upload e rodar
scp -r medicohelp-backend user@servidor:/opt/
ssh user@servidor
cd /opt/medicohelp-backend
npm install
npm start

# Usar PM2 para manter rodando
npm i -g pm2
pm2 start server.js --name medicohelp-backend
pm2 save
pm2 startup
```

## 🔒 Segurança em Produção

### Trocar Senhas

Editar `.env`:
```env
ADMIN_DEFAULT_PASSWORD=senha-forte-aqui
JWT_SECRET=token-secreto-unico-2025
```

### HTTPS

- **Replit**: Automático
- **Heroku/Railway**: Automático
- **VPS**: Usar Nginx + Let's Encrypt

```nginx
server {
    listen 80;
    server_name api.medicohelp.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### CORS

Editar `server.js`:
```javascript
app.use(cors({
  origin: 'https://seu-frontend.repl.co',
  credentials: true
}));
```

## 📊 Migrar para PostgreSQL (Recomendado)

Se quiser usar PostgreSQL ao invés de SQLite:

1. Instalar `pg`:
```bash
npm install pg
```

2. Editar `src/services/db.js`:
```javascript
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();
```

3. Adaptar queries para PostgreSQL

## 🔄 Backup Automático

```bash
# Cron job para backup diário
0 2 * * * cd /opt/medicohelp-backend && cp data/medicohelp.db backups/$(date +\%Y\%m\%d).db
```

## 📞 Suporte

Problemas? Abrir issue ou contatar suporte.
