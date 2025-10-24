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
