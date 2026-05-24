/**
 * Testes de integração — /api/admin
 */
import request from 'supertest';

vi.mock('../../../models/index.js', () => ({
  sequelize: { authenticate: vi.fn(), sync: vi.fn() },
  User:     { count: vi.fn(), findAll: vi.fn(), findByPk: vi.fn() },
  Game:     { count: vi.fn() },
  Category: { count: vi.fn() },
  Review:   { count: vi.fn() },
  Favorite: { count: vi.fn(), findAll: vi.fn() },
}));

import createApp from '../../../app.js';
import { User, Game, Category, Review, Favorite } from '../../../models/index.js';
import { signToken } from '../../../middleware/auth.js';

const app = createApp();
const userToken  = signToken({ id: 1, username: 'u', email: 'u@x.com', role: 'user' });
const adminToken = signToken({ id: 9, username: 'a', email: 'a@x.com', role: 'admin' });

beforeEach(() => vi.clearAllMocks());

describe('GET /api/admin/dashboard', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('403 para usuário comum', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('200 retorna agregados completos', async () => {
    User.count.mockResolvedValue(10);
    Game.count.mockResolvedValue(50);
    Category.count.mockResolvedValue(8);
    Review.count.mockResolvedValue(30);
    Favorite.count.mockResolvedValue(75);
    Favorite.findAll.mockResolvedValue([
      { gameId: 1, Game: { id: 1, title: 'A', coverUrl: '', toJSON() { return { id: 1, title: 'A', coverUrl: '' }; } } },
      { gameId: 1, Game: { id: 1, title: 'A', coverUrl: '', toJSON() { return { id: 1, title: 'A', coverUrl: '' }; } } },
      { gameId: 2, Game: { id: 2, title: 'B', coverUrl: '', toJSON() { return { id: 2, title: 'B', coverUrl: '' }; } } },
    ]);

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalUsers: 10, totalGames: 50, totalCategories: 8,
      totalReviews: 30, totalFavorites: 75,
    });
    expect(res.body.topGames[0].title).toBe('A'); // 2 favoritos > 1
    expect(res.body.topGames[0].favorites).toBe(2);
  });
});

describe('PUT /api/admin/users/:id/status', () => {
  it('400 com status inválido', async () => {
    const res = await request(app)
      .put('/api/admin/users/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inventado' });
    expect(res.status).toBe(400);
  });

  it('404 quando usuário não existe', async () => {
    User.findByPk.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/admin/users/999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'banido' });

    expect(res.status).toBe(404);
  });

  it('403 ao tentar banir admin', async () => {
    User.findByPk.mockResolvedValue({ role: 'admin' });

    const res = await request(app)
      .put('/api/admin/users/2/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'banido' });

    expect(res.status).toBe(403);
  });

  it('200 banimento bem-sucedido', async () => {
    const save = vi.fn();
    User.findByPk.mockResolvedValue({
      id: 3, role: 'user', status: 'ativo', save,
      toJSON() { return { id: 3, role: 'user', status: 'banido' }; },
    });

    const res = await request(app)
      .put('/api/admin/users/3/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'banido' });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
    expect(res.body.status).toBe('banido');
  });
});

describe('GET /api/admin/users', () => {
  it('lista todos para admin', async () => {
    User.findAll.mockResolvedValue([
      { id: 1, toJSON() { return { id: 1, username: 'a', passwordHash: 'oculto' }; } },
      { id: 2, toJSON() { return { id: 2, username: 'b', passwordHash: 'oculto' }; } },
    ]);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).not.toHaveProperty('passwordHash');
  });
});
