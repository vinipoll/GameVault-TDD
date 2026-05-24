/**
 * Testes unitários — FavoriteService.
 * Foco: comportamento idempotente do toggle.
 */
vi.mock('../../../models/index.js', () => ({
  Favorite: { findOne: vi.fn(), create: vi.fn(), findAll: vi.fn(), count: vi.fn() },
  Game:     { findByPk: vi.fn() },
  Category: {},
}));

import { Favorite, Game } from '../../../models/index.js';
import FavoriteService from '../favorite.service.js';

beforeEach(() => vi.clearAllMocks());

describe('FavoriteService.toggle', () => {
  it('404 quando o jogo não existe', async () => {
    Game.findByPk.mockResolvedValue(null);
    await expect(FavoriteService.toggle(1, 99)).rejects.toMatchObject({ status: 404 });
  });

  it('favorita quando ainda não estava favoritado', async () => {
    Game.findByPk.mockResolvedValue({ id: 5 });
    Favorite.findOne.mockResolvedValue(null);
    Favorite.create.mockResolvedValue({ id: 1 });

    const result = await FavoriteService.toggle(1, 5);

    expect(result).toEqual({ favorited: true });
    expect(Favorite.create).toHaveBeenCalledWith({ userId: 1, gameId: 5 });
  });

  it('desfavorita (remove) quando já estava favoritado', async () => {
    const destroy = vi.fn();
    Game.findByPk.mockResolvedValue({ id: 5 });
    Favorite.findOne.mockResolvedValue({ destroy });

    const result = await FavoriteService.toggle(1, 5);

    expect(result).toEqual({ favorited: false });
    expect(destroy).toHaveBeenCalled();
    expect(Favorite.create).not.toHaveBeenCalled();
  });
});

describe('FavoriteService.isFavorited', () => {
  it('true quando existe', async () => {
    Favorite.findOne.mockResolvedValue({ id: 1 });
    expect(await FavoriteService.isFavorited(1, 5)).toBe(true);
  });
  it('false quando não existe', async () => {
    Favorite.findOne.mockResolvedValue(null);
    expect(await FavoriteService.isFavorited(1, 5)).toBe(false);
  });
});
