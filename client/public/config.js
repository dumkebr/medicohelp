// MédicoHelp - Configuração de API
// Este arquivo define a URL base da API dependendo do ambiente

window.MEDICOHELP_CONFIG = {
  // URL da API no Replit
  API_URL: 'https://medico-help-dumkebr.replit.app',
  
  // Versão do build
  VERSION: '1.0.2',
  BUILD_DATE: new Date().toISOString()
};

console.log('📡 MédicoHelp API Config:', window.MEDICOHELP_CONFIG.API_URL);
