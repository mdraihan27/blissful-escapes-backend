import mongoose from 'mongoose';

const UNFILLED = 'unfilled';

const tripEnquirySchema = new mongoose.Schema(
  {
    // Form fields — exactly what the visitor submitted. Empty/missing
    // values are normalized to "unfilled" rather than left blank.
    name: { type: String, default: UNFILLED, trim: true },
    email: { type: String, default: UNFILLED, trim: true },
    phone: { type: String, default: UNFILLED, trim: true },
    where: { type: String, default: UNFILLED, trim: true },
    when: { type: String, default: UNFILLED, trim: true },
    message: { type: String, default: UNFILLED, trim: true },

    // Page context, as reported by the client
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

    // Whether an admin has seen this enquiry yet. Powers the sidebar unread
    // count and the "new / older" split on the messages page.
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const TripEnquiry = mongoose.model('TripEnquiry', tripEnquirySchema);
export { UNFILLED };
