# 🚀 Deploy Automático - GitHub Actions + Hostinger

## ✅ O QUE FOI CONFIGURADO

Agora o MédicoHelp tem **deploy automático**!

### Como funciona:
```
1. Você edita código no Replit
2. Faz commit e push para GitHub
3. GitHub Actions:
   - Instala dependências
   - Faz build do frontend
   - Envia automaticamente para Hostinger
4. www.medicohelp.com.br atualiza sozinho!
```

---

## 📋 CONFIGURAÇÃO NECESSÁRIA (UMA VEZ APENAS)

### ETAPA 1: Obter credenciais FTP do Hostinger

1. Acesse **hPanel** do Hostinger
2. Vá em **Arquivos** → **Contas FTP**
3. Anote 3 informações:
   - **Servidor** (exemplo: `ftp.medicohelp.com.br`)
   - **Nome de usuário** (exemplo: `u123456789`)
   - **Senha** (clique em "Mostrar senha" ou crie uma nova)

### ETAPA 2: Adicionar secrets no GitHub

1. Vá para: https://github.com/dumkebr/MedicoHelp
2. Clique em **Settings** (no topo)
3. No menu lateral: **Secrets and variables** → **Actions**
4. Clique em **"New repository secret"**

**Adicione 3 secrets:**

#### Secret 1: FTP_HOST
- **Name:** `FTP_HOST`
- **Secret:** (exemplo: `ftp.medicohelp.com.br`)
- Clique **"Add secret"**

#### Secret 2: FTP_USERNAME
- **Name:** `FTP_USERNAME`
- **Secret:** (exemplo: `u123456789`)
- Clique **"Add secret"**

#### Secret 3: FTP_PASSWORD
- **Name:** `FTP_PASSWORD`
- **Secret:** (sua senha FTP)
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

### Workflow falha com "Error connecting to FTP"
- **Causa:** Secrets configurados errados
- **Solução:** Verifique FTP_HOST, FTP_USERNAME e FTP_PASSWORD

### Workflow falha com "Permission denied"
- **Causa:** Senha FTP incorreta
- **Solução:** Gere nova senha FTP no Hostinger

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
