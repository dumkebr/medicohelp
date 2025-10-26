# 🔐 Configurar Secrets do GitHub

Para o deploy automático funcionar, você precisa adicionar 3 secrets no GitHub.

## 📋 Passo a Passo

### 1. Vá para o repositório no GitHub
- Abra: https://github.com/dumkebr/MedicoHelp

### 2. Acesse Settings → Secrets
1. Clique na aba **"Settings"** (no topo)
2. No menu lateral esquerdo, clique em **"Secrets and variables"**
3. Clique em **"Actions"**
4. Clique em **"New repository secret"**

### 3. Adicione os 3 secrets

#### Secret 1: FTP_HOST
- **Name:** `FTP_HOST`
- **Value:** (exemplo: `ftp.medicohelp.com.br`)
- Clique em **"Add secret"**

#### Secret 2: FTP_USERNAME
- **Name:** `FTP_USERNAME`
- **Value:** (exemplo: `u123456789`)
- Clique em **"Add secret"**

#### Secret 3: FTP_PASSWORD
- **Name:** `FTP_PASSWORD`
- **Value:** (sua senha FTP do Hostinger)
- Clique em **"Add secret"**

---

## ✅ Como saber se funcionou?

Após configurar os secrets:
1. Faça qualquer commit e push para o GitHub
2. Vá em **Actions** no repositório
3. Você verá o workflow "Deploy to Hostinger" rodando
4. Aguarde 2-3 minutos
5. Acesse www.medicohelp.com.br e veja as mudanças!

---

## 🔍 Onde encontrar credenciais FTP no Hostinger?

1. Entre no **hPanel** do Hostinger
2. Vá em **Arquivos** → **Contas FTP**
3. Você verá:
   - **Servidor:** (FTP_HOST)
   - **Nome de usuário:** (FTP_USERNAME)
   - **Senha:** (FTP_PASSWORD - clique em "Mostrar" ou crie nova)

---

**Criado para: MédicoHelp**  
**CNPJ: 63.354.382/0001-71**
