/**
 * Configuração da aplicação Express.
 *
 * Separado de server.js para permitir testes de integração com Supertest
 * sem necessidade de abrir uma porta.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes     from './modules/auth/auth.routes.js';
import gameRoutes     from './modules/game/game.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import favoriteRoutes from './modules/favorite/favorite.routes.js';
import reviewRoutes   from './modules/review/review.routes.js';
import adminRoutes    from './modules/admin/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
  app.use(express.json());

  // Frontend estático
  app.use(express.static(path.join(__dirname, '..', 'frontend')));

  // Rotas da API
  app.use('/api/auth',       authRoutes);
  app.use('/api/games',      gameRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/favorites',  favoriteRoutes);
  app.use('/api/reviews',    reviewRoutes);
  app.use('/api/admin',      adminRoutes);

  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  });

  return app;
}
