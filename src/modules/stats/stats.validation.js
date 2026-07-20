import { z } from 'zod';

const RANGE_TO_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

export const visitsTimeseriesSchema = {
  query: z.object({
    range: z.enum(['7d', '30d', '90d']).default('7d'),
  }),
};

export const locationsSchema = {
  query: z.object({
    country: z.string().trim().min(1).max(100).optional(),
  }),
};

export { RANGE_TO_DAYS };
