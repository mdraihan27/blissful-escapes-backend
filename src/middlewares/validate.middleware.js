import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.body / req.query / req.params against a zod schema shaped like:
 *   { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 * Replaces req.body with the parsed (stripped + typed) result.
 */
export const validate = (schema) => (req, res, next) => {
  for (const key of ['body', 'query', 'params']) {
    if (!schema[key]) continue;

    const result = schema[key].safeParse(req[key] ?? {});
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
        .join('; ');
      return next(ApiError.badRequest(`Validation failed — ${detail}`));
    }

    if (key === 'body') {
      req.body = result.data;
    } else {
      // req.query and req.params are getter-only in Express 5
      Object.defineProperty(req, `validated${key[0].toUpperCase()}${key.slice(1)}`, {
        value: result.data,
        writable: false,
      });
    }
  }
  next();
};
