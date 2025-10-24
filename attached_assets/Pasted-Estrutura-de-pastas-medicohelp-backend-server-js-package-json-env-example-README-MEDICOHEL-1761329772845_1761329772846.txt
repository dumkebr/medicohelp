Estrutura de pastas
medicohelp-backend/
  server.js
  package.json
  .env.example
  README_MEDICOHELP_BACKEND.md
  src/
    services/
      db.js
      auth-mw.js
    routes/
      auth.js
      kb.js
      logs.js
      sales.js
      emails.js
      protocols.js
  data/
    kb/            (fica vazio; o server cria)
    protocols/     (fica vazio; o server cria)

package.json
{
  "name": "medicohelp-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.13"
  }
}

.env.example
PORT=3000
ADMIN_DEFAULT_EMAIL=admin@medicohelp.local
ADMIN_DEFAULT_PASSWORD=medicohelp-admin
JWT_SECRET=troque-isto-no-producao

# Gmail OAuth (opcional para /api/emails)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=
GMAIL_REFRESH_TOKEN=

server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRouter from './src/routes/auth.js';
import kbRouter from './src/routes/kb.js';
import logsRouter from './src/routes/logs.js';
import salesRouter from './src/routes/sales.js';
import emailsRouter from './src/routes/emails.js';
import protocolsRouter from './src/routes/protocols.js';

import { ensureDataDirs, initDb } from './src/services/db.js';
import { authMiddleware } from './src/services/auth-mw.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Limite básico
const limiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use(limiter);

// Data e DB
ensureDataDirs();
await initDb();

// Rotas públicas
app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);

// Rotas autenticadas
app.use('/api', authMiddleware);
app.use('/api/kb', kbRouter);
app.use('/api/logs', logsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/protocols', protocolsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MédicoHelp backend http://localhost:${PORT}`));

src/services/db.js
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('data');
const DB_PATH = path.join(DATA_DIR, 'medicohelp.db');

export function ensureDataDirs(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const p of ['kb','protocols']) {
    const dir = path.join(DATA_DIR, p);
    if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export async function initDb(){
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_question TEXT NOT NULL,
      at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT, product TEXT, amount REAL
    );
    CREATE TABLE IF NOT EXISTS protocols (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      current_version TEXT NOT NULL,
      content_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS protocol_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id TEXT NOT NULL,
      title TEXT NOT NULL,
      version TEXT NOT NULL,
      change_note TEXT,
      changed_by TEXT,
      valid_from TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@medicohelp.local';
  const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'medicohelp-admin';
  const hasAdmin = db.prepare('SELECT 1 FROM users WHERE role = ? LIMIT 1').get('admin');
  if(!hasAdmin){
    db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)')
      .run(adminEmail, hash(adminPass), 'admin');
  }
  db.close();
}

export function getDb(){ return new Database(DB_PATH); }

// Hash demo (trocar por bcrypt em produção)
export function hash(s){ return 'mh$' + Buffer.from(s).toString('base64'); }
export function verifyHash(s, h){ return hash(s) === h; }

src/services/auth-mw.js
import { getDb } from './db.js';

export function authMiddleware(req, res, next){
  const token = req.headers['x-auth'];
  if(!token) return res.status(401).json({ error: 'no_token' });
  const db = getDb();
  try{
    const row = db.prepare('SELECT email, role FROM users WHERE password = ?').get(token);
    if(!row) return res.status(401).json({ error: 'invalid_token' });
    req.user = row; // {email, role}
    next();
  } finally { db.close(); }
}

src/routes/auth.js
import express from 'express';
import { getDb, hash, verifyHash } from '../services/db.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  try{
    const row = db.prepare('SELECT email, password, role FROM users WHERE email = ?').get(email);
    if(!row) return res.status(401).json({ error: 'user_not_found' });
    if(!verifyHash(password, row.password)) return res.status(401).json({ error: 'bad_password' });
    return res.json({ token: row.password, email: row.email, role: row.role });
  } finally { db.close(); }
});

// Criar usuário (admin → cria editores)
router.post('/users', (req, res) => {
  const requester = req.headers['requester'];
  const { email, password, role } = req.body;
  const db = getDb();
  try{
    const me = db.prepare('SELECT role FROM users WHERE password = ?').get(requester || '');
    if(!me || me.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(email, hash(password), role || 'editor');
    res.json({ ok: true });
  } catch(e) {
    res.status(400).json({ error: 'create_user_failed', detail: e.message });
  } finally { db.close(); }
});

export default router;

src/routes/kb.js
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const KB_DIR = path.resolve('data/kb');

function requires(role){
  return (req, res, next) => {
    if(!req.user) return res.status(401).json({ error: 'unauth' });
    if(role === 'editor') return next();
    if(role === 'admin' && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

router.get('/', (req, res) => {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.json'));
  res.json({ files });
});

router.get('/:file', (req, res) => {
  const p = path.join(KB_DIR, req.params.file);
  if(!fs.existsSync(p)) return res.status(404).json({ error: 'not_found' });
  res.type('application/json').send(fs.readFileSync(p, 'utf-8'));
});

// cria/atualiza (admin e editor podem)
router.post('/:file', requires('editor'), (req, res) => {
  const p = path.join(KB_DIR, req.params.file);
  fs.writeFileSync(p, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// apaga (só admin)
router.delete('/:file', requires('admin'), (req, res) => {
  const p = path.join(KB_DIR, req.params.file);
  if(fs.existsSync(p)) fs.unlinkSync(p);
  res.json({ ok: true });
});

export default router;

src/routes/logs.js
import express from 'express';
import { getDb } from '../services/db.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { q } = req.body;
  const db = getDb();
  try{
    db.prepare('INSERT INTO logs (user_question) VALUES (?)').run(q || '');
    res.json({ ok: true });
  } finally { db.close(); }
});

router.get('/', (req, res) => {
  const db = getDb();
  try{
    const rows = db.prepare('SELECT id, user_question, at FROM logs ORDER BY id DESC LIMIT 1000').all();
    res.json(rows);
  } finally { db.close(); }
});

router.get('/csv', (req, res) => {
  const db = getDb();
  try{
    const rows = db.prepare('SELECT id, user_question, at FROM logs ORDER BY id DESC').all();
    let csv = 'id,user_question,at\\n';
    for(const r of rows){ csv += `${r.id},"${(r.user_question||'').replaceAll('"','""')}",${r.at}\\n`; }
    res.type('text/csv').send(csv);
  } finally { db.close(); }
});

export default router;

src/routes/sales.js
import express from 'express';
import multer from 'multer';
import { getDb } from '../services/db.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({ error: 'no_file' });
  const text = req.file.buffer.toString('utf-8');
  const lines = text.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);
  const rows = lines.map(l=>l.split(','));
  const header = rows.shift().map(h=>h.toLowerCase().trim());
  const di = header.indexOf('date'), pi = header.indexOf('product'), ai = header.indexOf('amount');
  if(di<0||pi<0||ai<0) return res.status(400).json({ error: 'bad_header' });

  const db = getDb();
  try{
    const ins = db.prepare('INSERT INTO sales (date,product,amount) VALUES (?,?,?)');
    for(const r of rows){
      const amt = parseFloat((r[ai]||'0').replace(/[^0-9\\.\\-]/g,''))||0;
      ins.run(r[di]||'', r[pi]||'', amt);
    }
    res.json({ ok: true, inserted: rows.length });
  } finally { db.close(); }
});

router.get('/summary', (req, res) => {
  const db = getDb();
  try{
    const total = db.prepare('SELECT SUM(amount) as total FROM sales').get().total || 0;
    const byProduct = db.prepare('SELECT product, SUM(amount) as s FROM sales GROUP BY product ORDER BY s DESC').all();
    res.json({ total, byProduct });
  } finally { db.close(); }
});

export default router;

src/routes/emails.js (placeholder p/ Gmail OAuth)
import express from 'express';
const router = express.Router();

router.get('/', async (_req, res) => {
  res.json({ emails: [], note: 'Configure Gmail OAuth no backend para habilitar.' });
});

export default router;

src/routes/protocols.js (versão + auditoria)
import express from 'express';
import fs from 'fs';
import path from 'path';
import { getDb } from '../services/db.js';

const router = express.Router();
const PROT_DIR = path.resolve('data/protocols');

function requiresEditor(req, res, next){
  if(!req.user) return res.status(401).json({ error: 'unauth' });
  if(req.user.role === 'admin' || req.user.role === 'editor') return next();
  return res.status(403).json({ error: 'forbidden' });
}

router.get('/', (_req, res) => {
  const files = fs.readdirSync(PROT_DIR).filter(f => f.endsWith('.json'));
  res.json({ files });
});

router.get('/:id', (req, res) => {
  const p = path.join(PROT_DIR, req.params.id + '.json');
  if(!fs.existsSync(p)) return res.status(404).json({ error: 'not_found' });
  res.type('application/json').send(fs.readFileSync(p, 'utf-8'));
});

router.post('/:id', requiresEditor, (req, res) => {
  const id = req.params.id; // ex: 'azitromicina-pneumonia-adulto'
  const data = req.body;    // { title, version, content_json, change_note, valid_from }

  const p = path.join(PROT_DIR, id + '.json');
  fs.writeFileSync(p, JSON.stringify(data, null, 2));

  const db = getDb();
  try{
    const exists = db.prepare('SELECT 1 FROM protocols WHERE id = ?').get(id);
    if(!exists){
      db.prepare('INSERT INTO protocols (id, title, current_version, content_json) VALUES (?,?,?,?)')
        .run(id, data.title || id, data.version || '1.0', JSON.stringify(data.content_json||{}));
    } else {
      db.prepare('UPDATE protocols SET title=?, current_version=?, content_json=?, updated_at=datetime("now") WHERE id=?')
        .run(data.title || id, data.version || '1.0', JSON.stringify(data.content_json||{}), id);
    }
    db.prepare('INSERT INTO protocol_changes (protocol_id, title, version, change_note, changed_by, valid_from) VALUES (?,?,?,?,?,?)')
      .run(id, data.title||id, data.version||'1.0', data.change_note||'', req.user.email, data.valid_from||null);
    res.json({ ok: true });
  } finally { db.close(); }
});

export default router;

README_MEDICOHELP_BACKEND.md (resumo rápido)
# MédicoHelp — Backend

## Rodar
1) `cp .env.example .env`
2) `npm install`
3) `npm start`
Abre `http://localhost:3000/health`

## Login inicial
- Email: ADMIN_DEFAULT_EMAIL
- Senha: ADMIN_DEFAULT_PASSWORD
Recebe `{ token, role }`. Use o `token` no header `x-auth` nas rotas protegidas.

## Usuários e papéis
- admin: total
- editor: edita KB e Protocolos
Criar editor:


POST /api/auth/users
Headers: { requester: "<token-do-admin>" }
Body: { "email": "editor@medicohelp.local
", "password": "senha", "role": "editor" }


## KB
- `GET /api/kb` → lista
- `GET /api/kb/:file`
- `POST /api/kb/:file` (salva JSON)
- `DELETE /api/kb/:file` (admin)

## Protocolos (com versão + auditoria)
POST exemplo (azitromicina 5 dias):


POST /api/protocols/azitromicina-pneumonia-adulto
x-auth: <token>
{
"title": "Azitromicina — Pneumonia (Adulto)",
"version": "2025-10",
"valid_from": "2025-10-01",
"change_note": "Curso de 5 dias conforme diretriz 2025",
"content_json": {
"posologia": "500 mg VO 1x/dia por 5 dias",
"observacoes": "Atenção QT; ajuste hepático",
"fontes": ["Diretriz XYZ 2025", "Estudo ABC 2024"]
}
}


## Logs
- `POST /api/logs` → `{ q }`
- `GET /api/logs` / `GET /api/logs/csv`

## Vendas
- `POST /api/sales/upload` (multipart campo `file` com CSV: `date,product,amount`)
- `GET /api/sales/summary`

## E-mail (Gmail)
- `GET /api/emails` (placeholder)
Para ativar:
- Crie credenciais no Google Cloud (OAuth)
- Preencha `.env`
- Adiciono o fluxo de refresh token (posso te passar o script pronto)

Como ligar isso no admin.html do seu front (v6)

No painel admin do front (que já te passei), você só precisa:

Fazer login chamando POST /api/auth/login e guardar o token.

Em cada requisição protegida, mandar x-auth: <token>.

Se quiser, no próximo passo eu já te mando o admin.html alterado pra consumir este backend (login real, salvar KB no servidor, listar protocolos, criar editor etc.).