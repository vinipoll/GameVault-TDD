import { Library, Game } from '../../models/index.js';

const LibraryService = {
  /**
   * Adiciona um jogo à biblioteca do usuário.
   */
  async add(userId, { gameId, purchasePrice, status, playTime, notes }) {
    if (!gameId) {
      const err = new Error('gameId é obrigatório.');
      err.status = 400;
      throw err;
    }

    const game = await Game.findByPk(gameId);
    if (!game) {
      const err = new Error('Jogo não encontrado.');
      err.status = 404;
      throw err;
    }

    const existing = await Library.findOne({ where: { userId, gameId } });
    if (existing) {
      const err = new Error('Jogo já está na sua biblioteca.');
      err.status = 409;
      throw err;
    }

    return Library.create({
      userId,
      gameId,
      purchasePrice: purchasePrice || 0,
      status: status || 'nao_iniciado',
      playTime: playTime || 0,
      notes,
    });
  },

  /**
   * Lista os jogos na biblioteca de um usuário.
   */
  async listByUser(userId, { status } = {}) {
    const where = { userId };
    if (status) {
      where.status = status;
    }

    return Library.findAll({
      where,
      include: [{ model: Game, as: 'game' }],
      order: [['createdAt', 'DESC']],
    });
  },

  /**
   * Atualiza uma entrada da biblioteca do usuário.
   */
  async update(userId, gameId, data) {
    const entry = await Library.findOne({ where: { userId, gameId } });
    if (!entry) {
      const err = new Error('Jogo não encontrado na sua biblioteca.');
      err.status = 404;
      throw err;
    }

    // Filtra apenas campos permitidos
    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.playTime !== undefined) updateData.playTime = data.playTime;
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return entry.update(updateData);
  },

  /**
   * Remove um jogo da biblioteca do usuário.
   */
  async remove(userId, gameId) {
    const entry = await Library.findOne({ where: { userId, gameId } });
    if (!entry) {
      const err = new Error('Jogo não encontrado na sua biblioteca.');
      err.status = 404;
      throw err;
    }

    await entry.destroy();
    return true;
  },

  /**
   * Obtém estatísticas de biblioteca para um usuário.
   */
  async getStats(userId) {
    const entries = await Library.findAll({ where: { userId } });

    const stats = {
      totalGames: entries.length,
      totalPlayTime: 0,
      totalSpent: 0,
      byStatus: {
        nao_iniciado: 0,
        jogando: 0,
        zerado: 0,
        abandonado: 0,
      },
    };

    entries.forEach((entry) => {
      stats.totalPlayTime += entry.playTime || 0;
      stats.totalSpent += Number(entry.purchasePrice) || 0;
      if (stats.byStatus[entry.status] !== undefined) {
        stats.byStatus[entry.status]++;
      }
    });

    // Formata o totalSpent com duas casas decimais
    stats.totalSpent = +stats.totalSpent.toFixed(2);

    return stats;
  },
};

export default LibraryService;
