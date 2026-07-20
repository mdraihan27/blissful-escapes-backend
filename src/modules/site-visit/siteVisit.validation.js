import { z } from 'zod';

const optionalText = (max) => z.string().trim().max(max).optional().default('');

export const createSiteVisitSchema = {
  body: z
    .object({
      path: optionalText(2048),
      referrer: optionalText(2048),
      language: optionalText(100),
      timezone: optionalText(100),
      screen: optionalText(50),
    })
    .strict(),
};
