import { z } from 'zod';

export const createUserSchema = {
  body: z
    .object({
      // Same rules as the User model: lowercased, 3–50 chars
      userId: z
        .string()
        .trim()
        .toLowerCase()
        .min(3, 'User ID must be at least 3 characters')
        .max(50, 'User ID must be at most 50 characters')
        .regex(/^[a-z0-9._-]+$/, 'User ID can only contain letters, numbers, dots, dashes and underscores'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be at most 128 characters'),
    })
    .strict(),
};
