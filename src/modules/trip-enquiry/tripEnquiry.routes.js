import { Router } from 'express';
import * as tripEnquiryController from './tripEnquiry.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { tripEnquiryLimiter } from '../../middlewares/rateLimit.middleware.js';
import {
  createTripEnquirySchema,
  listTripEnquiriesSchema,
  markReadSchema,
} from './tripEnquiry.validation.js';

const router = Router();

router.post(
  '/',
  tripEnquiryLimiter,
  validate(createTripEnquirySchema),
  tripEnquiryController.create
);

router.get('/', requireAuth, validate(listTripEnquiriesSchema), tripEnquiryController.list);
router.get('/unread-count', requireAuth, tripEnquiryController.unreadCount);
router.post('/mark-read', requireAuth, validate(markReadSchema), tripEnquiryController.markRead);

export default router;
