import mongoose from 'mongoose';
import { SiteVisit } from '../site-visit/siteVisit.model.js';
import { TripEnquiry } from '../trip-enquiry/tripEnquiry.model.js';
import { RANGE_TO_DAYS } from './stats.validation.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

/**
 * Visits bucketed over the requested range, for the time series chart.
 * 7 day range buckets by hour (168 points); 30/90 day ranges bucket by day,
 * so the point count stays chart friendly regardless of range.
 */
export async function getVisitsTimeseries(range) {
  const days = RANGE_TO_DAYS[range];
  const now = new Date();
  const start = new Date(now.getTime() - days * DAY_MS);
  const bucketByHour = range === '7d';

  const dateFormat = bucketByHour ? '%Y-%m-%dT%H:00:00.000Z' : '%Y-%m-%dT00:00:00.000Z';

  const rows = await SiteVisit.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const counts = new Map(rows.map((row) => [row._id, row.count]));

  // Fill every bucket in the range, including zeros, so the chart has a
  // continuous, evenly spaced series rather than gaps where nothing happened.
  // The last bucket must reach the current (partial) hour/day, not stop
  // `days` buckets after `start` — `start` itself is rarely exactly on a
  // boundary, so a fixed count would fall a bucket short of "now".
  const points = [];
  const stepMs = bucketByHour ? HOUR_MS : DAY_MS;
  const firstBucketMs = bucketByHour
    ? Math.ceil(start.getTime() / HOUR_MS) * HOUR_MS
    : Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const lastBucketMs = bucketByHour
    ? Math.floor(now.getTime() / HOUR_MS) * HOUR_MS
    : Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const bucketCount = Math.round((lastBucketMs - firstBucketMs) / stepMs) + 1;

  for (let i = 0; i < bucketCount; i += 1) {
    const bucketDate = new Date(firstBucketMs + i * stepMs);
    const key = bucketDate.toISOString().slice(0, bucketByHour ? 13 : 10) + (bucketByHour ? ':00:00.000Z' : 'T00:00:00.000Z');
    points.push({ timestamp: bucketDate.toISOString(), count: counts.get(key) ?? 0 });
  }

  return { range, granularity: bucketByHour ? 'hour' : 'day', points };
}

/**
 * Total visit ("click") counts overall and over fixed trailing windows.
 */
export async function getVisitCounts() {
  const now = Date.now();

  const [total, lastHour, lastDay, lastWeek, lastMonth] = await Promise.all([
    SiteVisit.countDocuments({}),
    SiteVisit.countDocuments({ createdAt: { $gte: new Date(now - HOUR_MS) } }),
    SiteVisit.countDocuments({ createdAt: { $gte: new Date(now - DAY_MS) } }),
    SiteVisit.countDocuments({ createdAt: { $gte: new Date(now - WEEK_MS) } }),
    SiteVisit.countDocuments({ createdAt: { $gte: new Date(now - MONTH_MS) } }),
  ]);

  return { total, lastHour, lastDay, lastWeek, lastMonth };
}

const UNKNOWN_LOCATION = 'Unknown';

// Site visits store "unfilled" when geolocation couldn't resolve a field —
// group all of those into one readable "Unknown" bucket instead of leaking
// the storage sentinel into the chart.
const normalizeLocationField = (field) => ({
  $cond: [
    { $or: [{ $eq: [field, 'unfilled'] }, { $eq: [field, null] }, { $eq: [field, ''] }] },
    UNKNOWN_LOCATION,
    field,
  ],
});

/**
 * Visit counts grouped by country, or — when a country is given — by city
 * within that country. Powers the location pie chart's drill down.
 */
export async function getLocationBreakdown(country) {
  const groupField = country ? '$location.city' : '$location.country';
  // Match against the *normalized* country name (mongoose.trusted marks
  // this server-built $expr as safe under sanitizeFilter) — otherwise
  // selecting "Unknown" would look for the literal string "Unknown" and
  // never match the underlying "unfilled"/null/empty sentinel values.
  const match = country
    ? mongoose.trusted({ $expr: { $eq: [normalizeLocationField('$location.country'), country] } })
    : {};

  const rows = await SiteVisit.aggregate([
    { $match: match },
    {
      $group: {
        _id: normalizeLocationField(groupField),
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const breakdown = rows.map((row) => ({ label: row._id, count: row.count }));

  // Every distinct country in the data set, for the filter control —
  // independent of which country (if any) is currently selected.
  const countryRows = await SiteVisit.aggregate([
    { $group: { _id: normalizeLocationField('$location.country') } },
    { $sort: { _id: 1 } },
  ]);
  const availableCountries = countryRows.map((row) => row._id);

  return {
    scope: country ? 'city' : 'country',
    country: country ?? null,
    breakdown,
    availableCountries,
  };
}

/**
 * How many enquiry messages were sent versus how many site visits occurred,
 * as a conversion rate.
 */
export async function getEnquiryConversion() {
  const [totalVisits, totalEnquiries] = await Promise.all([
    SiteVisit.countDocuments({}),
    TripEnquiry.countDocuments({}),
  ]);

  const conversionRate = totalVisits > 0 ? (totalEnquiries / totalVisits) * 100 : 0;

  return {
    totalVisits,
    totalEnquiries,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}
