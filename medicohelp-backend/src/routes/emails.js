import express from 'express';
const router = express.Router();

// Placeholder para Gmail OAuth
router.get('/', async (_req, res) => {
  res.json({ emails: [], note: 'Configure Gmail OAuth no backend para habilitar.' });
});

export default router;
