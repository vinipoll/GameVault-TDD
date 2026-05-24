/**
 * Router de favoritos.
 */
import express from 'express';
import FavoriteService from './favorite.service.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Erro interno.' });
  }
};

// GET /api/favorites
router.get('/', authMiddleware, handle(async (req, res) => {
  res.json(await FavoriteService.listByUser(req.user.id));
}));

// POST /api/favorites/:gameId  → toggle
router.post('/:gameId', authMiddleware, handle(async (req, res) => {
  const result = await FavoriteService.toggle(req.user.id, +req.params.gameId);
  res.json(result);
}));

export default router;
