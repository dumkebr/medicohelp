export type Mensagem = {
  role: "user" | "assistant";
  content: string;
  ts: string; // ISO
};

export type Atendimento = {
  id: string;                 // uuid
  title: string;              // primeira pergunta (ou nome editado)
  messages: Mensagem[];
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
  mode?: "clinico" | "explicativo";
  patientId?: string | null;  // opcional: vinculado a paciente
  saved?: boolean;            // "Atendimento salvo" (fixado) - se tiver paciente, NUNCA expira
};

const KEY = "mh_atendimentos";
const CUR = "mh_current_atendimento_id";
const RETENTION_DAYS = 30; // política: expira em 30 dias se não salvo e sem paciente

// 🔥 MIGRATION: Limpar conversas antigas quando versão muda
const VERSION_KEY = "mh_app_version";
const CURRENT_VERSION = "2.0.0-natural"; // Nova versão natural amigável
function checkVersion() {
  const saved = localStorage.getItem(VERSION_KEY);
  if (saved !== CURRENT_VERSION) {
    console.log("🔄 Nova versão - limpando conversas antigas com disclaimers");
    localStorage.removeItem(KEY);
    localStorage.removeItem(CUR);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  }
}
checkVersion(); // Executar imediatamente ao carregar módulo

function loadAllRaw(): Atendimento[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function saveAll(list: Atendimento[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

// Helper: verifica se atendimento deve ser preservado (nunca expirar)
export function isSaved(a: Atendimento) {
  return !!(a.saved || a.patientId);
}

// Remove atendimentos "voláteis" > 30 dias (sem paciente e não salvos)
function cleanup(list: Atendimento[]): Atendimento[] {
  const now = Date.now();
  const ms = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return list.filter(a => {
    if (isSaved(a)) return true; // salvos ou com paciente: nunca expiram
    const age = now - new Date(a.updatedAt || a.createdAt).getTime();
    return age <= ms;
  });
}

export function getCurrentId(): string | null {
  return localStorage.getItem(CUR);
}

export function setCurrentId(id: string | null) {
  if (id) localStorage.setItem(CUR, id);
  else localStorage.removeItem(CUR);
}

export function listAtendimentos(): Atendimento[] {
  const cleaned = cleanup(loadAllRaw());
  if (cleaned.length !== loadAllRaw().length) saveAll(cleaned);
  return cleaned.sort((a,b)=> new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime());
}

export function createAtendimento(): Atendimento {
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const now = new Date().toISOString();
  const novo: Atendimento = { 
    id, 
    title: "Novo atendimento", 
    messages: [], 
    createdAt: now, 
    updatedAt: now, 
    patientId: null,
    mode: "clinico",
    saved: false
  };
  const list = listAtendimentos(); 
  list.unshift(novo); 
  saveAll(list);
  setCurrentId(id);
  return novo;
}

export function getAtendimento(id: string): Atendimento | null {
  return listAtendimentos().find(x => x.id === id) || null;
}

export function addMensagem(id: string, msg: Mensagem) {
  const list = listAtendimentos();
  const idx = list.findIndex(x=>x.id===id);
  if (idx === -1) return;
  const a = list[idx];

  // se for a primeira mensagem do médico, vira título automático
  if (a.messages.length === 0 && msg.role === "user") {
    const primeira = msg.content.trim().replace(/\s+/g," ").slice(0,60);
    a.title = primeira || "Atendimento";
  }

  a.messages.push(msg);
  a.updatedAt = new Date().toISOString();
  list[idx] = a; 
  saveAll(list);
}

export function renameAtendimento(id: string, novoNome: string) {
  const list = listAtendimentos();
  const idx = list.findIndex(x=>x.id===id);
  if (idx === -1) return;
  list[idx].title = novoNome.trim() || list[idx].title;
  list[idx].updatedAt = new Date().toISOString();
  saveAll(list);
}

export function assignPatient(id: string, patientId: string | null) {
  const list = listAtendimentos();
  const idx = list.findIndex(x=>x.id===id);
  if (idx === -1) return;
  list[idx].patientId = patientId;
  // ao vincular paciente, considera "salvo" implicitamente
  if (patientId) list[idx].saved = true;
  list[idx].updatedAt = new Date().toISOString();
  saveAll(list);
}

export function updateMode(id: string, mode: "clinico" | "explicativo") {
  const list = listAtendimentos();
  const idx = list.findIndex(x=>x.id===id);
  if (idx === -1) return;
  list[idx].mode = mode;
  list[idx].updatedAt = new Date().toISOString();
  saveAll(list);
}

export function setSaved(id: string, saved: boolean) {
  const list = listAtendimentos();
  const idx = list.findIndex(x=>x.id===id);
  if (idx === -1) return;
  list[idx].saved = saved;
  list[idx].updatedAt = new Date().toISOString();
  saveAll(list);
}

export function removeAtendimento(id: string) {
  const list = listAtendimentos().filter(x=>x.id!==id);
  saveAll(list);
  const cur = getCurrentId(); 
  if (cur === id) setCurrentId(list[0]?.id || null);
}
