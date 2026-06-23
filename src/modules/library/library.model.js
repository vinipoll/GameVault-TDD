/**
 * Model: Library
 * Associa um usuário a um jogo que ele possui, acompanhando o progresso e estatísticas de jogo.
 */
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Library = sequelize.define('Library', {
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
  purchasePrice: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0.0,
    field: 'purchase_price',
    validate: {
      min: 0,
    },
  },
  status: {
    type: DataTypes.ENUM('nao_iniciado', 'jogando', 'zerado', 'abandonado'),
    allowNull: false,
    defaultValue: 'nao_iniciado',
    validate: {
      isIn: [['nao_iniciado', 'jogando', 'zerado', 'abandonado']],
    },
  },
  playTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'play_time',
    validate: {
      min: 0,
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'libraries',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'game_id'] },
  ],
});

export default Library;
