
export async function loadKB(url = './kb/clarice_kb.json') {
  try { const res = await fetch(url, { cache: 'no-store' }); if (!res.ok) throw new Error('KB não encontrado'); return await res.json(); }
  catch(e){ console.warn('Falha ao carregar KB:', e); return []; }
}
export function findAnswer(kb, userText) {
  if (!userText) return null;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const t = norm(userText);
  for (const item of kb) for (const q of item.perguntas) if (t.includes(norm(q))) return item;
  const heur = [
    {keys:["plano","preco","assinatura","mensalidade"], id:"planos_precos"},
    {keys:["cadastro","cadastrar","criar conta"], id:"cadastro"},
    {keys:["contato","suporte","equipe","whatsapp"], id:"contato"},
    {keys:["voz","ligar","telefone"], id:"modo_voz"},
    {keys:["clinico","evidencias","fundamentacao"], id:"modos_chat"},
    {keys:["termo","privacidade","lgpd","dados"], id:"termos"},
  ];
  for (const h of heur) if (h.keys.some(k => t.includes(k))) return kb.find(x => x.id===h.id) || null;
  return null;
}
