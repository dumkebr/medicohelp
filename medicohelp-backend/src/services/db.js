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
    console.log(`✅ Admin criado: ${adminEmail}`);
  }
  db.close();
}

export function getDb(){ return new Database(DB_PATH); }

// Hash demo (trocar por bcrypt em produção)
export function hash(s){ return 'mh$' + Buffer.from(s).toString('base64'); }
export function verifyHash(s, h){ return hash(s) === h; }
