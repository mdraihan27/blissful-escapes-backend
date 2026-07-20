import { UAParser } from 'ua-parser-js';

const UNFILLED = 'unfilled';
const GEO_LOOKUP_TIMEOUT_MS = 3000;

// Loopback/private addresses can't be geolocated by a public API
function isPrivateIp(ip) {
  return (
    !ip ||
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

/**
 * Best-effort client IP: honors the first hop behind a trusted proxy
 * (app.set('trust proxy', 1) makes req.ip reflect X-Forwarded-For),
 * falling back to the raw socket address.
 */
export function getClientIp(req) {
  const ip = req.ip || req.socket?.remoteAddress || '';
  // Normalize IPv4-mapped IPv6 addresses like ::ffff:203.0.113.5
  return ip.replace(/^::ffff:/, '') || UNFILLED;
}

export function parseUserAgent(uaString) {
  if (!uaString) {
    return { userAgent: UNFILLED, browser: UNFILLED, device: UNFILLED, os: UNFILLED };
  }

  const { browser, device, os } = new UAParser(uaString).getResult();

  const browserLabel = browser.name
    ? [browser.name, browser.version].filter(Boolean).join(' ')
    : UNFILLED;

  const deviceLabel = device.type
    ? [device.vendor, device.model, `(${device.type})`].filter(Boolean).join(' ')
    : 'desktop';

  const osLabel = os.name ? [os.name, os.version].filter(Boolean).join(' ') : UNFILLED;

  return {
    userAgent: uaString,
    browser: browserLabel,
    device: deviceLabel,
    os: osLabel,
  };
}

const emptyLocation = () => ({
  city: UNFILLED,
  region: UNFILLED,
  country: UNFILLED,
  lat: null,
  lon: null,
});

async function fetchJsonWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEO_LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// In local/dev environments req.ip is a loopback/private address that no
// geolocation API can resolve. Fall back to asking ip-api.com to geolocate
// the caller (this server's own public egress IP) instead of giving up.
async function lookupSelfLocation() {
  // ip-api.com's free tier only supports HTTP, not HTTPS (that requires a paid plan)
  const data = await fetchJsonWithTimeout(
    'http://ip-api.com/json/?fields=status,query,city,regionName,country,lat,lon'
  );
  if (data?.status !== 'success') return emptyLocation();

  return {
    city: data.city || UNFILLED,
    region: data.regionName || UNFILLED,
    country: data.country || UNFILLED,
    lat: typeof data.lat === 'number' ? data.lat : null,
    lon: typeof data.lon === 'number' ? data.lon : null,
  };
}

/**
 * Resolves a rough location from a public IP via ip-api.com's free tier.
 * Fails soft — any error just yields "unfilled" fields rather than
 * blocking the enquiry submission. For private/loopback IPs (always the
 * case in local development, since browser and server share a machine)
 * it geolocates the server's own public egress IP instead, so location
 * data is still populated while testing.
 */
export async function lookupIpLocation(ip) {
  if (isPrivateIp(ip)) return lookupSelfLocation();

  const data = await fetchJsonWithTimeout(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country,lat,lon`
  );
  if (data?.status !== 'success') return emptyLocation();

  return {
    city: data.city || UNFILLED,
    region: data.regionName || UNFILLED,
    country: data.country || UNFILLED,
    lat: typeof data.lat === 'number' ? data.lat : null,
    lon: typeof data.lon === 'number' ? data.lon : null,
  };
}
