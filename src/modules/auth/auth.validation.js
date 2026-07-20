import { z } from 'zod';

export const loginSchema = {
  body: z
    .object({
      userId: z.string().trim().min(3).max(50),
      password: z.string().min(1).max(128),
    })
    .strict(),
};

export const forgotPasswordSchema = {
  body: z
    .object({
      userId: z.string().trim().min(3).max(50),
    })
    .strict(),
};

export const magicLoginSchema = {
  body: z
    .object({
      token: z.string().trim().min(32).max(256),
    })
    .strict(),
};
