/**
 * Router de biblioteca de jogos (Library).
 */
import express from 'express';
import LibraryController from './library.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Erro interno.' });
  }
};

// Exige autenticação para todas as rotas da biblioteca
router.use(authMiddleware);

// GET /api/library/stats — estatísticas da biblioteca
router.get('/stats', handle(LibraryController.getLibraryStats));

// GET /api/library — lista biblioteca do usuário
router.get('/', handle(LibraryController.listLibrary));

// POST /api/library — adiciona jogo à biblioteca
router.post('/', handle(LibraryController.addToLibrary));

// PATCH /api/library/:gameId — atualiza progresso/tempo/preço
router.patch('/:gameId', handle(LibraryController.updateLibraryEntry));

// DELETE /api/library/:gameId — remove jogo da biblioteca
router.delete('/:gameId', handle(LibraryController.removeFromLibrary));

export default router;
