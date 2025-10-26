# 🚀 Guia de Deploy - www.medicohelp.com.br no Hostinger

## ✅ PRÉ-REQUISITOS

Antes de começar, você precisa de:
- ✅ API publicada no Replit (URL exemplo: `https://medicohelp-api.replit.app`)
- ✅ Acesso ao painel do Hostinger (hPanel)
- ✅ Cliente FTP (recomendo FileZilla - grátis)

---

## 📝 PASSO A PASSO

### **ETAPA 1: Obter URL da API do Replit**

Após publicar no Replit, copie a URL que apareceu (exemplo: `https://seu-projeto.replit.app`)

### **ETAPA 2: Atualizar configuração no código**

1. Abra o arquivo `client/public/config.js`
2. Substitua `'https://SEU-PROJETO.replit.app'` pela URL real da API
3. Salve o arquivo

### **ETAPA 3: Gerar build otimizado**

No Console do Replit, execute:

```bash
npm run build
```

Isso vai criar a pasta `dist/` com todos os arquivos otimizados.

### **ETAPA 4: Baixar arquivos para seu computador**

Opção A - Via interface do Replit:
1. Clique na pasta `dist/`
2. Clique com botão direito → Download

Opção B - Via terminal (gera ZIP):
```bash
cd dist && zip -r ../medicohelp-build.zip . && cd ..
```
Depois baixe o arquivo `medicohelp-build.zip`

### **ETAPA 5: Conectar ao Hostinger via FTP**

1. **Acesse o hPanel do Hostinger**
2. Vá em **Arquivos** → **Gerenciador de Arquivos**
3. OU use FileZilla com estas credenciais (encontre no hPanel):
   - Host: `ftp.medicohelp.com.br`
   - Usuário: (seu usuário FTP)
   - Senha: (sua senha FTP)
   - Porta: 21

### **ETAPA 6: Upload dos arquivos**

1. **Navegue até a pasta `public_html/`** (ou `www/`)
2. **DELETE todos os arquivos antigos** desta pasta
3. **Faça upload de TODOS os arquivos da pasta `dist/`**
   - Certifique-se de incluir pastas e subpastas
   - Mantenha a estrutura de diretórios

### **ETAPA 7: Configurar .htaccess (IMPORTANTE!)**

Crie um arquivo `.htaccess` na pasta `public_html/` com este conteúdo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirecionar HTTP para HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # SPA routing - redirecionar tudo para index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache headers
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### **ETAPA 8: Testar**

1. Abra **www.medicohelp.com.br** no navegador
2. Teste o login
3. Teste o chat com Dra. Clarice
4. Verifique se as imagens carregam

---

## ⚠️ PROBLEMAS COMUNS

### **Erro 404 ao recarregar página**
- Solução: Verifique se o arquivo `.htaccess` está configurado corretamente

### **Erro de CORS**
- Solução: Certifique-se que a URL da API no `config.js` está correta

### **CSS não carrega**
- Solução: Limpe o cache do navegador (Ctrl+Shift+Del)

### **Login não funciona**
- Solução: Abra o Console do navegador (F12) e verifique se há erros de conexão com a API

---

## 🔄 ATUALIZAÇÕES FUTURAS

Sempre que fizer alterações:

1. Execute `npm run build` novamente
2. Faça upload dos novos arquivos para `public_html/`
3. Limpe cache do navegador

---

## 📞 SUPORTE

Se precisar de ajuda:
- **Hostinger:** Chat ao vivo no hPanel
- **Replit:** Documentação em docs.replit.com

---

**Criado para: C.J.Dumke Tecnologia e Saúde LTDA**  
**CNPJ: 63.354.382/0001-71**  
**Domínio: www.medicohelp.com.br**
