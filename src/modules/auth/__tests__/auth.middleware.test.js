/**
 * Testes — middleware de autenticação.
 * Demonstra vi.fn() para simular `next` e res.json/status.
 */
import jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware, signToken } from '../../../middleware/auth.js';

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  it('401 sem header Authorization', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401 com token inválido', () => {
    const req = { headers: { authorization: 'Bearer abc.def' } };
    const res = makeRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next() e popula req.user com token válido', () => {
    const token = signToken({ id: 7, username: 'x', email: 'x@x.com', role: 'user' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(7);
    expect(req.user.role).toBe('user');
  });
});

describe('adminMiddleware', () => {
  it('403 para usuário comum', () => {
    const token = signToken({ id: 7, role: 'user' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = vi.fn();

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next() para admin', () => {
    const token = signToken({ id: 1, role: 'admin' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = vi.fn();

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('signToken', () => {
  it('gera um JWT válido decodificável', () => {
    const token = signToken({ id: 1, username: 'x', email: 'x@x.com', role: 'admin' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ id: 1, role: 'admin' });
  });
});
