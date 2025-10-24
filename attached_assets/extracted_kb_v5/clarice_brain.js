
const KB_FILES = ['geral.json', 'assinatura.json', 'conta.json', 'tecnico.json'];

export async function loadAllKB(base = './kb/') {
  const all = [];
  for (const f of KB_FILES) {
    try {
      const r = await fetch(base + f, { cache: 'no-store' });
      if (r.ok) { all.push(...(await r.json())); }
    } catch (e) { console.warn('Falha ao carregar KB', f, e); }
  }
  return all;
}

export function normalize(s){ return (s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''); }

export function findAnswer(kb, userText){
  const t = normalize(userText);
  for (const item of kb) {
    if (!item.perguntas) continue;
    for (const q of item.perguntas) if (t.includes(normalize(q))) return item;
  }
  const intents=[
    {id:'cancelar_assinatura',keys:['cancelar','cancelamento','cancelar assinatura']},
    {id:'trocar_email',keys:['trocar email','trocar e-mail','alterar email','mudar e-mail','errado email']},
    {id:'whatsapp_contato',keys:['whatsapp','contato','suporte','falar com a equipe']},
    {id:'cadastro',keys:['cadastro','cadastrar','criar conta']},
    {id:'planos_precos',keys:['plano','preco','preço','mensalidade','assinatura']}
  ];
  for(const it of intents){
    if(it.keys.some(k=>t.includes(normalize(k)))){
      const hit = kb.find(x=>x.id===it.id);
      if(hit) return hit;
    }
  }
  return null;
}

export function handleAction(action){
  if(action==='cancelar'){
    window.open('https://wa.me/554491065757?text=Quero%20cancelar%20minha%20assinatura%20do%20M%C3%A9dicoHelp.', '_blank');
  }else if(action==='trocar_email'){
    window.open('https://wa.me/554491065757?text=Preciso%20trocar%20o%20e-mail%20da%20minha%20conta%20no%20M%C3%A9dicoHelp.', '_blank');
  }
}

export function logQuestion(q){
  try{
    const key='clarice_logs';
    const arr=JSON.parse(localStorage.getItem(key)||'[]');
    if(q) arr.push({q, at:new Date().toISOString()});
    localStorage.setItem(key, JSON.stringify(arr));
  }catch(e){}
}

export function exportLogs(){
  try{
    const data=localStorage.getItem('clarice_logs')||'[]';
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='clarice_logs.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }catch(e){ alert('Não foi possível exportar os logs.'); }
}
