/**
 * Model: Favorite
 * Junção entre usuário e jogo — indica que o usuário marcou o jogo como favorito.
 */
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Favorite = sequelize.define('Favorite', {
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
}, {
  tableName: 'favorites',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'game_id'] },
  ],
});

export default Favorite;
