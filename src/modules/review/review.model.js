/**
 * Model: Review
 * Avaliação (nota + comentário) de um jogo por um usuário.
 */
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'game_id',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'game_id'] },
  ],
});

export default Review;
