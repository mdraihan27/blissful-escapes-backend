import * as statsService from './stats.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const visitsTimeseries = catchAsync(async (req, res) => {
  const { range } = req.validatedQuery;
  const data = await statsService.getVisitsTimeseries(range);
  res.status(200).json({ success: true, data });
});

export const visitCounts = catchAsync(async (req, res) => {
  const data = await statsService.getVisitCounts();
  res.status(200).json({ success: true, data });
});

export const enquiryConversion = catchAsync(async (req, res) => {
  const data = await statsService.getEnquiryConversion();
  res.status(200).json({ success: true, data });
});

export const locations = catchAsync(async (req, res) => {
  const { country } = req.validatedQuery;
  const data = await statsService.getLocationBreakdown(country);
  res.status(200).json({ success: true, data });
});
