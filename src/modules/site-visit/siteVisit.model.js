import mongoose from 'mongoose';

const UNFILLED = 'unfilled';

const siteVisitSchema = new mongoose.Schema(
  {
    // Page/navigation context, as reported by the client
    path: { type: String, default: UNFILLED, trim: true, maxlength: 2048 },
    referrer: { type: String, default: UNFILLED, trim: true, maxlength: 2048 },

    // Request metadata captured server-side
    ipAddress: { type: String, default: UNFILLED },
    userAgent: { type: String, default: UNFILLED },
    browser: { type: String, default: UNFILLED },
    device: { type: String, default: UNFILLED },
    os: { type: String, default: UNFILLED },

    // Client-reported environment details (best effort, never trusted
    // beyond storage — no security decisions are made from these)
    language: { type: String, default: UNFILLED, maxlength: 100 },
    timezone: { type: String, default: UNFILLED, maxlength: 100 },
    screen: { type: String, default: UNFILLED, maxlength: 50 },

    location: {
      city: { type: String, default: UNFILLED },
      region: { type: String, default: UNFILLED },
      country: { type: String, default: UNFILLED },
      lat: { type: Number, default: null },
      lon: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

siteVisitSchema.index({ createdAt: -1 });
siteVisitSchema.index({ ipAddress: 1 });

export const SiteVisit = mongoose.model('SiteVisit', siteVisitSchema);
export { UNFILLED };
