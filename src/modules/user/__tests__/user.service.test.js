/**
 * Testes unitários — UserService.
 *
 * Demonstra o uso de:
 *   - vi.mock()  → substitui o módulo de models por mocks
 *   - vi.fn()    → cria funções espionadas
 *   - vi.spyOn() → monitora chamadas de bcrypt
 *
 * Estes testes NÃO tocam o banco de dados — são puros e rodam em milissegundos.
 */
import bcrypt from 'bcryptjs';

// IMPORTANTE: vi.mock() é hoisted — precisa vir antes do require do service.
vi.mock('../../../models/index.js', () => ({
  User: {
    findOne:  vi.fn(),
    findByPk: vi.fn(),
    findAll:  vi.fn(),
    create:   vi.fn(),
  },
}));

import { User } from '../../../models/index.js';
import UserService from '../user.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserService.register', () => {
  it('falha (400) sem campos obrigatórios', async () => {
    await expect(UserService.register({})).rejects.toMatchObject({ status: 400 });
  });

  it('falha (400) com senha < 6 caracteres', async () => {
    await expect(
      UserService.register({ username: 'x', email: 'x@x.com', password: '123' })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('falha (409) quando email ou username já existem', async () => {
    User.findOne.mockResolvedValue({ id: 1, email: 'x@x.com' });

    await expect(
      UserService.register({ username: 'x', email: 'x@x.com', password: '123456' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('cria com sucesso, hashando a senha e devolvendo user sem hash', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 7, username: 'novo', email: 'n@x.com', role: 'user', status: 'ativo',
      toJSON() { return { id: 7, username: 'novo', email: 'n@x.com', role: 'user', status: 'ativo', passwordHash: 'h' }; },
    });
    const spy = vi.spyOn(bcrypt, 'hash');

    const user = await UserService.register({ username: 'novo', email: 'n@x.com', password: 'senha123' });

    expect(spy).toHaveBeenCalledWith('senha123', 10);
    expect(User.create).toHaveBeenCalled();
    expect(user).not.toHaveProperty('passwordHash');
    expect(user.email).toBe('n@x.com');
  });
});

describe('UserService.authenticate', () => {
  it('falha (401) quando email não existe', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(UserService.authenticate('x@x.com', 'y')).rejects.toMatchObject({ status: 401 });
  });

  it('falha (403) com conta banida', async () => {
    User.findOne.mockResolvedValue({ status: 'banido' });
    await expect(UserService.authenticate('x@x.com', 'y')).rejects.toMatchObject({ status: 403 });
  });

  it('falha (403) com conta suspensa', async () => {
    User.findOne.mockResolvedValue({ status: 'suspenso' });
    await expect(UserService.authenticate('x@x.com', 'y')).rejects.toMatchObject({ status: 403 });
  });

  it('falha (401) com senha errada', async () => {
    const hash = await bcrypt.hash('certa', 10);
    User.findOne.mockResolvedValue({
      status: 'ativo', passwordHash: hash,
      toJSON() { return { id: 1, passwordHash: hash }; },
    });

    await expect(UserService.authenticate('x@x.com', 'errada')).rejects.toMatchObject({ status: 401 });
  });

  it('sucesso: retorna user sem passwordHash', async () => {
    const hash = await bcrypt.hash('boa', 10);
    User.findOne.mockResolvedValue({
      id: 1, email: 'x@x.com', username: 'x', role: 'user', status: 'ativo', passwordHash: hash,
      toJSON() { return { id: 1, email: 'x@x.com', username: 'x', role: 'user', status: 'ativo', passwordHash: hash }; },
    });

    const u = await UserService.authenticate('x@x.com', 'boa');
    expect(u).not.toHaveProperty('passwordHash');
    expect(u.id).toBe(1);
  });
});

describe('UserService.updateStatus', () => {
  it('falha (400) com status inválido', async () => {
    await expect(UserService.updateStatus(1, 'inventado')).rejects.toMatchObject({ status: 400 });
  });

  it('falha (404) quando usuário não existe', async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(UserService.updateStatus(1, 'banido')).rejects.toMatchObject({ status: 404 });
  });

  it('falha (403) ao tentar alterar status de admin', async () => {
    User.findByPk.mockResolvedValue({ role: 'admin' });
    await expect(UserService.updateStatus(1, 'banido')).rejects.toMatchObject({ status: 403 });
  });

  it('atualiza com sucesso e devolve user sanitizado', async () => {
    const saved = vi.fn();
    User.findByPk.mockResolvedValue({
      id: 1, role: 'user', status: 'ativo', save: saved,
      toJSON() { return { id: 1, role: 'user', status: 'banido', passwordHash: 'x' }; },
    });

    const result = await UserService.updateStatus(1, 'banido');
    expect(saved).toHaveBeenCalled();
    expect(result.status).toBe('banido');
    expect(result).not.toHaveProperty('passwordHash');
  });
});

describe('UserService.sanitize', () => {
  it('remove passwordHash de objeto plano', () => {
    const safe = UserService.sanitize({ id: 1, passwordHash: 'x', email: 'y' });
    expect(safe).toEqual({ id: 1, email: 'y' });
  });
});
