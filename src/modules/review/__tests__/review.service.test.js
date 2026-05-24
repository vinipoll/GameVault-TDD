/**
 * Testes unitários — ReviewService.
 */
vi.mock('../../../models/index.js', () => ({
  Review: { findOne: vi.fn(), findByPk: vi.fn(), findAll: vi.fn(), create: vi.fn() },
  Game:   { findByPk: vi.fn() },
  User:   {},
}));

import { Review, Game } from '../../../models/index.js';
import ReviewService from '../review.service.js';

beforeEach(() => vi.clearAllMocks());

describe('ReviewService.upsert — validações', () => {
  it.each([
    [0, 'menor que 1'],
    [6, 'maior que 5'],
    [3.5, 'não inteiro'],
    ['5', 'string'],
    [null, 'nulo'],
  ])('falha (400) quando rating é %s (%s)', async (rating) => {
    await expect(
      ReviewService.upsert({ userId: 1, gameId: 1, rating })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('falha (404) quando jogo não existe', async () => {
    Game.findByPk.mockResolvedValue(null);
    await expect(
      ReviewService.upsert({ userId: 1, gameId: 99, rating: 5 })
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('ReviewService.upsert — comportamento', () => {
  it('cria nova review quando ainda não existia', async () => {
    Game.findByPk.mockResolvedValue({ id: 1 });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({ id: 10, rating: 5, comment: 'Top' });

    const r = await ReviewService.upsert({ userId: 1, gameId: 1, rating: 5, comment: 'Top' });

    expect(Review.create).toHaveBeenCalled();
    expect(r.id).toBe(10);
  });

  it('atualiza review existente em vez de criar nova', async () => {
    const save = vi.fn();
    const existing = { rating: 3, comment: 'velho', save };
    Game.findByPk.mockResolvedValue({ id: 1 });
    Review.findOne.mockResolvedValue(existing);

    await ReviewService.upsert({ userId: 1, gameId: 1, rating: 5, comment: 'novo' });

    expect(existing.rating).toBe(5);
    expect(existing.comment).toBe('novo');
    expect(save).toHaveBeenCalled();
    expect(Review.create).not.toHaveBeenCalled();
  });

  it('aceita comment nulo', async () => {
    Game.findByPk.mockResolvedValue({ id: 1 });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({ id: 1 });

    await ReviewService.upsert({ userId: 1, gameId: 1, rating: 4 });

    expect(Review.create).toHaveBeenCalledWith(expect.objectContaining({ comment: null }));
  });
});

describe('ReviewService.delete — autorização', () => {
  it('false quando review não existe', async () => {
    Review.findByPk.mockResolvedValue(null);
    expect(await ReviewService.delete(1, { userId: 1, isAdmin: false })).toBe(false);
  });

  it('403 quando usuário comum tenta apagar review de outro', async () => {
    Review.findByPk.mockResolvedValue({ userId: 2, destroy: vi.fn() });
    await expect(
      ReviewService.delete(1, { userId: 1, isAdmin: false })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('permite o próprio dono apagar', async () => {
    const destroy = vi.fn();
    Review.findByPk.mockResolvedValue({ userId: 1, destroy });
    expect(await ReviewService.delete(1, { userId: 1, isAdmin: false })).toBe(true);
    expect(destroy).toHaveBeenCalled();
  });

  it('permite admin apagar review de qualquer um', async () => {
    const destroy = vi.fn();
    Review.findByPk.mockResolvedValue({ userId: 999, destroy });
    expect(await ReviewService.delete(1, { userId: 1, isAdmin: true })).toBe(true);
    expect(destroy).toHaveBeenCalled();
  });
});
