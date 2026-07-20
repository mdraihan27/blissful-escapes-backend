import * as authService from './auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { COOKIE_NAME } from '../../middlewares/auth.middleware.js';
import { isProduction } from '../../config/env.js';

// The frontend (Netlify) and backend (Heroku) are on different sites, so the
// session cookie is cross-site. Browsers only send a cross-site cookie when it
// is SameSite=None, and they require Secure=true alongside SameSite=None. In
// local dev (http, same host) we fall back to Lax so the cookie still works
// without https.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction, // required by browsers when sameSite is 'none'
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

function sendSession(res, user, accessToken, message) {
  res
    .cookie(COOKIE_NAME, accessToken, COOKIE_OPTIONS)
    .status(200)
    .json({
      success: true,
      message,
      data: { user, accessToken },
    });
}

export const login = catchAsync(async (req, res) => {
  // --- Heroku debug logging (grep for "[login]" in `heroku logs --tail`) ---
  console.log('[login] request received', {
    origin: req.headers.origin ?? '(no origin header)',
    referer: req.headers.referer ?? '(none)',
    method: req.method,
    userId: req.body?.userId ?? '(missing)',
    hasPassword: Boolean(req.body?.password),
    isProduction,
    cookieOptions: COOKIE_OPTIONS,
    'x-forwarded-proto': req.headers['x-forwarded-proto'] ?? '(none)',
  });

  const { userId, password } = req.body;

  try {
    const { user, accessToken } = await authService.login(userId, password);
    console.log('[login] SUCCESS — issuing session cookie', {
      userId: user.userId,
      cookieName: COOKIE_NAME,
      sameSite: COOKIE_OPTIONS.sameSite,
      secure: COOKIE_OPTIONS.secure,
    });
    sendSession(res, user, accessToken, 'Logged in successfully');
  } catch (err) {
    console.warn('[login] FAILED', {
      userId: req.body?.userId ?? '(missing)',
      statusCode: err.statusCode ?? 500,
      message: err.message,
    });
    throw err;
  }
});

export const forgotPassword = catchAsync(async (req, res) => {
  await authService.requestLoginLink(req.body.userId);
  // Always the same response — never reveals whether the account exists
  res.status(200).json({
    success: true,
    message: 'If the account exists, a login link has been sent to the registered email.',
  });
});

export const magicLogin = catchAsync(async (req, res) => {
  const { user, accessToken } = await authService.loginWithToken(req.body.token);
  sendSession(res, user, accessToken, 'Logged in successfully via login link');
});

export const logout = catchAsync(async (req, res) => {
  res
    .clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined })
    .status(200)
    .json({ success: true, message: 'Logged out successfully' });
});

export const me = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});
