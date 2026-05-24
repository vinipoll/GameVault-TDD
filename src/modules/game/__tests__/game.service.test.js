/**
 * Testes unitários — GameService.
 * Cobre as regras críticas: cálculo de nota média e recomendação por perfil.
 */
vi.mock('../../../models/index.js', () => ({
  Game:     { findAll: vi.fn(), findByPk: vi.fn(), create: vi.fn() },
  Category: { findByPk: vi.fn() },
  Review:   { findAll: vi.fn() },
  Favorite: { findAll: vi.fn() },
}));

import { Game, Category, Review, Favorite } from '../../../models/index.js';
import GameService from '../game.service.js';

beforeEach(() => vi.clearAllMocks());

describe('GameService.getStats', () => {
  it('retorna avgRating=0 quando não há reviews', async () => {
    Review.findAll.mockResolvedValue([]);
    const stats = await GameService.getStats(1);
    expect(stats).toEqual({ avgRating: 0, reviewCount: 0 });
  });

  it('calcula média correta com 2 casas decimais', async () => {
    Review.findAll.mockResolvedValue([
      { rating: 5 }, { rating: 4 }, { rating: 5 }, // soma 14 / 3 = 4.67
    ]);
    const stats = await GameService.getStats(1);
    expect(stats).toEqual({ avgRating: 4.67, reviewCount: 3 });
  });
});

describe('GameService.create', () => {
  it('falha sem campos obrigatórios', async () => {
    await expect(GameService.create({ title: 'X' })).rejects.toMatchObject({ status: 400 });
  });

  it('falha quando a categoria não existe', async () => {
    Category.findByPk.mockResolvedValue(null);
    await expect(
      GameService.create({ title: 'X', description: 'D', categoryId: 99 })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('cria com sucesso quando categoria existe', async () => {
    Category.findByPk.mockResolvedValue({ id: 1 });
    Game.create.mockResolvedValue({ id: 42, title: 'X' });

    const g = await GameService.create({ title: 'X', description: 'D', categoryId: 1 });
    expect(g.id).toBe(42);
  });
});

describe('GameService.recommendFor — sistema de recomendação', () => {
  it('cold start: usuário sem favoritos recebe top-rated geral', async () => {
    Favorite.findAll.mockResolvedValue([]); // sem favoritos
    // GameService.list internamente chama Game.findAll + Review.findAll (stats)
    Game.findAll.mockResolvedValue([
      { id: 1, toJSON() { return { id: 1, title: 'A' }; } },
      { id: 2, toJSON() { return { id: 2, title: 'B' }; } },
    ]);
    // duas chamadas a getStats → duas chamadas a Review.findAll
    Review.findAll
      .mockResolvedValueOnce([{ rating: 3 }])             // jogo 1 → 3.0
      .mockResolvedValueOnce([{ rating: 5 }, { rating: 5 }]); // jogo 2 → 5.0

    const recs = await GameService.recommendFor(123, 10);
    expect(recs[0].title).toBe('B'); // top primeiro
    expect(recs[0].avgRating).toBe(5);
  });

  it('usuário com favoritos recebe jogos da categoria mais frequente', async () => {
    // Usuário 1 tem 2 favoritos: ambos da categoria 10
    Favorite.findAll.mockResolvedValue([
      { gameId: 1, Game: { categoryId: 10 } },
      { gameId: 2, Game: { categoryId: 10 } },
    ]);

    // Candidatos: outros jogos da categoria 10, exceto 1 e 2
    Game.findAll.mockResolvedValue([
      { id: 5, toJSON() { return { id: 5, title: 'NovoRPG', categoryId: 10 }; } },
    ]);
    Review.findAll.mockResolvedValueOnce([{ rating: 5 }]);

    const recs = await GameService.recommendFor(1, 10);

    expect(Game.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        categoryId: expect.any(Object), // Op.in
        id:         expect.any(Object), // Op.notIn
      }),
    }));
    expect(recs).toHaveLength(1);
    expect(recs[0].id).toBe(5);
  });

  it('respeita o limite', async () => {
    Favorite.findAll.mockResolvedValue([]);
    Game.findAll.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        toJSON() { return { id: i + 1, title: `G${i}` }; },
      }))
    );
    for (let i = 0; i < 20; i++) Review.findAll.mockResolvedValueOnce([{ rating: 5 }]);

    const recs = await GameService.recommendFor(1, 5);
    expect(recs).toHaveLength(5);
  });
});
