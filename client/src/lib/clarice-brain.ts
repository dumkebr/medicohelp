// Knowledge Base Item Type
export interface KBItem {
  id: string;
  perguntas: string[];
  resposta_html: string;
}

// KB Categories (modular approach)
const KB_FILES = ['geral.json', 'assinatura.json', 'conta.json', 'tecnico.json'];

// Load all KB files and merge
export async function loadAllKB(base = '/kb/'): Promise<KBItem[]> {
  const all: KBItem[] = [];
  for (const f of KB_FILES) {
    try {
      const res = await fetch(base + f, { cache: 'no-store' });
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

  // 1. Exact match in perguntas array
  for (const item of kb) {
    if (!item.perguntas) continue;
    for (const q of item.perguntas) {
      if (t.includes(normalize(q))) {
        return item;
      }
    }
  }

  // 2. Intent-based fallback (semantic patterns)
  const intents = [
    { id: 'cancelar_assinatura', keys: ['cancelar', 'cancelamento', 'cancelar assinatura'] },
    { id: 'trocar_email', keys: ['trocar email', 'trocar e-mail', 'alterar email', 'mudar e-mail', 'errado email'] },
    { id: 'whatsapp_contato', keys: ['whatsapp', 'contato', 'suporte', 'falar com a equipe'] },
    { id: 'cadastro', keys: ['cadastro', 'cadastrar', 'criar conta'] },
    { id: 'planos_precos', keys: ['plano', 'preco', 'preço', 'mensalidade', 'assinatura'] },
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
