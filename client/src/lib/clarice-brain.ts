// Knowledge Base Item Type
export interface KBItem {
  id: string;
  perguntas: string[];
  resposta_html: string;
}

// Load Knowledge Base from JSON
export async function loadKB(url = '/kb/clarice_kb.json'): Promise<KBItem[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('KB não encontrado');
    return await res.json();
  } catch (e) {
    console.warn('Falha ao carregar KB:', e);
    return [];
  }
}

// Normalize text (remove accents, lowercase)
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Find answer in Knowledge Base
export function findAnswer(kb: KBItem[], userText: string): KBItem | null {
  if (!userText) return null;

  const t = normalize(userText);

  // 1. Exact match in perguntas array
  for (const item of kb) {
    for (const q of item.perguntas) {
      if (t.includes(normalize(q))) {
        return item;
      }
    }
  }

  // 2. Heuristic fallback (semantic patterns)
  const heuristics = [
    { keys: ["plano", "preco", "assinatura", "mensalidade"], id: "planos_precos" },
    { keys: ["cadastro", "cadastrar", "criar conta"], id: "cadastro" },
    { keys: ["contato", "suporte", "equipe", "whatsapp"], id: "contato" },
    { keys: ["voz", "ligar", "telefone"], id: "modo_voz" },
    { keys: ["clinico", "evidencias", "fundamentacao"], id: "modos_chat" },
    { keys: ["termo", "privacidade", "lgpd", "dados"], id: "termos" },
  ];

  for (const h of heuristics) {
    if (h.keys.some(k => t.includes(k))) {
      return kb.find(x => x.id === h.id) || null;
    }
  }

  return null;
}
