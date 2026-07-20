import { z } from 'zod';

// Every field is optional and defaults to "" — the service layer turns
// blanks into "unfilled". Nothing here is required so a partially filled
// form can still be captured, per the product requirement.
const optionalText = (max) => z.string().trim().max(max).optional().default('');

export const createTripEnquirySchema = {
  body: z
    .object({
      name: optionalText(100),
      email: optionalText(100),
      phone: optionalText(30),
      where: optionalText(100),
      when: optionalText(100),
      message: optionalText(2000),
      path: optionalText(2048),
      referrer: optionalText(2048),
      language: optionalText(100),
      timezone: optionalText(100),
      screen: optionalText(50),
    })
    .strict(),
};

export const listTripEnquiriesSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};

// 24-char hex mongo ObjectIds
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const markReadSchema = {
  body: z
    .object({
      ids: z.array(objectId).min(1).max(100),
    })
    .strict(),
};
