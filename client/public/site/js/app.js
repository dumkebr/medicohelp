window.MedicoHelp = window.MedicoHelp || {};
window.MedicoHelp.navigate = (route) => { location.hash = '#' + (route.startsWith('/') ? route : '/' + route); };
window.MedicoHelp.openVoice = () => { document.querySelector('#modal-voz').hidden = false; };
window.MedicoHelp.openUploader = () => { document.querySelector('#modal-upload').hidden = false; };
window.MedicoHelp.createHistory = (opts={mode:'SOAP'}) => { alert('Iniciar história clínica: ' + (opts.mode||'SOAP')); };

document.getElementById('cta-voz').addEventListener('click', () => window.MedicoHelp.openVoice());
document.getElementById('cta-upload').addEventListener('click', () => window.MedicoHelp.openUploader());
document.getElementById('cta-comecar').addEventListener('click', () => window.MedicoHelp.navigate('/recursos'));

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', (e)=>{
    const sel = e.currentTarget.getAttribute('data-close');
    const el = document.querySelector(sel);
    if(el) el.hidden = true;
  });
});

document.getElementById('upload-enviar').addEventListener('click', ()=>{
  const fi = document.getElementById('file-input');
  if(!fi.files.length){ alert('Selecione um arquivo.'); return; }
  alert('Arquivos prontos para interpretação e extração para a história clínica.');
  document.getElementById('modal-upload').hidden = true;
});

fetch('partials/features.html')
  .then(r=>r.text())
  .then(html=>{ document.getElementById('features').innerHTML = html; })
  .catch(()=>{ document.getElementById('features').innerHTML = '<div class="mh-container"><p>Falha ao carregar recursos.</p></div>'; });

console.log('[MédicoHelp] site base (oficial) carregado.');
