// Fully permissive CORS — every origin is accepted.
//
// The origin is reflected back (rather than sending "*") because this API
// uses cookies (credentials); browsers reject a "*" wildcard on credentialed
// requests, so echoing the caller's own origin is the only way to accept all
// origins while still allowing credentials.
//
// NOTE: this intentionally removes cross-origin protection. Any website can
// make authenticated requests against this API.
export const corsOptions = {
  origin: true, // reflect the request origin — allows all
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
  optionsSuccessStatus: 204,
};
