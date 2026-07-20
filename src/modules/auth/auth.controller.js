import * as authService from './auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { COOKIE_NAME } from '../../middlewares/auth.middleware.js';
import { isProduction } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
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
  const { userId, password } = req.body;
  const { user, accessToken } = await authService.login(userId, password);
  sendSession(res, user, accessToken, 'Logged in successfully');
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
