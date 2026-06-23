import LibraryService from './library.service.js';

const LibraryController = {
  /**
   * Adiciona um jogo à biblioteca.
   */
  async addToLibrary(req, res) {
    const userId = req.user.id;
    const { gameId, purchasePrice, status, playTime, notes } = req.body;

    if (!gameId) {
      const err = new Error('gameId é obrigatório.');
      err.status = 400;
      throw err;
    }

    const result = await LibraryService.add(userId, {
      gameId: +gameId,
      purchasePrice,
      status,
      playTime,
      notes,
    });

    res.status(201).json(result);
  },

  /**
   * Lista a biblioteca de jogos do usuário.
   */
  async listLibrary(req, res) {
    const userId = req.user.id;
    const { status } = req.query;

    const result = await LibraryService.listByUser(userId, { status });
    res.json(result);
  },

  /**
   * Atualiza detalhes de um jogo na biblioteca do usuário.
   */
  async updateLibraryEntry(req, res) {
    const userId = req.user.id;
    const gameId = +req.params.gameId;

    const result = await LibraryService.update(userId, gameId, req.body);
    res.json(result);
  },

  /**
   * Remove um jogo da biblioteca do usuário.
   */
  async removeFromLibrary(req, res) {
    const userId = req.user.id;
    const gameId = +req.params.gameId;

    await LibraryService.remove(userId, gameId);
    res.json({ message: 'Jogo removido da biblioteca.' });
  },

  /**
   * Obtém estatísticas consolidada da biblioteca.
   */
  async getLibraryStats(req, res) {
    const userId = req.user.id;
    const result = await LibraryService.getStats(userId);
    res.json(result);
  },
};

export default LibraryController;
