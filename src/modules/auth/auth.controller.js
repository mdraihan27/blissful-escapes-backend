import * as authService from './auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

// Bearer-token auth: the access token is returned in the JSON body and the
// client sends it back as an "Authorization: Bearer <token>" header. No cookie
// is set, so cross-site cookie restrictions (frontend and backend on different
// domains) don't apply.
function sendSession(res, user, accessToken, message) {
  res.status(200).json({
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
  // With Bearer tokens the client just discards its token. The JWT is
  // stateless, so there is nothing server-side to clear here.
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const me = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});
