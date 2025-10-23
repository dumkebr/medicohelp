
MédicoHelp — Branding Teal v1

Arquivos:
- public/logo-medicohelp-horizontal.svg  (marca + slogan)
- public/logo-medicohelp-icon.svg        (ícone)
- public/favicon-64.png, public/favicon-32.png
- public/clarice-banner-teal.png         (placeholder de banner)

- css/branding.css                       (paleta teal/petróleo + utilitários)

Como aplicar no Replit (Vite/TS):
1) Copie os arquivos de /public para a pasta client/public do projeto.
2) Copie css/branding.css para client/src/styles/branding.css e importe:
   import "./styles/branding.css?ver=2025-10-23-11"
3) Troque os assets no seu layout:
   <img src="/logo-medicohelp-horizontal.svg?v=2025-10-23-11" .../>
   <link rel="icon" href="/favicon-32.png?v=2025-10-23-11">
4) Rode:  rm -rf client/dist && npm run start
5) Abra com:  ?v=2025-10-23-11
