import express from 'express';
import multer from 'multer';
import { getDb } from '../services/db.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({ error: 'no_file' });
  const text = req.file.buffer.toString('utf-8');
  const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const rows = lines.map(l=>l.split(','));
  const header = rows.shift().map(h=>h.toLowerCase().trim());
  const di = header.indexOf('date'), pi = header.indexOf('product'), ai = header.indexOf('amount');
  if(di<0||pi<0||ai<0) return res.status(400).json({ error: 'bad_header' });

  const db = getDb();
  try{
    const ins = db.prepare('INSERT INTO sales (date,product,amount) VALUES (?,?,?)');
    for(const r of rows){
      const amt = parseFloat((r[ai]||'0').replace(/[^0-9\.\-]/g,''))||0;
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
