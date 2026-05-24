/**
 * Router de avaliações.
 */
import express from 'express';
import ReviewService from './review.service.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Erro interno.' });
  }
};

// GET /api/reviews/game/:gameId
router.get('/game/:gameId', handle(async (req, res) => {
  res.json(await ReviewService.listByGame(+req.params.gameId));
}));

// POST /api/reviews/game/:gameId  → cria/atualiza
router.post('/game/:gameId', authMiddleware, handle(async (req, res) => {
  const review = await ReviewService.upsert({
    userId: req.user.id,
    gameId: +req.params.gameId,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  res.status(201).json(review);
}));

// DELETE /api/reviews/:id
router.delete('/:id', authMiddleware, handle(async (req, res) => {
  const ok = await ReviewService.delete(+req.params.id, {
    userId: req.user.id,
    isAdmin: req.user.role === 'admin',
  });
  if (!ok) return res.status(404).json({ error: 'Avaliação não encontrada.' });
  res.json({ message: 'Avaliação removida.' });
}));

export default router;
