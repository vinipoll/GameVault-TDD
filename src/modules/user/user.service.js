/**
 * Service: User
 * Regras de negócio relacionadas a usuários. Não conhece HTTP — só recebe
 * dados e fala com o model. Isso torna trivial testar com vi.mock().
 */
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User } from '../../models/index.js';

const UserService = {
  /** Cria usuário hashando a senha. Lança erro se email/username duplicado. */
  async register({ username, email, password }) {
    if (!username || !email || !password) {
      const err = new Error('Campos obrigatórios: username, email, password.');
      err.status = 400;
      throw err;
    }
    if (password.length < 6) {
      const err = new Error('Senha deve ter ao menos 6 caracteres.');
      err.status = 400;
      throw err;
    }

    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (existing) {
      const err = new Error('Email ou username já cadastrado.');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    return UserService.sanitize(user);
  },

  /** Confere credenciais. Retorna o user (sem hash) ou lança erro com status. */
  async authenticate(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const err = new Error('Credenciais inválidas.');
      err.status = 401;
      throw err;
    }
    if (user.status === 'banido') {
      const err = new Error('Conta banida.');
      err.status = 403;
      throw err;
    }
    if (user.status === 'suspenso') {
      const err = new Error('Conta suspensa temporariamente.');
      err.status = 403;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const err = new Error('Credenciais inválidas.');
      err.status = 401;
      throw err;
    }
    return UserService.sanitize(user);
  },

  async findById(id) {
    const user = await User.findByPk(id);
    return user ? UserService.sanitize(user) : null;
  },

  async list({ search } = {}) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email:    { [Op.like]: `%${search}%` } },
      ];
    }
    const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
    return users.map(UserService.sanitize);
  },

  async updateStatus(id, status) {
    if (!['ativo', 'suspenso', 'banido'].includes(status)) {
      const err = new Error('Status inválido.');
      err.status = 400;
      throw err;
    }
    const user = await User.findByPk(id);
    if (!user) {
      const err = new Error('Usuário não encontrado.');
      err.status = 404;
      throw err;
    }
    if (user.role === 'admin') {
      const err = new Error('Não é possível alterar status de administrador.');
      err.status = 403;
      throw err;
    }
    user.status = status;
    await user.save();
    return UserService.sanitize(user);
  },

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    if (user.role === 'admin') {
      const err = new Error('Não é possível remover administrador.');
      err.status = 403;
      throw err;
    }
    await user.destroy();
    return true;
  },

  /** Remove o passwordHash do retorno. Sempre usar antes de devolver para HTTP. */
  sanitize(user) {
    const obj = user.toJSON ? user.toJSON() : user;
    const { passwordHash, ...safe } = obj;
    return safe;
  },
};

export default UserService;
