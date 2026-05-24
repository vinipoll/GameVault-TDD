/**
 * Model: Game
 * Representa um jogo digital cadastrado no catálogo.
 */
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  developer: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  publisher: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  releaseYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'release_year',
    validate: { min: 1970, max: 2100 },
  },
  coverUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'cover_url',
  },
  price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
  },
}, {
  tableName: 'games',
  timestamps: true,
  underscored: true,
});

export default Game;
