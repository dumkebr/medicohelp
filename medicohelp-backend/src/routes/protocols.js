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
