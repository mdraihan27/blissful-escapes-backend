import crypto from 'node:crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { LoginToken } from './loginToken.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { signAccessToken } from '../../utils/jwt.js';
import { sendLoginLinkEmail } from '../../utils/mailer.js';
import { env } from '../../config/env.js';

// Compared against when the user doesn't exist, so requests for unknown
// and known user ids take the same time (prevents user enumeration by timing)
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-password', 12);

const GENERIC_LOGIN_ERROR = 'Invalid user id or password';

const SENSITIVE_FIELDS = '+password +tokenVersion +failedLoginAttempts +lockUntil';

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function login(userId, password) {
  const user = await User.findOne({ userId: userId.toLowerCase().trim() }).select(
    SENSITIVE_FIELDS
  );

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  if (user.isLocked()) {
    throw ApiError.tooManyRequests(
      'Account temporarily locked due to too many failed attempts. Try again later.'
    );
  }

  if (!user.isActive) {
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    await user.registerFailedLogin();
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  await user.registerSuccessfulLogin();

  return { user, accessToken: signAccessToken(user) };
}

/**
 * "Forgot password" — issues a one-time login link and emails it to the
 * fixed recipient configured in the environment. Always succeeds from the
 * caller's perspective so account existence is never revealed.
 */
export async function requestLoginLink(userId) {
  const user = await User.findOne({
    userId: userId.toLowerCase().trim(),
    isActive: true,
  });

  if (!user) return;

  // A new link invalidates any previous unused links for this user
  await LoginToken.deleteMany({ user: user._id, usedAt: null });

  const rawToken = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.LOGIN_LINK_EXPIRES_MINUTES * 60 * 1000);

  await LoginToken.create({
    user: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  const loginUrl = new URL('/auth/magic-login', env.FRONTEND_URL);
  loginUrl.searchParams.set('token', rawToken);

  try {
    await sendLoginLinkEmail(loginUrl.toString(), env.LOGIN_LINK_EXPIRES_MINUTES);
  } catch (err) {
    console.error('Failed to send login link email:', err.message);
    throw ApiError.internal('Failed to send login link email');
  }
}

/**
 * Exchanges a magic-link token for a session. Single-use enforcement is
 * atomic (findOneAndUpdate) so a token can never be redeemed twice, even
 * by concurrent requests.
 */
export async function loginWithToken(rawToken) {
  const tokenDoc = await LoginToken.findOneAndUpdate(
    {
      tokenHash: hashToken(rawToken),
      usedAt: null,
      // trusted() marks this server-built operator as safe for sanitizeFilter
      expiresAt: mongoose.trusted({ $gt: new Date() }),
    },
    { $set: { usedAt: new Date() } },
    { new: true }
  );

  if (!tokenDoc) {
    throw ApiError.unauthorized('Login link is invalid, expired, or already used');
  }

  const user = await User.findById(tokenDoc.user).select(SENSITIVE_FIELDS);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Login link is invalid, expired, or already used');
  }

  // Revoke all previously issued sessions — the link was requested because
  // the password was forgotten (possibly compromised)
  user.tokenVersion += 1;
  await user.registerSuccessfulLogin();

  return { user, accessToken: signAccessToken(user) };
}
