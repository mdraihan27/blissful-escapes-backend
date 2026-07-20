import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import {
  loginLimiter,
  forgotPasswordLimiter,
} from '../../middlewares/rateLimit.middleware.js';
import {
  loginSchema,
  forgotPasswordSchema,
  magicLoginSchema,
} from './auth.validation.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/magic-login',
  loginLimiter,
  validate(magicLoginSchema),
  authController.magicLogin
);

router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
