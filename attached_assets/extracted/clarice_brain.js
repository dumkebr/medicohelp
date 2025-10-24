
import { } from ''; // placeholder to satisfy some bundlers

export async function loadAllKB(base = './kb/') {
  try {
    const idx = await fetch(base + 'index.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : { files: [] });
    const files = idx.files || [];
    const all = [];
    for (const f of files) {
      try {
        const r = await fetch(base + f, { cache: 'no-store' });
        if (r.ok) all.push(...(await r.json()));
      } catch (e) { console.warn('KB file fail', f, e); }
    }
    return all;
  } catch (e) { console.warn('KB idx fail', e); return []; }
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
  }else if(action && action.startsWith('confirm_update:')){
    try{
      const b64 = action.split(':')[1];
      const payload = JSON.parse(atob(b64));
      return postProtocolUpdate(payload);
    }catch(e){ alert('Falha ao confirmar atualização.'); }
  }
}

export function logQuestion(q){
  try{
    const key='clarice_logs';
    const arr=JSON.parse(localStorage.getItem(key)||'[]');
    if(q) arr.push({q, at:new Date().toISOString()});
    localStorage.setItem(key, JSON.stringify(arr));
  }catch(e){}
  const token = localStorage.getItem('mh_token');
  if(token){
    fetch('/api/logs', { method:'POST', headers:{'Content-Type':'application/json','x-auth':token}, body: JSON.stringify({ q }) }).catch(()=>{});
  }
}

export function exportLogs(){
  try{
    const data=localStorage.getItem('clarice_logs')||'[]';
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='clarice_logs.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(e){ alert('Não foi possível exportar os logs.'); }
}

function guessProtocolId(text){
  const t = normalize(text);
  const words = t.replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(Boolean);
  const stop = new Set(['o','a','de','da','do','para','em','no','na','um','uma','adulto','crianca','criança','pediatria','protocolo','atualize','atualizar','corrigir','corrija','mudar','ajuste','tratamento','dias','por','vo','mg']);
  const key = words.filter(w=>!stop.has(w)).slice(0,4).join('-');
  return key || 'protocolo-generico';
}

async function postProtocolUpdate(payload){
  const token = localStorage.getItem('mh_token');
  if(!token){ alert('Você precisa estar logado como editor/admin para atualizar protocolo.'); return; }
  const id = payload.id || guessProtocolId(payload.title||'');
  const body = {
    title: payload.title || id,
    version: payload.version || '1.0',
    valid_from: payload.valid_from || null,
    change_note: payload.change_note || '',
    content_json: payload.content_json || {}
  };
  const res = await fetch('/api/protocols/' + encodeURIComponent(id), {
    method:'POST', headers:{'Content-Type':'application/json','x-auth':token},
    body: JSON.stringify(body)
  });
  if(!res.ok){ const j=await res.json().catch(()=>({})); alert('Falha ao atualizar protocolo: ' + (j.error||res.status)); return; }
  alert('Protocolo atualizado com sucesso: ' + id);
}

export function tryAdminProtocolCommand(addMessage, userText){
  const token = localStorage.getItem('mh_token');
  if(!token) return false;
  const t = normalize(userText);
  if(!(t.includes('protocolo') && (t.includes('atualiz') || t.includes('corrig') || t.includes('mudar') || t.includes('ajuste')))) return false;
  const id = guessProtocolId(userText);
  const daysMatch = t.match(/(\d+)\s*dias?/);
  const doseMatch = t.match(/(\d+)\s*mg/);
  const version = new Date().toISOString().slice(0,7).replace('-','.');
  const payload = {
    id,
    title: userText,
    version,
    change_note: 'Atualização via chat da Dra Clarice',
    content_json: {
      posologia: (doseMatch ? doseMatch[1]+' mg ' : '') + (daysMatch ? ('por ' + daysMatch[1] + ' dias') : ''),
      observacoes: 'Atualizado via comando no chat.'
    }
  };
  const b64 = btoa(JSON.stringify(payload));
  addMessage('Vou preparar a atualização do protocolo <b>'+id+'</b>.<br><button class="clarice-action" data-action="confirm_update:'+b64+'">Confirmar atualização</button>');
  return true;
}
