import mongoose from 'mongoose';
import { TripEnquiry, UNFILLED } from './tripEnquiry.model.js';
import { getClientIp, parseUserAgent, lookupIpLocation } from '../../utils/requestMeta.js';

const orUnfilled = (value) => (value && value.trim() ? value.trim() : UNFILLED);

// Existing docs created before the isRead field lack it entirely, and
// { isRead: false } would miss them — treat "not true" as unread. trusted()
// marks this server-built operator as safe under the global sanitizeFilter.
const UNREAD_FILTER = () => ({ isRead: mongoose.trusted({ $ne: true }) });

export async function createTripEnquiry(formData, req) {
  const ip = getClientIp(req);
  const { userAgent, browser, device, os } = parseUserAgent(req.headers['user-agent']);
  const location = await lookupIpLocation(ip);

  const enquiry = await TripEnquiry.create({
    name: orUnfilled(formData.name),
    email: orUnfilled(formData.email),
    phone: orUnfilled(formData.phone),
    where: orUnfilled(formData.where),
    when: orUnfilled(formData.when),
    message: orUnfilled(formData.message),
    path: orUnfilled(formData.path),
    referrer: orUnfilled(formData.referrer),
    language: orUnfilled(formData.language),
    timezone: orUnfilled(formData.timezone),
    screen: orUnfilled(formData.screen),
    ipAddress: ip,
    userAgent,
    browser,
    device,
    os,
    location,
  });

  return enquiry;
}

export async function listTripEnquiries(page, limit) {
  const skip = (page - 1) * limit;

  const [enquiries, total, unreadCount] = await Promise.all([
    TripEnquiry.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    TripEnquiry.countDocuments({}),
    TripEnquiry.countDocuments(UNREAD_FILTER()),
  ]);

  return {
    enquiries,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getUnreadCount() {
  return TripEnquiry.countDocuments(UNREAD_FILTER());
}

/**
 * Marks the given enquiries as read. Ids are the ones the admin actually
 * saw on the page, so opening page 2 doesn't clear page 5's unread state.
 */
export async function markEnquiriesRead(ids) {
  if (!ids.length) return { modified: 0 };

  const result = await TripEnquiry.updateMany(
    { _id: mongoose.trusted({ $in: ids }), ...UNREAD_FILTER() },
    { $set: { isRead: true } }
  );

  return { modified: result.modifiedCount };
}
