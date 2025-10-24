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
