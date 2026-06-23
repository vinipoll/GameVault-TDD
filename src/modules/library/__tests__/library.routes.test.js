import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock do LibraryService antes de importar o app
vi.mock('../library.service.js', () => ({
  default: {
    add: vi.fn(),
    listByUser: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getStats: vi.fn(),
  },
}));

import createApp from '../../../app.js';
import LibraryService from '../library.service.js';
import { signToken } from '../../../middleware/auth.js';

const app = createApp();
const validToken = `Bearer ${signToken({ id: 1, username: 'testuser', email: 'test@test.com', role: 'user' })}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/library', () => {
  it('1. deve retornar 401 se o token não for enviado', async () => {
    const res = await request(app)
      .post('/api/library')
      .send({ gameId: 5 });

    expect(res.status).toBe(401);
  });

  it('2. deve retornar 400 se o gameId não for fornecido', async () => {
    const res = await request(app)
      .post('/api/library')
      .set('Authorization', validToken)
      .send({ status: 'jogando' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('gameId é obrigatório.');
  });

  it('3. deve retornar 404 se o jogo não existir', async () => {
    const err = new Error('Jogo não encontrado.');
    err.status = 404;
    LibraryService.add.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', validToken)
      .send({ gameId: 99 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Jogo não encontrado.');
  });

  it('4. deve retornar 409 se o jogo já estiver na biblioteca', async () => {
    const err = new Error('Jogo já está na sua biblioteca.');
    err.status = 409;
    LibraryService.add.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', validToken)
      .send({ gameId: 5 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Jogo já está na sua biblioteca.');
  });

  it('5. deve retornar 201 e criar a entrada na biblioteca com sucesso', async () => {
    const mockEntry = { id: 1, userId: 1, gameId: 5, status: 'jogando' };
    LibraryService.add.mockResolvedValue(mockEntry);

    const res = await request(app)
      .post('/api/library')
      .set('Authorization', validToken)
      .send({ gameId: 5, status: 'jogando' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockEntry);
    expect(LibraryService.add).toHaveBeenCalledWith(1, { gameId: 5, status: 'jogando' });
  });
});

describe('GET /api/library', () => {
  it('6. deve retornar 401 se não estiver autenticado', async () => {
    const res = await request(app).get('/api/library');
    expect(res.status).toBe(401);
  });

  it('7. deve retornar a lista de jogos da biblioteca do usuário', async () => {
    const mockList = [{ id: 1, gameId: 5, status: 'jogando' }];
    LibraryService.listByUser.mockResolvedValue(mockList);

    const res = await request(app)
      .get('/api/library')
      .set('Authorization', validToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockList);
    expect(LibraryService.listByUser).toHaveBeenCalledWith(1, { status: undefined });
  });

  it('8. deve filtrar por status usando query params', async () => {
    LibraryService.listByUser.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/library?status=zerado')
      .set('Authorization', validToken);

    expect(res.status).toBe(200);
    expect(LibraryService.listByUser).toHaveBeenCalledWith(1, { status: 'zerado' });
  });
});

describe('GET /api/library/stats', () => {
  it('9. deve retornar as estatísticas da biblioteca', async () => {
    const mockStats = { totalGames: 2, totalPlayTime: 30, totalSpent: 100 };
    LibraryService.getStats.mockResolvedValue(mockStats);

    const res = await request(app)
      .get('/api/library/stats')
      .set('Authorization', validToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockStats);
    expect(LibraryService.getStats).toHaveBeenCalledWith(1);
  });
});

describe('PATCH /api/library/:gameId', () => {
  it('10. deve retornar 404 se a entrada não existir na biblioteca', async () => {
    const err = new Error('Jogo não encontrado na sua biblioteca.');
    err.status = 404;
    LibraryService.update.mockRejectedValue(err);

    const res = await request(app)
      .patch('/api/library/99')
      .set('Authorization', validToken)
      .send({ status: 'zerado' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Jogo não encontrado na sua biblioteca.');
  });

  it('11. deve retornar 200 e a entrada atualizada com sucesso', async () => {
    const mockUpdated = { id: 1, userId: 1, gameId: 5, status: 'zerado' };
    LibraryService.update.mockResolvedValue(mockUpdated);

    const res = await request(app)
      .patch('/api/library/5')
      .set('Authorization', validToken)
      .send({ status: 'zerado', playTime: 20 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUpdated);
    expect(LibraryService.update).toHaveBeenCalledWith(1, 5, { status: 'zerado', playTime: 20 });
  });
});

describe('DELETE /api/library/:gameId', () => {
  it('12. deve retornar 200 ao remover o jogo da biblioteca com sucesso', async () => {
    LibraryService.remove.mockResolvedValue(true);

    const res = await request(app)
      .delete('/api/library/5')
      .set('Authorization', validToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Jogo removido da biblioteca.' });
    expect(LibraryService.remove).toHaveBeenCalledWith(1, 5);
  });
});
