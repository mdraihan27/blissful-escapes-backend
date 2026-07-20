import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const JWT_ISSUER = 'blissful-escapes-api';
const JWT_AUDIENCE = 'blissful-escapes-client';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tv: user.tokenVersion },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256',
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ['HS256'],
  });
}
