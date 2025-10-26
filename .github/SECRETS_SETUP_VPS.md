# 🔐 Configurar Secrets do GitHub - Hostinger VPS

Para o deploy automático via SFTP funcionar, você precisa adicionar 4 secrets no GitHub.

## 📋 Passo a Passo

### 1. Vá para o repositório no GitHub
- Abra: https://github.com/dumkebr/MedicoHelp

### 2. Acesse Settings → Secrets
1. Clique na aba **"Settings"** (no topo)
2. No menu lateral esquerdo, clique em **"Secrets and variables"**
3. Clique em **"Actions"**
4. Clique em **"New repository secret"**

### 3. Adicione os 4 secrets

#### Secret 1: SFTP_HOST
- **Name:** `SFTP_HOST`
- **Value:** `72.61.219.66`
- Clique em **"Add secret"**

#### Secret 2: SFTP_PORT
- **Name:** `SFTP_PORT`
- **Value:** `22`
- Clique em **"Add secret"**

#### Secret 3: SFTP_USER
- **Name:** `SFTP_USER`
- **Value:** `root`
- Clique em **"Add secret"**

#### Secret 4: SFTP_PASS
- **Name:** `SFTP_PASS`
- **Value:** (sua senha root do VPS)
- Clique em **"Add secret"**

#### Secret 5: SERVER_DIR
- **Name:** `SERVER_DIR`
- **Value:** `/var/www/html`
- Clique em **"Add secret"**

---

## ✅ Como saber se funcionou?

Após configurar os secrets:
1. Faça qualquer commit e push para o GitHub
2. Vá em **Actions** no repositório
3. Você verá o workflow "Deploy to Hostinger VPS" rodando
4. Aguarde 2-3 minutos
5. Acesse www.medicohelp.com.br e veja as mudanças!

---

## ⚠️ IMPORTANTE - Segurança VPS

### Melhorar segurança (recomendado):

1. **Crie um usuário específico para deploy** (ao invés de usar root):
   ```bash
   ssh root@72.61.219.66
   adduser deployer
   usermod -aG www-data deployer
   chown -R deployer:www-data /var/www/html
   ```

2. **Use SSH Key ao invés de senha** (mais seguro):
   - Gere par de chaves SSH
   - Adicione chave pública no VPS
   - Use `ssh_private_key` ao invés de `password` no workflow

Por enquanto, usar root com senha funciona, mas não é o ideal para produção.

---

## 📊 Verificar status do deploy

1. Vá para: https://github.com/dumkebr/MedicoHelp/actions
2. Clique no último workflow executado
3. Veja logs detalhados de cada step

---

**Criado para: MédicoHelp**  
**CNPJ: 63.354.382/0001-71**  
**VPS: 72.61.219.66**
