/**
 * Controller + Router de autenticação.
 *
 * O controller apenas adapta entre HTTP e o UserService, traduzindo erros
 * com `status` em respostas HTTP apropriadas.
 */
import express from 'express';
import UserService from '../user/user.service.js';
import { signToken, authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

// helper para reduzir boilerplate
const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Erro interno.' });
  }
};

router.post('/register', handle(async (req, res) => {
  const user = await UserService.register(req.body);
  const token = signToken(user);
  res.status(201).json({ token, user });
}));

router.post('/login', handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }
  const user = await UserService.authenticate(email, password);
  const token = signToken(user);
  res.json({ token, user });
}));

router.get('/me', authMiddleware, handle(async (req, res) => {
  const user = await UserService.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json(user);
}));

export default router;
