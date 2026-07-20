import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../modules/auth/user.model.js';

export const COOKIE_NAME = 'access_token';

/**
 * Protects a route. Accepts the JWT from the httpOnly cookie (preferred)
 * or an Authorization: Bearer header.
 */
export const requireAuth = catchAsync(async (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      token = header.slice(7);
    }
  }

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
