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
    let csv = 'id,user_question,at\n';
    for(const r of rows){ csv += `${r.id},"${(r.user_question||'').replaceAll('"','""')}",${r.at}\n`; }
    res.type('text/csv').send(csv);
  } finally { db.close(); }
});

export default router;
