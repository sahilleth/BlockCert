import rateLimit from "express-rate-limit";
import { securityConfig } from "../config/security.config";

const rateLimitResponse = {
  success: false,
  message: "Too many requests, please try again later",
};

/** Global API rate limit — applies to all routes */
export const globalRateLimiter = rateLimit({
  windowMs: securityConfig.globalRateLimit.windowMs,
  max: securityConfig.globalRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

/** Stricter limit on login — mitigates credential brute-force */
export const loginRateLimiter = rateLimit({
  windowMs: securityConfig.loginRateLimit.windowMs,
  max: securityConfig.loginRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

/** Limit public verification scans — prevents enumeration / DoS */
export const verifyRateLimiter = rateLimit({
  windowMs: securityConfig.verifyRateLimit.windowMs,
  max: securityConfig.verifyRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please try again later.",
  },
});
