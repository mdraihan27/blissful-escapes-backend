import rateLimit from 'express-rate-limit';

const commonOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
};

// Global safety net for the whole API
export const globalLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

// Strict limit for credential attempts
export const loginLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

// Very strict limit for sending login-link emails
export const forgotPasswordLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

// Public form submission — generous enough for real visitors, tight
// enough to blunt scripted spam of the enquiry form
export const tripEnquiryLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

// Fires on every page view site-wide, so the ceiling is much higher than
// a form submission limiter — still caps runaway/scripted traffic per IP
export const siteVisitLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 120,
});
