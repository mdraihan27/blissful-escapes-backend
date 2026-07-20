import { Router } from 'express';
import * as statsController from './stats.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { visitsTimeseriesSchema, locationsSchema } from './stats.validation.js';

const router = Router();

// Every stats endpoint requires an authenticated admin session
router.use(requireAuth);

router.get('/visits-timeseries', validate(visitsTimeseriesSchema), statsController.visitsTimeseries);
router.get('/visit-counts', statsController.visitCounts);
router.get('/enquiry-conversion', statsController.enquiryConversion);
router.get('/locations', validate(locationsSchema), statsController.locations);

export default router;
