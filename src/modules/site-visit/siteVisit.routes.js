import { Router } from 'express';
import * as siteVisitController from './siteVisit.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { siteVisitLimiter } from '../../middlewares/rateLimit.middleware.js';
import { createSiteVisitSchema } from './siteVisit.validation.js';

const router = Router();

router.post(
  '/',
  siteVisitLimiter,
  validate(createSiteVisitSchema),
  siteVisitController.create
);

export default router;
