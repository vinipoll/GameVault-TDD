/**
 * Service: Review — avaliações de jogos.
 * Regra: cada usuário pode ter no máximo 1 review por jogo (upsert).
 */
import { Review, Game, User } from '../../models/index.js';

const ReviewService = {
  /** Cria ou atualiza review do usuário para um jogo. */
  async upsert({ userId, gameId, rating, comment }) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      const err = new Error('Rating deve ser inteiro entre 1 e 5.');
      err.status = 400;
      throw err;
    }
    const game = await Game.findByPk(gameId);
    if (!game) {
      const err = new Error('Jogo não encontrado.');
      err.status = 404;
      throw err;
    }

    const existing = await Review.findOne({ where: { userId, gameId } });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment ?? null;
      await existing.save();
      return existing;
    }
    return Review.create({ userId, gameId, rating, comment: comment ?? null });
  },

  /** Lista reviews de um jogo, mais recentes primeiro, com nome do autor. */
  async listByGame(gameId) {
    return Review.findAll({
      where: { gameId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']],
    });
  },

  /** Remove review (próprio dono ou admin chamando). */
  async delete(reviewId, { userId, isAdmin }) {
    const review = await Review.findByPk(reviewId);
    if (!review) return false;
    if (!isAdmin && review.userId !== userId) {
      const err = new Error('Sem permissão para remover esta avaliação.');
      err.status = 403;
      throw err;
    }
    await review.destroy();
    return true;
  },
};

export default ReviewService;
