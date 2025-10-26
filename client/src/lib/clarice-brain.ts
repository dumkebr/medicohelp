// Knowledge Base Item Type
export interface KBItem {
  id: string;
  perguntas: string[];
  resposta_html: string;
}

// Load all KB files using index.json (modular V7)
export async function loadAllKB(base = '/kb/'): Promise<KBItem[]> {
  try {
    // Load index first to get list of files
    // Use absolute URL to bypass API proxy
    const kbUrl = window.location.origin + base;
    const indexRes = await fetch(kbUrl + 'index.json', { cache: 'no-store' });
    if (!indexRes.ok) {
      console.warn('KB index not found, falling back to hardcoded list');
      return loadFallbackKB(base);
    }
    
    const index = await indexRes.json();
    const files = index.files || [];
    
    const all: KBItem[] = [];
    for (const f of files) {
      try {
        const res = await fetch(kbUrl + f, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          all.push(...data);
        }
      } catch (e) {
        console.warn('KB file fail', f, e);
      }
    }
    return all;
  } catch (e) {
    console.warn('KB index fail', e);
    return loadFallbackKB(base);
  }
}

// Fallback loader for backward compatibility
async function loadFallbackKB(base: string): Promise<KBItem[]> {
  const KB_FILES = ['geral.json', 'assinatura.json', 'conta.json', 'tecnico.json'];
  const all: KBItem[] = [];
  const kbUrl = window.location.origin + base;
  for (const f of KB_FILES) {
    try {
      const res = await fetch(kbUrl + f, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        all.push(...data);
      }
    } catch (e) {
      console.warn('Falha ao carregar KB', f, e);
    }
  }
  return all;
}

// Normalize text (remove accents, lowercase)
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Find answer in Knowledge Base
export function findAnswer(kb: KBItem[], userText: string): KBItem | null {
  if (!userText) return null;

  const t = normalize(userText);

  // Score-based matching for better precision
  const matches: Array<{ item: KBItem; score: number }> = [];

  // 1. Score all items based on match quality
  for (const item of kb) {
    if (!item.perguntas) continue;
    
    let score = 0;
    for (const q of item.perguntas) {
      const normalizedQ = normalize(q);
      
      // Exact match (highest priority)
      if (t === normalizedQ) {
        score += 100;
      }
      // Starts with (high priority)
      else if (t.startsWith(normalizedQ) || normalizedQ.startsWith(t)) {
        score += 50;
      }
      // Contains (medium priority)
      else if (t.includes(normalizedQ)) {
        score += 10;
      }
      // Partial word match (low priority)
      else {
        const words = normalizedQ.split(' ');
        const matchedWords = words.filter(w => t.includes(w));
        score += matchedWords.length * 2;
      }
    }
    
    if (score > 0) {
      matches.push({ item, score });
    }
  }

  // Return the highest scoring match
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score);
    return matches[0].item;
  }

  // 2. Intent-based fallback (semantic patterns) - in priority order
  const intents = [
    { id: 'cancelar_assinatura', keys: ['cancelar assinatura', 'quero cancelar', 'cancelamento'] },
    { id: 'trocar_email', keys: ['trocar email', 'trocar e-mail', 'alterar email', 'mudar e-mail'] },
    { id: 'whatsapp_contato', keys: ['whatsapp', 'contato', 'suporte', 'falar com a equipe'] },
    { id: 'cadastro', keys: ['cadastro', 'cadastrar', 'criar conta'] },
    { id: 'planos_precos', keys: ['plano', 'preco', 'preço', 'mensalidade'] },
  ];

  for (const intent of intents) {
    if (intent.keys.some(k => t.includes(normalize(k)))) {
      const hit = kb.find(x => x.id === intent.id);
      if (hit) return hit;
    }
  }

  return null;
}

// Handle action buttons in KB responses
export function handleAction(action: string): void {
  if (action === 'cancelar') {
    window.open(
      'https://wa.me/5544991065757?text=Quero%20cancelar%20minha%20assinatura%20do%20MédicoHelp.',
      '_blank'
    );
  } else if (action === 'trocar_email') {
    window.open(
      'https://wa.me/5544991065757?text=Preciso%20trocar%20o%20e-mail%20da%20minha%20conta%20no%20MédicoHelp.',
      '_blank'
    );
  }
}

// Log questions for analytics
export function logQuestion(question: string): void {
  try {
    const key = 'clarice_logs';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    if (question) {
      logs.push({ 
        q: question, 
        at: new Date().toISOString() 
      });
    }
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to log question:', e);
  }
}

// Export logs as JSON file
export function exportLogs(): void {
  try {
    const data = localStorage.getItem('clarice_logs') || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clarice_logs.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Não foi possível exportar os logs.');
  }
}
