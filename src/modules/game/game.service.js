/**
 * Service: Game
 * Inclui lógica de cálculo de nota média (a partir das reviews).
 */
import { Op } from 'sequelize';
import { Game, Category, Review, Favorite } from '../../models/index.js';

const GameService = {
  /** Lista jogos com filtro por categoria/busca e nota média anexada. */
  async list({ categoryId, search } = {}) {
    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const games = await Game.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['createdAt', 'DESC']],
    });

    // Anexa avgRating + reviewCount em cada jogo
    const enriched = await Promise.all(
      games.map(async (g) => {
        const stats = await GameService.getStats(g.id);
        return { ...g.toJSON(), ...stats };
      })
    );
    return enriched;
  },

  async findById(id) {
    const game = await Game.findByPk(id, {
      include: [{ model: Category, as: 'category' }],
    });
    if (!game) return null;
    const stats = await GameService.getStats(id);
    return { ...game.toJSON(), ...stats };
  },

  /** Calcula nota média e quantidade de reviews para um jogo. */
  async getStats(gameId) {
    const reviews = await Review.findAll({
      where: { gameId },
      attributes: ['rating'],
    });
    const count = reviews.length;
    if (count === 0) return { avgRating: 0, reviewCount: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avgRating: +(sum / count).toFixed(2),
      reviewCount: count,
    };
  },

  async create(data) {
    if (!data.title || !data.description || !data.categoryId) {
      const err = new Error('Campos obrigatórios: title, description, categoryId.');
      err.status = 400;
      throw err;
    }
    const category = await Category.findByPk(data.categoryId);
    if (!category) {
      const err = new Error('Categoria inexistente.');
      err.status = 400;
      throw err;
    }
    return Game.create(data);
  },

  async update(id, data) {
    const game = await Game.findByPk(id);
    if (!game) {
      const err = new Error('Jogo não encontrado.');
      err.status = 404;
      throw err;
    }
    await game.update(data);
    return game;
  },

  async delete(id) {
    const game = await Game.findByPk(id);
    if (!game) return false;
    await game.destroy();
    return true;
  },

  /**
   * Sistema de recomendação:
   * - Identifica as categorias mais frequentes nos favoritos do usuário.
   * - Devolve jogos dessas categorias que o usuário ainda NÃO favoritou.
   * - Ordena por nota média desc, com limite (default 10).
   */
  async recommendFor(userId, limit = 10) {
    const favs = await Favorite.findAll({
      where: { userId },
      include: [{ model: Game }],
    });

    if (favs.length === 0) {
      // Cold start: devolve top-rated geral
      const all = await GameService.list();
      return all
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, limit);
    }

    // Conta ocorrências de cada categoria nos favoritos
    const catCount = new Map();
    const ownedIds = new Set();
    favs.forEach((f) => {
      ownedIds.add(f.gameId);
      const c = f.Game?.categoryId;
      if (c) catCount.set(c, (catCount.get(c) || 0) + 1);
    });

    const topCategoryIds = [...catCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    const candidates = await Game.findAll({
      where: {
        categoryId: { [Op.in]: topCategoryIds },
        id: { [Op.notIn]: [...ownedIds] },
      },
      include: [{ model: Category, as: 'category' }],
    });

    const enriched = await Promise.all(
      candidates.map(async (g) => {
        const stats = await GameService.getStats(g.id);
        return { ...g.toJSON(), ...stats };
      })
    );

    return enriched
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);
  },
};

export default GameService;
