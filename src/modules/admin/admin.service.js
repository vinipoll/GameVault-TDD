/**
 * Service do painel administrativo.
 * Agrega informações de outros services para o dashboard.
 */
import { User, Game, Category, Review, Favorite } from '../../models/index.js';

const AdminService = {
  async dashboard() {
    const [totalUsers, totalGames, totalCategories, totalReviews, totalFavorites] = await Promise.all([
      User.count(),
      Game.count(),
      Category.count(),
      Review.count(),
      Favorite.count(),
    ]);

    // Top 5 jogos mais favoritados
    const topFavorites = await Favorite.findAll({
      attributes: ['gameId'],
      include: [{ model: Game, attributes: ['id', 'title', 'coverUrl'] }],
    });
    const counter = new Map();
    topFavorites.forEach(f => {
      const g = f.Game;
      if (!g) return;
      const key = g.id;
      if (!counter.has(key)) counter.set(key, { ...g.toJSON(), favorites: 0 });
      counter.get(key).favorites += 1;
    });
    const topGames = [...counter.values()]
      .sort((a, b) => b.favorites - a.favorites)
      .slice(0, 5);

    return {
      totalUsers, totalGames, totalCategories, totalReviews, totalFavorites,
      topGames,
    };
  },
};

export default AdminService;
