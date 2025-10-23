/**
 * Utilidades simples de sessão (localStorage)
 * Sistema leve para gerenciar sessões de atendimento do MédicoHelp
 */

// ====== Tipos ======
export type Msg = { role: "user" | "ai"; text: string };
export type Session = { 
  id: string; 
  title: string; 
  createdAt: number; 
  history: Msg[] 
};

// ====== Storage ======
const KEY = "mh_saved_sessions";

/**
 * Carrega todas as sessões salvas do localStorage
 */
export function loadSessions(): Session[] {
  try { 
    return JSON.parse(localStorage.getItem(KEY) || "[]"); 
  } catch { 
    return []; 
  }
}

/**
 * Salva lista de sessões no localStorage
 */
export function saveSessions(list: Session[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/**
 * Adiciona nova sessão no início da lista (mais recente primeiro)
 */
export function pushSession(s: Session) {
  const list = loadSessions();
  list.unshift(s);
  saveSessions(list);
}

/**
 * Gera ID único baseado em timestamp
 */
export function genId() {
  return String(Date.now());
}

/**
 * Heurística local de título (fallback se IA indisponível)
 * Pega últimas palavras da última mensagem do usuário
 */
export function heuristicTitle(history: Msg[]): string {
  const lastUser = [...history].reverse().find(m => m.role === "user")?.text || "ATENDIMENTO";
  const base = lastUser
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, "") // ES5 compatible
    .slice(0, 40);
  return (base || "ATENDIMENTO") + " • " + new Date().toLocaleDateString();
}
