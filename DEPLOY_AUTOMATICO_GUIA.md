# 🚀 Deploy Automático - GitHub Actions + Hostinger VPS

## ✅ O QUE FOI CONFIGURADO

Agora o MédicoHelp tem **deploy automático via SFTP**!

### Arquitetura:
```
┌─────────────────────────────────────────┐
│  www.medicohelp.com.br (Hostinger VPS)  │
│  Frontend: HTML + CSS + JS (React)      │
│  IP: 72.61.219.66                       │
└─────────────────┬───────────────────────┘
                  │
                  │ API calls via HTTPS
                  │
┌─────────────────▼───────────────────────┐
│  API Replit (Backend)                   │
│  Node.js + PostgreSQL + GPT-5           │
│  Login, pacientes, chat com Dra Clarice │
└─────────────────────────────────────────┘
```

### Fluxo de Deploy:
```
1. Você edita código no Replit
2. Faz commit e push para GitHub
3. GitHub Actions:
   - Instala dependências
   - Faz build do frontend
   - Envia via SFTP para VPS Hostinger
4. www.medicohelp.com.br atualiza sozinho!
```

---

## 📋 CONFIGURAÇÃO NECESSÁRIA (UMA VEZ APENAS)

### ETAPA 1: Credenciais SFTP do VPS

Você já tem as credenciais:
- **Host:** `72.61.219.66`
- **Port:** `22`
- **User:** `root`
- **Password:** (sua senha root)
- **Dir:** `/var/www/html`

### ETAPA 2: Adicionar secrets no GitHub

1. Vá para: https://github.com/dumkebr/MedicoHelp
2. Clique em **Settings** (no topo)
3. No menu lateral: **Secrets and variables** → **Actions**
4. Clique em **"New repository secret"**

**Adicione 5 secrets:**

#### Secret 1: SFTP_HOST
- **Name:** `SFTP_HOST`
- **Secret:** `72.61.219.66`
- Clique **"Add secret"**

#### Secret 2: SFTP_PORT
- **Name:** `SFTP_PORT`
- **Secret:** `22`
- Clique **"Add secret"**

#### Secret 3: SFTP_USER
- **Name:** `SFTP_USER`
- **Secret:** `root`
- Clique **"Add secret"**

#### Secret 4: SFTP_PASS
- **Name:** `SFTP_PASS`
- **Secret:** (sua senha root do VPS)
- Clique **"Add secret"**

#### Secret 5: SERVER_DIR
- **Name:** `SERVER_DIR`
- **Secret:** `/var/www/html`
- Clique **"Add secret"**

### ETAPA 3: Publicar API no Replit

1. No Replit, clique no botão **"Publish"** que apareceu
2. Escolha **Autoscale Deployment**
3. Aguarde o deploy (2-5 minutos)
4. **Copie a URL** que aparecer (exemplo: `https://medicohelp-abc.replit.app`)

### ETAPA 4: Atualizar URL da API no código

1. Abra o arquivo `client/public/config.js`
2. Substitua `'https://SEU-PROJETO.replit.app'` pela URL real
3. Salve o arquivo
4. Faça commit e push

---

## 🎯 COMO USAR (DIA A DIA)

### Para atualizar o site:

1. **Edite código no Replit** (comigo)
2. **Faça commit:**
   ```bash
   git add .
   git commit -m "Descrição da mudança"
   ```
3. **Faça push para GitHub:**
   ```bash
   git push origin main
   ```
4. **Aguarde 2-3 minutos** - GitHub Actions faz tudo sozinho!
5. **Acesse www.medicohelp.com.br** - Mudanças aplicadas! ✨

### Acompanhar deploy:

1. Vá para: https://github.com/dumkebr/MedicoHelp/actions
2. Você verá o workflow "Deploy to Hostinger" rodando
3. Clique para ver detalhes e logs em tempo real

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

Após configurar os secrets e fazer primeiro push:

1. Vá em https://github.com/dumkebr/MedicoHelp/actions
2. Você verá um workflow rodando com ✅ verde (sucesso) ou ❌ vermelho (erro)
3. Se tiver erro, clique nele para ver os logs

---

## ⚠️ PROBLEMAS COMUNS

### Workflow falha com "Error connecting to SFTP"
- **Causa:** Secrets configurados errados ou firewall bloqueando
- **Solução:** Verifique SFTP_HOST, SFTP_USER e SFTP_PASS
- **Solução 2:** Verifique se porta 22 está aberta no VPS

### Workflow falha com "Permission denied"
- **Causa:** Senha root incorreta ou usuário sem permissões
- **Solução:** Verifique senha root do VPS
- **Solução 2:** Verifique permissões do diretório `/var/www/html`

### Site não atualiza após deploy
- **Causa:** Cache do navegador
- **Solução:** Force refresh (Ctrl+Shift+R) ou limpe cache

---

## 🎉 BENEFÍCIOS

✅ **Deploy automático** - Sem upload manual via FTP  
✅ **Versionamento** - Todo código no GitHub  
✅ **Histórico** - Veja todos os deploys em Actions  
✅ **Rollback fácil** - Volte para versão anterior se der problema  
✅ **Profissional** - Workflow usado por empresas reais  

---

**Arquivos criados:**
- `.github/workflows/deploy-hostinger.yml` - Workflow automático
- `.github/SECRETS_SETUP.md` - Guia de configuração de secrets
- `client/public/.htaccess` - Configuração do Hostinger
- `client/public/config.js` - Configuração da API

**Empresa:** C.J.Dumke Tecnologia e Saúde LTDA  
**CNPJ:** 63.354.382/0001-71  
**Domínio:** www.medicohelp.com.br
