import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../library.service.js', () => ({
  default: {
    add: vi.fn(),
    listByUser: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getStats: vi.fn(),
  },
}));

import LibraryService from '../library.service.js';
import LibraryController from '../library.controller.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LibraryController.addToLibrary', () => {
  it('deve chamar o serviço com req.user.id e corpo, e retornar 201', async () => {
    const req = {
      user: { id: 1 },
      body: { gameId: 5, status: 'jogando', purchasePrice: 49.90 },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const mockResult = { id: 10, userId: 1, gameId: 5, status: 'jogando' };
    LibraryService.add.mockResolvedValue(mockResult);

    await LibraryController.addToLibrary(req, res);

    expect(LibraryService.add).toHaveBeenCalledWith(1, {
      gameId: 5,
      status: 'jogando',
      purchasePrice: 49.90,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
});

describe('LibraryController.listLibrary', () => {
  it('deve chamar o serviço com req.user.id e status filter, e retornar 200', async () => {
    const req = {
      user: { id: 1 },
      query: { status: 'zerado' },
    };
    const res = {
      json: vi.fn(),
    };

    const mockList = [{ id: 10, gameId: 5, status: 'zerado' }];
    LibraryService.listByUser.mockResolvedValue(mockList);

    await LibraryController.listLibrary(req, res);

    expect(LibraryService.listByUser).toHaveBeenCalledWith(1, { status: 'zerado' });
    expect(res.json).toHaveBeenCalledWith(mockList);
  });
});

describe('LibraryController.getLibraryStats', () => {
  it('deve retornar as estatísticas do serviço com status 200', async () => {
    const req = {
      user: { id: 1 },
    };
    const res = {
      json: vi.fn(),
    };

    const mockStats = { totalGames: 1, totalPlayTime: 5, totalSpent: 29.90 };
    LibraryService.getStats.mockResolvedValue(mockStats);

    await LibraryController.getLibraryStats(req, res);

    expect(LibraryService.getStats).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(mockStats);
  });
});
