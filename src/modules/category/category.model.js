/**
 * Model: Category
 * Representa um gênero/categoria de jogo (RPG, FPS, Indie, etc.).
 */
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
  },
  slug: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
  },
  icon: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
});

export default Category;
