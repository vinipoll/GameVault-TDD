/**
 * Service: Category
 */
import { Category } from '../../models/index.js';

const CategoryService = {
  async list() {
    return Category.findAll({ order: [['name', 'ASC']] });
  },

  async findById(id) {
    return Category.findByPk(id);
  },

  async create({ name, slug, icon }) {
    if (!name) {
      const err = new Error('Nome é obrigatório.');
      err.status = 400;
      throw err;
    }
    const finalSlug = slug || CategoryService.slugify(name);
    const existing = await Category.findOne({ where: { slug: finalSlug } });
    if (existing) {
      const err = new Error('Slug já existente.');
      err.status = 409;
      throw err;
    }
    return Category.create({ name, slug: finalSlug, icon });
  },

  async update(id, data) {
    const category = await Category.findByPk(id);
    if (!category) {
      const err = new Error('Categoria não encontrada.');
      err.status = 404;
      throw err;
    }
    await category.update(data);
    return category;
  },

  async delete(id) {
    const category = await Category.findByPk(id);
    if (!category) return false;
    await category.destroy();
    return true;
  },

  /** Converte "Action / Adventure" → "action-adventure" */
  slugify(text) {
    return String(text)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

export default CategoryService;
