/**
 * Middlewares de autenticação.
 *
 * - authMiddleware  → exige token JWT válido; popula req.user
 * - adminMiddleware → exige authMiddleware + role === 'admin'
 */
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'gamevault_secret_change_me';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Token ausente.' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    next();
  });
}

/** Helper: emite JWT a partir de um user já validado. */
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export { authMiddleware, adminMiddleware, signToken };
