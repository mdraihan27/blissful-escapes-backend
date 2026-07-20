import { env, isProduction } from './env.js';
import { ApiError } from '../utils/ApiError.js';

// Strip trailing slashes so "https://site.com/" and "https://site.com"
// are treated as the same origin. A manual loop avoids the catastrophic
// backtracking risk of a /\/+$/ style regex on adversarial input.
function normalize(origin) {
  let end = origin.trim().length;
  const str = origin.trim();
  while (end > 0 && str[end - 1] === '/') end -= 1;
  return str.slice(0, end);
}

// FRONTEND_URL is the primary allowed origin. CORS_EXTRA_ORIGINS lets you
// allow additional origins (e.g. a staging frontend) as a comma-separated
// list without touching code.
const allowedOrigins = new Set(
  [env.FRONTEND_URL, ...(process.env.CORS_EXTRA_ORIGINS?.split(',') ?? [])]
    .filter(Boolean)
    .map(normalize)
);

export const corsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl, server-to-server calls, and health
    // checks have no Origin header — allow them through since credentialed
    // browser CORS is what we're actually gating.
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(normalize(origin))) {
      return callback(null, true);
    }

    if (!isProduction) {
      console.warn(`CORS: rejected origin "${origin}" (allowed: ${[...allowedOrigins].join(', ')})`);
    }
    return callback(ApiError.forbidden('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  maxAge: 600, // cache preflight responses for 10 minutes
  optionsSuccessStatus: 204,
};
