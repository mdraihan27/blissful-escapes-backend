import mongoose from 'mongoose';

/**
 * Single-use magic-login tokens.
 * Only the SHA-256 hash of the token is stored — the raw token exists
 * solely inside the emailed link.
 */
const loginTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// MongoDB TTL index: expired tokens are removed automatically
loginTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LoginToken = mongoose.model('LoginToken', loginTokenSchema);
