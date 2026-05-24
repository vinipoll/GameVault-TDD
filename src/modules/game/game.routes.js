/**
 * Router de jogos.
 */
import express from 'express';
import GameService from './game.service.js';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';

const router = express.Router();

const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Erro interno.' });
  }
};

// GET /api/games  → listar (filtros: ?categoryId=&search=)
router.get('/', handle(async (req, res) => {
  const { categoryId, search } = req.query;
  const games = await GameService.list({
    categoryId: categoryId ? +categoryId : undefined,
    search,
  });
  res.json(games);
}));

// GET /api/games/recommendations  → personalizado (precisa estar logado)
router.get('/recommendations', authMiddleware, handle(async (req, res) => {
  const games = await GameService.recommendFor(req.user.id);
  res.json(games);
}));

// GET /api/games/:id
router.get('/:id', handle(async (req, res) => {
  const game = await GameService.findById(+req.params.id);
  if (!game) return res.status(404).json({ error: 'Jogo não encontrado.' });
  res.json(game);
}));

// POST /api/games  (admin)
router.post('/', adminMiddleware, handle(async (req, res) => {
  const game = await GameService.create(req.body);
  res.status(201).json(game);
}));

// PUT /api/games/:id  (admin)
router.put('/:id', adminMiddleware, handle(async (req, res) => {
  const game = await GameService.update(+req.params.id, req.body);
  res.json(game);
}));

// DELETE /api/games/:id  (admin)
router.delete('/:id', adminMiddleware, handle(async (req, res) => {
  const ok = await GameService.delete(+req.params.id);
  if (!ok) return res.status(404).json({ error: 'Jogo não encontrado.' });
  res.json({ message: 'Jogo removido.' });
}));

export default router;
