import { Router } from 'express';
import * as userController from './user.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { createUserSchema } from './user.validation.js';

const router = Router();

// Every user-management endpoint requires an authenticated admin session
router.use(requireAuth);

router.get('/', userController.list);
router.post('/', validate(createUserSchema), userController.create);

export default router;
