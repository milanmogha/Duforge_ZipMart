import rateLimit from "express-rate-limit";

// Limiters are keyed by the target email address rather than by IP.
//
// The API runs behind a reverse proxy in production and `trust proxy` is not
// set, so `req.ip` resolves to the proxy for every caller — an IP-keyed limiter
// would put all users in a single bucket and lock everyone out at once.
// Email keying also matches the abuse we actually care about here: flooding one
// person's inbox, and brute-forcing one account's code.
const byEmail = (req) =>
  String(req.body?.email || "").trim().toLowerCase() || "__missing_email__";

/**
 * Caps how often a login code can be mailed to a single address.
 * Allows the initial send plus a few resends before backing off.
 */
export const loginOtpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  keyGenerator: byEmail,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP requests for this email. Please try again in a few minutes.",
  },
});

/**
 * Slows down guessing against a live code. This is a second line of defence —
 * `verifyLoginOtp` also counts failed attempts on the OTP record itself, which
 * survives a server restart and works across multiple instances.
 */
export const loginOtpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  keyGenerator: byEmail,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many verification attempts. Please request a new code later.",
  },
});
