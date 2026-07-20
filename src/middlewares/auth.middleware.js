import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../modules/auth/user.model.js';

/**
 * Protects a route. Reads the JWT from the "Authorization: Bearer <token>"
 * header (the client stores the token and sends it on every request).
 */
export const requireAuth = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  // tokenVersion lets us invalidate all issued JWTs (e.g. after a magic-link login)
  if (payload.tv !== user.tokenVersion) {
    throw ApiError.unauthorized('Session has been revoked');
  }

  req.user = user;
  next();
});
