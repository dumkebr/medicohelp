# 🚀 Deploy Manual - MédicoHelp VPS

## ⚠️ IMPORTANTE
O deploy automático via SFTP não funciona corretamente (envia imagens mas não arquivos .js/.css).  
Este é o método **semi-automático CONFIÁVEL** que resolveu o problema:

---

## 📋 PROCESSO DE DEPLOY (3 PASSOS)

### 1️⃣ **BUILD AUTOMÁTICO (GitHub Actions)**

Quando você faz `git push` para a branch `main`, o GitHub Actions:
- ✅ Faz o build do frontend
- ✅ Gera artifact `medicohelp-build` com todos os arquivos compilados

**Acesse:** https://github.com/seu-usuario/seu-repo/actions

---

### 2️⃣ **BAIXAR O ARTIFACT**

1. Entre no GitHub Actions (link acima)
2. Clique no workflow mais recente (verde ✅)
3. Role para baixo até "Artifacts"
4. Baixe **medicohelp-build.zip** (~1MB)
5. Extraia o ZIP em uma pasta local

**Estrutura extraída:**
```
medicohelp-build/
├── index.html
├── assets/
│   ├── index-_ro_bY9G.js      (683KB) ⭐ CRÍTICO
│   ├── index-bGKNXLV6.css     (100KB) ⭐ CRÍTICO
│   ├── medprime-heart-icon-*.png
│   └── outros arquivos...
├── manifest.json
├── service-worker.js
└── ...
```

---

### 3️⃣ **UPLOAD PARA O VPS (ESCOLHA UMA OPÇÃO)**

#### **OPÇÃO A: FileZilla (MAIS FÁCIL)** 🖱️

1. Baixe FileZilla: https://filezilla-project.org/
2. Configure conexão:
   - **Host:** `sftp://72.61.219.66`
   - **Usuário:** `root`
   - **Senha:** [sua senha VPS]
   - **Porta:** `22`
3. Conecte
4. No painel direito, navegue para: `/var/www/medicohelp/dist/public/`
5. **ARRASTE** a pasta extraída `medicohelp-build` para substituir arquivos
6. Confirme substituição quando solicitado

#### **OPÇÃO B: SCP via Terminal** 💻

```bash
# Na pasta onde extraiu o artifact:
cd medicohelp-build/

# Enviar tudo de uma vez:
scp -r * root@72.61.219.66:/var/www/medicohelp/dist/public/

# Se precisar senha: digite quando solicitado
```

#### **OPÇÃO C: SFTP via Terminal** 🖥️

```bash
sftp root@72.61.219.66
cd /var/www/medicohelp/dist/public/
put -r medicohelp-build/*
exit
```

---

### 4️⃣ **VERIFICAR NO VPS** ✅

SSH no VPS e confirme os arquivos:

```bash
ssh root@72.61.219.66

# Verificar arquivos críticos (devem ter ~683KB e ~100KB):
ls -lh /var/www/medicohelp/dist/public/assets/index-*.js
ls -lh /var/www/medicohelp/dist/public/assets/index-*.css

# Se estiver correto, reiniciar Nginx:
systemctl restart nginx

# Sair:
exit
```

**Tamanhos esperados:**
- `index-_ro_bY9G.js` → **~683KB** (NÃO 1.5KB!)
- `index-bGKNXLV6.css` → **~100KB** (NÃO 1.5KB!)

---

### 5️⃣ **TESTAR O SITE** 🌐

1. Acesse: **www.medicohelp.com.br**
2. Aperte **Ctrl + Shift + R** (forçar reload sem cache)
3. ✅ Site deve carregar normalmente (não mais tela preta!)

---

## 🔍 TROUBLESHOOTING

### ❌ Tela preta após deploy?

```bash
# SSH no VPS:
ssh root@72.61.219.66

# Verificar tamanho dos arquivos:
ls -lh /var/www/medicohelp/dist/public/assets/index-*.js

# Se mostrar 1.5K em vez de 683K:
# → O arquivo HTML foi enviado em vez do JS
# → Repita o processo de upload (use FileZilla ou SCP)
```

### ❌ Arquivos não aparecem no VPS?

```bash
# Conferir permissões:
chmod -R 755 /var/www/medicohelp
chown -R www-data:www-data /var/www/medicohelp

# Reiniciar Nginx:
systemctl restart nginx
```

### ❌ SFTP demora ou trava?

- Use **FileZilla** que tem interface gráfica e retry automático
- Ou divida o upload em partes:
  ```bash
  scp dist/public/assets/index-*.js root@72.61.219.66:/var/www/medicohelp/dist/public/assets/
  scp dist/public/assets/index-*.css root@72.61.219.66:/var/www/medicohelp/dist/public/assets/
  ```

---

## 📌 RESUMO RÁPIDO

```bash
# 1. Git push (build automático)
git push origin main

# 2. Baixar artifact do GitHub Actions
https://github.com/seu-usuario/seu-repo/actions

# 3. Upload via FileZilla ou SCP:
scp -r medicohelp-build/* root@72.61.219.66:/var/www/medicohelp/dist/public/

# 4. Verificar no VPS:
ssh root@72.61.219.66
ls -lh /var/www/medicohelp/dist/public/assets/index-*.js
systemctl restart nginx

# 5. Testar:
www.medicohelp.com.br (Ctrl+Shift+R)
```

---

## 🎯 POR QUE ESTE MÉTODO FUNCIONA?

| Método | Status | Motivo |
|--------|--------|--------|
| **SFTP-Deploy-Action** | ❌ Falha | Envia imagens mas não .js/.css |
| **Endpoint /download-assets/** | ❌ Falha | Proxy do Replit intercepta |
| **Artifact + Upload manual** | ✅ Funciona | Controle total do processo |

---

## 📞 DÚVIDAS?

Se algo não funcionar:
1. Verifique logs do GitHub Actions
2. Confira tamanho dos arquivos no VPS
3. Teste conexão SFTP/SSH
4. Reinicie Nginx: `systemctl restart nginx`

**Deploy simplificado e confiável! 🚀**
