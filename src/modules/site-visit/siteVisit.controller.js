import * as siteVisitService from './siteVisit.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const create = catchAsync(async (req, res) => {
  const visit = await siteVisitService.recordSiteVisit(req.body, req);

  res.status(201).json({
    success: true,
    data: { id: visit._id },
  });
});
