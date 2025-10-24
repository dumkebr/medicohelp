// Rotas padrão (ajuste conforme sua SPA)
const ROUTES = {
  medprime: '/medprime',
  voice: '/voice',
  upload: '/upload',
  imagens: '/imagens',
  historia: '/historia'
};

// Helper: navegação
function go(routeKey, element){
  const route = element?.dataset?.route || ROUTES[routeKey] || '/';
  // Se houver API global, usa
  if (window.MedicoHelp && typeof window.MedicoHelp.navigate === 'function'){
    window.MedicoHelp.navigate(route);
  } else if (window.router && typeof window.router.push === 'function'){
    window.router.push(route);
  } else {
    // fallback: navega pela URL
    window.location.href = route;
  }
}

// Amarrações
document.getElementById('card-medprime')?.addEventListener('click', e => go('medprime', e.currentTarget));
document.getElementById('card-calc')?.addEventListener('click', e => go('medprime', e.currentTarget));
document.getElementById('card-voz')?.addEventListener('click', e => {
  if (window.MedicoHelp?.openVoice){ window.MedicoHelp.openVoice(); return; }
  go('voice', e.currentTarget);
});
document.getElementById('card-anexos')?.addEventListener('click', e => {
  if (window.MedicoHelp?.openUploader){ window.MedicoHelp.openUploader(); return; }
  go('upload', e.currentTarget);
});
document.getElementById('card-imagens')?.addEventListener('click', e => go('imagens', e.currentTarget));
document.getElementById('card-soap')?.addEventListener('click', e => {
  if (window.MedicoHelp?.createHistory){ window.MedicoHelp.createHistory({mode:'SOAP'}); return; }
  go('historia', e.currentTarget);
});

console.log('[MédicoHelp] bloco ativado. Ajuste ROUTES no script.js se preciso.');
