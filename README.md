# Blissful Escapes — Backend

Secure Express 5 + MongoDB (Mongoose) API with a modular **service / controller / model** architecture.

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values
npm run seed:user      # creates the login user from SEED_USER_ID / SEED_USER_PASSWORD
npm run dev            # or: npm start
```

## Structure

```
src/
├── app.js                     # Express app (security middleware, routes)
├── server.js                  # Entry point (DB connect, graceful shutdown)
├── config/
│   ├── env.js                 # Zod-validated environment config
│   └── db.js                  # Mongoose connection
├── middlewares/
│   ├── auth.middleware.js     # JWT guard (cookie or Bearer)
│   ├── error.middleware.js    # Central error handling
│   ├── rateLimit.middleware.js
│   └── validate.middleware.js # Zod request validation
├── modules/
│   └── auth/
│       ├── user.model.js
│       ├── loginToken.model.js
│       ├── auth.service.js
│       ├── auth.controller.js
│       ├── auth.routes.js
│       └── auth.validation.js
├── scripts/
│   └── seed-user.js
└── utils/
    ├── ApiError.js
    ├── catchAsync.js
    ├── jwt.js
    └── mailer.js              # Nodemailer SMTP transport
```

## API (base: `/api/v1/auth`)

| Method | Route              | Auth | Description                                              |
| ------ | ------------------ | ---- | -------------------------------------------------------- |
| POST   | `/login`           | —    | Login with `{ userId, password }`                        |
| POST   | `/forgot-password` | —    | `{ userId }` → emails a one-time login link (fixed recipient) |
| POST   | `/magic-login`     | —    | `{ token }` from the emailed link → session              |
| POST   | `/logout`          | ✅   | Clears the session cookie                                |
| GET    | `/me`              | ✅   | Current user                                             |

There is **no registration endpoint** by design — the only user is created via `npm run seed:user`.

## Forgot-password flow

1. `POST /forgot-password` with the user id.
2. A one-time token (48 random bytes, stored only as a SHA-256 hash, TTL-expired by MongoDB) is created; the link `FRONTEND_URL/auth/magic-login?token=...` is emailed via SMTP to `LOGIN_LINK_RECIPIENT_EMAIL`.
3. The frontend posts the token to `/magic-login`; redemption is atomic (single-use, race-safe) and revokes all previously issued sessions.

## Security measures

- **Passwords**: bcrypt (cost 12), never selected by default, stripped from JSON output
- **Sessions**: HS256 JWT with issuer/audience claims, delivered as an `httpOnly` / `secure` / `sameSite` cookie; `tokenVersion` allows revoking all sessions
- **Brute force**: per-route rate limits + account lockout (5 failures → 15 min)
- **Enumeration**: generic error messages, identical forgot-password response, timing-equalized login for unknown users
- **Injection**: Mongoose `sanitizeFilter`, strict Zod schemas (`.strict()` rejects unknown keys), 10 kb JSON body limit
- **Headers/CORS**: helmet defaults, CORS locked to `FRONTEND_URL` only
- **Errors**: internals and stack traces never leak in production
