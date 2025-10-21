// server.js
import fs from 'fs';
import path from 'path';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'accept-logs.jsonl');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch { return []; }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function normalizeCRM(crm) {
  return String(crm||'').trim().toUpperCase();
}

app.post('/api/registerAccept', (req, res) => {
  const { fullName, crm, uf, cpf, acceptedAt } = req.body || {};
  const clientIP = (req.headers['x-forwarded-for']?.split(',')[0]?.trim()) || req.ip;

  const crmRegex = /^\d{4,7}\/[A-Z]{2}$/;
  if (!fullName || fullName.trim().length < 3) {
    return res.status(400).json({ error: 'Nome inválido' });
  }
  if (!crm || !crmRegex.test(crm)) {
    return res.status(400).json({ error: 'CRM inválido' });
  }
  const crmUF = crm.split('/')[1];
  if (!uf || uf !== crmUF) {
    return res.status(400).json({ error: 'UF não confere com CRM' });
  }

  const logEntry = {
    type: 'TERMS_ACCEPTED',
    fullName: fullName.trim(),
    crm: normalizeCRM(crm),
    cpf: cpf || null,
    uf,
    ip: clientIP,
    acceptedAt: acceptedAt || new Date().toISOString(),
    userAgent: req.headers['user-agent'] || null
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', 'utf8');

  const users = loadUsers();
  const idx = users.findIndex(u => normalizeCRM(u.crm) === normalizeCRM(crm));
  const baseUser = {
    fullName: fullName.trim(),
    crm: normalizeCRM(crm),
    uf,
    cpf: cpf || null,
    createdAt: new Date().toISOString(),
    termsAcceptedAt: logEntry.acceptedAt,
    termsIp: clientIP,
    termsUserAgent: logEntry.userAgent,
    active: true
  };
  if (idx >= 0) users[idx] = { ...users[idx], ...baseUser };
  else users.push(baseUser);
  saveUsers(users);

  return res.json({ ok: true });
});

function requireAcceptance(req, res, next) {
  const crmHeader = normalizeCRM(req.headers['x-crm']);
  if (!crmHeader) return res.status(401).json({ error: 'CRM não informado' });

  const users = loadUsers();
  const user = users.find(u => normalizeCRM(u.crm) === crmHeader);
  if (!user || !user.termsAcceptedAt) {
    return res.status(403).json({ error: 'Aceite obrigatório não encontrado' });
  }
  const crmRegex = /^\d{4,7}\/[A-Z]{2}$/;
  if (!crmRegex.test(user.crm)) {
    return res.status(403).json({ error: 'Acesso restrito a médicos (CRM obrigatório)' });
  }

  req.user = user;
  next();
}

app.post('/api/ai/respond', requireAcceptance, (req, res) => {
  const answer = {
    text: "RESUMO TÉCNICO…\n\n> Conteúdo de apoio clínico. Validação e responsabilidade: médico usuário.",
    user: { crm: req.user.crm, name: req.user.fullName }
  };
  res.json(answer);
});

app.get('/termos', (_req, res) => {
  res.type('text/plain').send('Contrato de Uso e Responsabilidade Técnica do MédicoHelp (cole aqui o texto completo).');
});

app.listen(PORT, () => {
  console.log(`MédicoHelp rodando em http://localhost:${PORT}`);
});
