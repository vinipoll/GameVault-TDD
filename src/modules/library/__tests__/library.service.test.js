import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../models/index.js', () => ({
  Library: {
    findOne: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    count: vi.fn(),
  },
  Game: {
    findByPk: vi.fn(),
  },
  Category: {},
}));

import { Library, Game } from '../../../models/index.js';
import LibraryService from '../library.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LibraryService.add', () => {
  it('deve lançar erro 404 se o jogo não existir', async () => {
    Game.findByPk.mockResolvedValue(null);

    await expect(
      LibraryService.add(1, { gameId: 99 })
    ).rejects.toMatchObject({ status: 404, message: 'Jogo não encontrado.' });
  });

  it('deve lançar erro 409 se o jogo já estiver na biblioteca', async () => {
    Game.findByPk.mockResolvedValue({ id: 5 });
    Library.findOne.mockResolvedValue({ id: 1, userId: 1, gameId: 5 });

    await expect(
      LibraryService.add(1, { gameId: 5 })
    ).rejects.toMatchObject({ status: 409, message: 'Jogo já está na sua biblioteca.' });
  });

  it('deve adicionar o jogo com sucesso', async () => {
    Game.findByPk.mockResolvedValue({ id: 5 });
    Library.findOne.mockResolvedValue(null);
    Library.create.mockResolvedValue({ id: 12, userId: 1, gameId: 5, status: 'nao_iniciado' });

    const result = await LibraryService.add(1, { gameId: 5, status: 'nao_iniciado' });

    expect(Library.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      gameId: 5,
      status: 'nao_iniciado',
    }));
    expect(result).toHaveProperty('id', 12);
  });
});

describe('LibraryService.getStats', () => {
  it('deve calcular estatísticas vazias se o usuário não tiver jogos', async () => {
    Library.findAll.mockResolvedValue([]);

    const stats = await LibraryService.getStats(1);

    expect(stats).toEqual({
      totalGames: 0,
      totalPlayTime: 0,
      totalSpent: 0,
      byStatus: {
        nao_iniciado: 0,
        jogando: 0,
        zerado: 0,
        abandonado: 0,
      },
    });
  });

  it('deve calcular estatísticas corretas agregadas', async () => {
    const mockEntries = [
      { status: 'jogando', playTime: 10, purchasePrice: '50.00' },
      { status: 'zerado', playTime: 25, purchasePrice: '120.50' },
      { status: 'zerado', playTime: 40, purchasePrice: '0.00' },
    ];
    Library.findAll.mockResolvedValue(mockEntries);

    const stats = await LibraryService.getStats(1);

    expect(stats).toEqual({
      totalGames: 3,
      totalPlayTime: 75,
      totalSpent: 170.50,
      byStatus: {
        nao_iniciado: 0,
        jogando: 1,
        zerado: 2,
        abandonado: 0,
      },
    });
  });
});

describe('LibraryService.update', () => {
  it('deve lançar erro 404 se a entrada não existir', async () => {
    Library.findOne.mockResolvedValue(null);

    await expect(
      LibraryService.update(1, 99, { status: 'jogando' })
    ).rejects.toMatchObject({ status: 404, message: 'Jogo não encontrado na sua biblioteca.' });
  });

  it('deve atualizar com sucesso', async () => {
    const updateSpy = vi.fn().mockImplementation(function(data) {
      Object.assign(this, data);
      return this;
    });
    const mockEntry = {
      userId: 1,
      gameId: 5,
      status: 'nao_iniciado',
      update: updateSpy,
    };
    Library.findOne.mockResolvedValue(mockEntry);

    const result = await LibraryService.update(1, 5, { status: 'jogando', playTime: 10 });

    expect(updateSpy).toHaveBeenCalledWith({ status: 'jogando', playTime: 10 });
    expect(result.status).toBe('jogando');
  });
});
