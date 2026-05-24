/**
 * Testes de integração — /api/auth
 *
 * Estratégia: mockamos o módulo de models (vi.mock) e exercitamos a
 * aplicação Express completa via Supertest. Isso valida:
 *   - middlewares (cors, json parser)
 *   - roteamento
 *   - controllers + chamadas ao service
 *   - tradução de erros do service em status HTTP
 * sem dependência de banco real.
 */
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Mock dos models (vi.mock é hoisted automaticamente pelo Vitest)
vi.mock('../../../models/index.js', () => ({
  sequelize: { authenticate: vi.fn(), sync: vi.fn(), close: vi.fn() },
  User: {
    findOne:  vi.fn(),
    findByPk: vi.fn(),
    findAll:  vi.fn(),
    create:   vi.fn(),
  },
  Game: {}, Category: {}, Favorite: {}, Review: {},
}));

import createApp from '../../../app.js';
import { User } from '../../../models/index.js';

const app = createApp();

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/register', () => {
  it('201: registra com sucesso e retorna token + user (sem hash)', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 7, username: 'novo', email: 'novo@x.com',
      role: 'user', status: 'ativo',
      toJSON() {
        return {
          id: 7, username: 'novo', email: 'novo@x.com',
          role: 'user', status: 'ativo', passwordHash: 'oculto',
        };
      },
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'novo', email: 'novo@x.com', password: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('novo@x.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('400 sem campos obrigatórios', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('400 com senha < 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a', email: 'a@x.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('409 com email já cadastrado', async () => {
    User.findOne.mockResolvedValue({ id: 1, email: 'a@x.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'b', email: 'a@x.com', password: 'senha123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('400 sem credenciais', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('401 com email inexistente', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: 'qualquer' });

    expect(res.status).toBe(401);
  });

  it('403 com conta banida', async () => {
    const hash = await bcrypt.hash('senha123', 10);
    User.findOne.mockResolvedValue({
      id: 1, email: 'x@x.com', passwordHash: hash, status: 'banido',
      toJSON() { return { id: 1, passwordHash: hash, status: 'banido' }; },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: 'senha123' });

    expect(res.status).toBe(403);
  });

  it('401 com senha errada', async () => {
    const hash = await bcrypt.hash('certa', 10);
    User.findOne.mockResolvedValue({
      id: 1, email: 'x@x.com', passwordHash: hash, status: 'ativo',
      toJSON() { return { id: 1, passwordHash: hash, status: 'ativo' }; },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: 'errada' });

    expect(res.status).toBe(401);
  });

  it('200: login válido retorna token', async () => {
    const hash = await bcrypt.hash('boa', 10);
    User.findOne.mockResolvedValue({
      id: 1, username: 'x', email: 'x@x.com', role: 'user', status: 'ativo', passwordHash: hash,
      toJSON() {
        return { id: 1, username: 'x', email: 'x@x.com', role: 'user', status: 'ativo', passwordHash: hash };
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: 'boa' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });
});

describe('GET /api/auth/me', () => {
  it('401 sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  it('200 retorna ok + timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.time).toBeDefined();
  });
});
