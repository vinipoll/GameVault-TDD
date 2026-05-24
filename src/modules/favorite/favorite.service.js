/**
 * Service: Favorite — favoritar/desfavoritar jogos (toggle).
 */
import { Favorite, Game, Category } from '../../models/index.js';

const FavoriteService = {
  /** Alterna favorito; retorna { favorited: bool }. */
  async toggle(userId, gameId) {
    const game = await Game.findByPk(gameId);
    if (!game) {
      const err = new Error('Jogo não encontrado.');
      err.status = 404;
      throw err;
    }

    const existing = await Favorite.findOne({ where: { userId, gameId } });
    if (existing) {
      await existing.destroy();
      return { favorited: false };
    }
    await Favorite.create({ userId, gameId });
    return { favorited: true };
  },

  /** Lista os jogos favoritados pelo usuário. */
  async listByUser(userId) {
    const favs = await Favorite.findAll({
      where: { userId },
      include: [{
        model: Game,
        include: [{ model: Category, as: 'category' }],
      }],
      order: [['createdAt', 'DESC']],
    });
    return favs.map((f) => f.Game.toJSON());
  },

  /** Conta favoritos de um jogo. */
  async countByGame(gameId) {
    return Favorite.count({ where: { gameId } });
  },

  /** Verifica se um usuário favoritou um jogo. */
  async isFavorited(userId, gameId) {
    const f = await Favorite.findOne({ where: { userId, gameId } });
    return Boolean(f);
  },
};

export default FavoriteService;
