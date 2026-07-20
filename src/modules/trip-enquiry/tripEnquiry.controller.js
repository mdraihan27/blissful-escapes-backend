import * as tripEnquiryService from './tripEnquiry.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const create = catchAsync(async (req, res) => {
  const enquiry = await tripEnquiryService.createTripEnquiry(req.body, req);

  res.status(201).json({
    success: true,
    message: 'Thanks — your travel details have been received.',
    data: { id: enquiry._id },
  });
});

export const list = catchAsync(async (req, res) => {
  const { page, limit } = req.validatedQuery;
  const data = await tripEnquiryService.listTripEnquiries(page, limit);
  res.status(200).json({ success: true, data });
});

export const unreadCount = catchAsync(async (req, res) => {
  const count = await tripEnquiryService.getUnreadCount();
  res.status(200).json({ success: true, data: { unreadCount: count } });
});

export const markRead = catchAsync(async (req, res) => {
  const result = await tripEnquiryService.markEnquiriesRead(req.body.ids);
  res.status(200).json({ success: true, data: result });
});
