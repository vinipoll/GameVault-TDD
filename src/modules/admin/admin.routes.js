/**
 * Rotas do painel administrativo.
 */
import express from 'express';
import AdminService from './admin.service.js';
import UserService from '../user/user.service.js';
import { adminMiddleware } from '../../middleware/auth.js';

const router = express.Router();

const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Erro interno.' });
  }
};

router.get('/dashboard', adminMiddleware, handle(async (_req, res) => {
  res.json(await AdminService.dashboard());
}));

router.get('/users', adminMiddleware, handle(async (req, res) => {
  res.json(await UserService.list({ search: req.query.search }));
}));

router.put('/users/:id/status', adminMiddleware, handle(async (req, res) => {
  const updated = await UserService.updateStatus(+req.params.id, req.body.status);
  res.json(updated);
}));

router.delete('/users/:id', adminMiddleware, handle(async (req, res) => {
  const ok = await UserService.delete(+req.params.id);
  if (!ok) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ message: 'Usuário removido.' });
}));

export default router;
