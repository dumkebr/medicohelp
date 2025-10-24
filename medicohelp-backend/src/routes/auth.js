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
