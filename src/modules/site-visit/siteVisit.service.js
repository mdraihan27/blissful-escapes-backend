import { SiteVisit, UNFILLED } from './siteVisit.model.js';
import { getClientIp, parseUserAgent, lookupIpLocation } from '../../utils/requestMeta.js';

const orUnfilled = (value) => (value && value.trim() ? value.trim() : UNFILLED);

export async function recordSiteVisit(payload, req) {
  const ip = getClientIp(req);
  const { userAgent, browser, device, os } = parseUserAgent(req.headers['user-agent']);
  const location = await lookupIpLocation(ip);

  const visit = await SiteVisit.create({
    path: orUnfilled(payload.path),
    referrer: orUnfilled(payload.referrer),
    language: orUnfilled(payload.language),
    timezone: orUnfilled(payload.timezone),
    screen: orUnfilled(payload.screen),
    ipAddress: ip,
    userAgent,
    browser,
    device,
    os,
    location,
  });

  return visit;
}
