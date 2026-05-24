/**
 * Testes de integração — fluxo de jogos, favoritos e avaliações.
 * Models mockados; valida rotas + middlewares + services.
 */
import request from 'supertest';

vi.mock('../../../models/index.js', () => ({
  sequelize: { authenticate: vi.fn(), sync: vi.fn() },
  Game:     { findAll: vi.fn(), findByPk: vi.fn(), create: vi.fn() },
  Category: { findByPk: vi.fn(), findAll: vi.fn(), findOne: vi.fn(), create: vi.fn() },
  Review:   { findAll: vi.fn(), findByPk: vi.fn(), findOne: vi.fn(), create: vi.fn() },
  Favorite: { findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(), count: vi.fn() },
  User:     { findAll: vi.fn(), findByPk: vi.fn(), count: vi.fn() },
}));

import createApp from '../../../app.js';
import { Game, Category, Review, Favorite } from '../../../models/index.js';
import { signToken } from '../../../middleware/auth.js';

const app = createApp();
const userToken  = signToken({ id: 1, username: 'u', email: 'u@x.com', role: 'user' });
const adminToken = signToken({ id: 9, username: 'a', email: 'a@x.com', role: 'admin' });

beforeEach(() => vi.clearAllMocks());

// ── GAMES ────────────────────────────────────────────────────────────────
describe('GET /api/games', () => {
  it('200: lista pública com avgRating calculado', async () => {
    Game.findAll.mockResolvedValue([
      { id: 1, toJSON() { return { id: 1, title: 'Elden Ring' }; } },
    ]);
    Review.findAll.mockResolvedValue([{ rating: 5 }, { rating: 4 }]);

    const res = await request(app).get('/api/games');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Elden Ring');
    expect(res.body[0].avgRating).toBe(4.5);
    expect(res.body[0].reviewCount).toBe(2);
  });

  it('GET /api/games/:id 404 quando não existe', async () => {
    Game.findByPk.mockResolvedValue(null);
    const res = await request(app).get('/api/games/9999');
    expect(res.status).toBe(404);
  });

  it('GET /api/games/:id 200 com stats', async () => {
    Game.findByPk.mockResolvedValue({
      id: 1, toJSON() { return { id: 1, title: 'X' }; },
    });
    Review.findAll.mockResolvedValue([{ rating: 5 }]);

    const res = await request(app).get('/api/games/1');
    expect(res.status).toBe(200);
    expect(res.body.avgRating).toBe(5);
  });
});

describe('POST /api/games (admin)', () => {
  it('401 sem token', async () => {
    const res = await request(app).post('/api/games').send({});
    expect(res.status).toBe(401);
  });

  it('403 para usuário comum', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'X', description: 'D', categoryId: 1 });
    expect(res.status).toBe(403);
  });

  it('400 sem campos obrigatórios mesmo admin', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'só título' });
    expect(res.status).toBe(400);
  });

  it('400 com categoria inexistente', async () => {
    Category.findByPk.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'X', description: 'D', categoryId: 999 });
    expect(res.status).toBe(400);
  });

  it('201 cria jogo válido', async () => {
    Category.findByPk.mockResolvedValue({ id: 1, name: 'RPG' });
    Game.create.mockResolvedValue({ id: 42, title: 'Novo' });

    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Novo', description: 'D', categoryId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(42);
  });
});

// ── FAVORITOS ────────────────────────────────────────────────────────────
describe('POST /api/favorites/:gameId (toggle)', () => {
  it('401 sem token', async () => {
    const res = await request(app).post('/api/favorites/1');
    expect(res.status).toBe(401);
  });

  it('404 quando jogo não existe', async () => {
    Game.findByPk.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/favorites/999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it('favorita quando ainda não estava', async () => {
    Game.findByPk.mockResolvedValue({ id: 5 });
    Favorite.findOne.mockResolvedValue(null);
    Favorite.create.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .post('/api/favorites/5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.favorited).toBe(true);
  });

  it('desfavorita quando já estava', async () => {
    const destroy = vi.fn();
    Game.findByPk.mockResolvedValue({ id: 5 });
    Favorite.findOne.mockResolvedValue({ destroy });

    const res = await request(app)
      .post('/api/favorites/5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.body.favorited).toBe(false);
    expect(destroy).toHaveBeenCalled();
  });
});

// ── REVIEWS ──────────────────────────────────────────────────────────────
describe('POST /api/reviews/game/:gameId', () => {
  it('400 com rating fora do intervalo', async () => {
    const res = await request(app)
      .post('/api/reviews/game/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 10 });
    expect(res.status).toBe(400);
  });

  it('404 com jogo inexistente', async () => {
    Game.findByPk.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/reviews/game/999')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5 });
    expect(res.status).toBe(404);
  });

  it('201 cria nova review', async () => {
    Game.findByPk.mockResolvedValue({ id: 1 });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({ id: 10, rating: 5, comment: 'Top' });

    const res = await request(app)
      .post('/api/reviews/game/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, comment: 'Top' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
  });

  it('upsert: atualiza review existente em vez de duplicar', async () => {
    const save = vi.fn();
    const existing = { rating: 3, comment: 'velho', save };
    Game.findByPk.mockResolvedValue({ id: 1 });
    Review.findOne.mockResolvedValue(existing);

    await request(app)
      .post('/api/reviews/game/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, comment: 'novo' });

    expect(save).toHaveBeenCalled();
    expect(existing.rating).toBe(5);
    expect(Review.create).not.toHaveBeenCalled();
  });
});

// ── CATEGORIES ───────────────────────────────────────────────────────────
describe('POST /api/categories (admin)', () => {
  it('201 com slug autogerado a partir do nome', async () => {
    Category.findOne.mockResolvedValue(null);
    Category.create.mockResolvedValue({ id: 1, name: 'Ação Aventura', slug: 'acao-aventura' });

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ação Aventura' });

    expect(res.status).toBe(201);
    expect(Category.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'acao-aventura' })
    );
  });
});
