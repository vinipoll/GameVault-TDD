/**
 * Testes unitários — CategoryService.
 */
vi.mock('../../../models/index.js', () => ({
  Category: {
    findAll:   vi.fn(),
    findByPk:  vi.fn(),
    findOne:   vi.fn(),
    create:    vi.fn(),
  },
}));

import { Category } from '../../../models/index.js';
import CategoryService from '../category.service.js';

beforeEach(() => vi.clearAllMocks());

describe('CategoryService.slugify', () => {
  it('converte acentos e caracteres especiais', () => {
    expect(CategoryService.slugify('Ação / Aventura')).toBe('acao-aventura');
    expect(CategoryService.slugify('FPS')).toBe('fps');
    expect(CategoryService.slugify('  Indie   2D  ')).toBe('indie-2d');
  });
});

describe('CategoryService.create', () => {
  it('falha sem nome', async () => {
    await expect(CategoryService.create({})).rejects.toMatchObject({ status: 400 });
  });

  it('gera slug automaticamente quando não fornecido', async () => {
    Category.findOne.mockResolvedValue(null);
    Category.create.mockResolvedValue({ id: 1, name: 'RPG', slug: 'rpg' });

    await CategoryService.create({ name: 'RPG' });

    expect(Category.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'RPG', slug: 'rpg' })
    );
  });

  it('falha (409) quando slug já existe', async () => {
    Category.findOne.mockResolvedValue({ id: 1 });
    await expect(CategoryService.create({ name: 'RPG' })).rejects.toMatchObject({ status: 409 });
  });
});

describe('CategoryService.update / delete', () => {
  it('update 404 quando id não existe', async () => {
    Category.findByPk.mockResolvedValue(null);
    await expect(CategoryService.update(99, { name: 'X' })).rejects.toMatchObject({ status: 404 });
  });

  it('update chama .update() na instância', async () => {
    const update = vi.fn();
    Category.findByPk.mockResolvedValue({ id: 1, update });
    await CategoryService.update(1, { name: 'X' });
    expect(update).toHaveBeenCalledWith({ name: 'X' });
  });

  it('delete retorna false quando id não existe', async () => {
    Category.findByPk.mockResolvedValue(null);
    expect(await CategoryService.delete(99)).toBe(false);
  });

  it('delete chama destroy na instância', async () => {
    const destroy = vi.fn();
    Category.findByPk.mockResolvedValue({ destroy });
    expect(await CategoryService.delete(1)).toBe(true);
    expect(destroy).toHaveBeenCalled();
  });
});
