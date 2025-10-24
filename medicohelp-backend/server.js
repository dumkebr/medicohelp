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
app.listen(PORT, () => console.log(`🚀 MédicoHelp Backend → http://localhost:${PORT}`));
