import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import tripEnquiryRoutes from './modules/trip-enquiry/tripEnquiry.routes.js';
import siteVisitRoutes from './modules/site-visit/siteVisit.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';
import userRoutes from './modules/user/user.routes.js';

const app = express();

// Trust the first proxy hop (needed for correct client IPs behind a
// reverse proxy — rate limiting and secure cookies depend on it)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers
app.use(helmet());

// CORS — allowlisted origins only, with credentials for the session cookie.
// Preflight (OPTIONS) is handled automatically by this same middleware.
app.use(cors(corsOptions));

// Body parsing with a tight size limit
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(globalLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/trip-enquiries', tripEnquiryRoutes);
app.use('/api/v1/site-visits', siteVisitRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
