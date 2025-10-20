// API fixa para produção
const API = 'https://api.medicohelp.com.br/api';

// ===== Router simples por views =====
const menuItems = document.querySelectorAll('.menu .item');
function show(view) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.getElementById('view-' + view).style.display = '';
  menuItems.forEach(i => i.classList.toggle('active', i.dataset.view === view));
}
menuItems.forEach(i => i.addEventListener('click', () => show(i.dataset.view)));

// ===== Chat (Atendimento médico) =====
const historyEl = document.getElementById('history');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const fileInput = document.getElementById('fileInput');
const quotaEl = document.getElementById('quota');

let history = [];
let remaining = 50; // exibição simples; o back valida de verdade

function renderChat() {
  historyEl.innerHTML = history.map(h => `
    <div class="msg"><span class="user">Você:</span> ${h.user}</div>
    <div class="msg assistant"><span class="user">Médico Help:</span> ${h.assistant}</div>
  `).join('');
  quotaEl.textContent = `Limite diário: ${remaining}/50`;
}

async function uploadFiles() {
  const files = Array.from(fileInput.files || []);
  if (!files.length) return [];
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  const res = await fetch(`${API}/upload`, { method: 'POST', body: form, headers: { 'X-User-Id': 'demo-doctor' } });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  remaining = Math.max(0, remaining - 1); // 1 por lote
  return data.attachments || [];
}

async function send() {
  const message = (inputEl.value || '').trim();
  const attachments = await uploadFiles();
  inputEl.value = '';
  fileInput.value = '';

  const enriched = attachments.length ? `${message}\n\n[Anexos enviados:\n${attachments.map(a=>`- ${a.filename} (${a.url})`).join('\n')}]` : message;

  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': 'demo-doctor' },
    body: JSON.stringify({ message: enriched, history: history.flatMap(m => ([{ role:'user', content:m.user }, { role:'assistant', content:m.assistant }])) , userRole:'doctor' })
  });
  const data = await res.json();
  const answer = data.answer || data.error || 'Sem resposta.';
  if (!data.error) remaining = Math.max(0, remaining - 1); // 1 por chat
  history.push({ user: enriched, assistant: answer });
  renderChat();
}
if (sendBtn) sendBtn.addEventListener('click', send);
if (inputEl) inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); });

// ===== Novo paciente / Lista de pacientes (localStorage) =====
const key = 'mh_pacientes_v1';
function getPacientes(){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function setPacientes(arr){ localStorage.setItem(key, JSON.stringify(arr)); }

function salvarPaciente() {
  const p = {
    id: Date.now(),
    nome: document.getElementById('pNome').value.trim(),
    cpf: document.getElementById('pCpf').value.trim(),
    nasc: document.getElementById('pNasc').value,
    tel: document.getElementById('pTel').value.trim(),
    end: document.getElementById('pEnd').value.trim(),
    obs: document.getElementById('pObs').value.trim()
  };
  if (!p.nome) return alert('Informe o nome do paciente.');
  const arr = getPacientes();
  arr.push(p); setPacientes(arr);
  alert('Paciente salvo.');
  renderLista();
  show('listaPacientes');
}
const btnSalvar = document.getElementById('btnSalvarPaciente');
if (btnSalvar) btnSalvar.addEventListener('click', salvarPaciente);

function renderLista() {
  const el = document.getElementById('listaPac');
  const arr = getPacientes();
  if (!el) return;
  if (!arr.length) { el.innerHTML = '<p class="status">Nenhum paciente cadastrado ainda.</p>'; return; }
  el.innerHTML = arr.map(p => `
    <div class="item-row">
      <div>
        <div><strong>${p.nome}</strong></div>
        <div class="status">CPF: ${p.cpf || '-'} • Nasc: ${p.nasc || '-'}</div>
        <div class="status">${p.end || ''}</div>
      </div>
      <div class="actions">
        <a class="link" href="https://memed.com.br" target="_blank">Emitir receita</a>
      </div>
    </div>
  `).join('');
}

// Inicialização
renderChat();
renderLista();
document.getElementById('themeBtn')?.addEventListener('click', () => document.documentElement.classList.toggle('dark'));