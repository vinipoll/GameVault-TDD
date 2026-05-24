/**
 * Centraliza os models e suas associações.
 *
 * Por que separar: definir associações dentro dos arquivos de model
 * geraria dependência circular (User precisaria do Favorite, que precisaria
 * do User...). Aqui importamos todos e ligamos no final.
 *
 * Uso:
 *   const { User, Game, Category, Favorite, Review } = require('./models');
 */
import sequelize from '../config/database.js';

import User from '../modules/user/user.model.js';
import Category from '../modules/category/category.model.js';
import Game from '../modules/game/game.model.js';
import Favorite from '../modules/favorite/favorite.model.js';
import Review from '../modules/review/review.model.js';

// ── Associações ─────────────────────────────────────────────────────────────

// Category 1 ─── N Game
Category.hasMany(Game,    { foreignKey: 'categoryId', as: 'games' });
Game.belongsTo(Category,  { foreignKey: 'categoryId', as: 'category' });

// User N ─── N Game (via Favorite)
User.belongsToMany(Game, {
  through: Favorite, as: 'favoriteGames',
  foreignKey: 'userId', otherKey: 'gameId',
});
Game.belongsToMany(User, {
  through: Favorite, as: 'fans',
  foreignKey: 'gameId', otherKey: 'userId',
});
Favorite.belongsTo(User, { foreignKey: 'userId' });
Favorite.belongsTo(Game, { foreignKey: 'gameId' });

// User 1 ─── N Review ─── 1 Game
User.hasMany(Review,   { foreignKey: 'userId', as: 'reviews' });
Game.hasMany(Review,   { foreignKey: 'gameId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

export { sequelize, User, Category, Game, Favorite, Review };
