/**
 * Router de categorias.
 */
import express from 'express';
import CategoryService from './category.service.js';
import { adminMiddleware } from '../../middleware/auth.js';

const router = express.Router();

const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Erro interno.' });
  }
};

router.get('/', handle(async (_req, res) => {
  res.json(await CategoryService.list());
}));

router.get('/:id', handle(async (req, res) => {
  const c = await CategoryService.findById(+req.params.id);
  if (!c) return res.status(404).json({ error: 'Categoria não encontrada.' });
  res.json(c);
}));

router.post('/', adminMiddleware, handle(async (req, res) => {
  const c = await CategoryService.create(req.body);
  res.status(201).json(c);
}));

router.put('/:id', adminMiddleware, handle(async (req, res) => {
  const c = await CategoryService.update(+req.params.id, req.body);
  res.json(c);
}));

router.delete('/:id', adminMiddleware, handle(async (req, res) => {
  const ok = await CategoryService.delete(+req.params.id);
  if (!ok) return res.status(404).json({ error: 'Categoria não encontrada.' });
  res.json({ message: 'Categoria removida.' });
}));

export default router;
