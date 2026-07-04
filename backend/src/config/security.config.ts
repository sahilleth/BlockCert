import { env } from "./env";

/** Known weak JWT secrets that must not be used in production */
const WEAK_JWT_SECRETS = new Set([
  "change_this_to_a_long_random_secret_in_production",
  "your_jwt_secret_here",
  "secret",
  "jwt_secret",
]);

export const securityConfig = {
  /** Allowed CORS origins — comma-separated in ALLOWED_ORIGINS, falls back to FRONTEND_URL */
  allowedOrigins: env.ALLOWED_ORIGINS.length > 0 ? env.ALLOWED_ORIGINS : [env.FRONTEND_URL],

  /** bcrypt cost factor (rounds) — 12 is OWASP-recommended minimum for 2024+ */
  bcryptRounds: 12,

  /** JWT signing algorithm — pinned to prevent algorithm confusion attacks */
  jwtAlgorithm: "HS256" as const,

  /** Global rate limit */
  globalRateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.NODE_ENV === "production" ? env.RATE_LIMIT_MAX : env.RATE_LIMIT_MAX * 2,
  },

  /** Login brute-force protection */
  loginRateLimit: {
    windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    max: env.LOGIN_RATE_LIMIT_MAX,
  },

  /** Public verification endpoint limit */
  verifyRateLimit: {
    windowMs: env.VERIFY_RATE_LIMIT_WINDOW_MS,
    max: env.VERIFY_RATE_LIMIT_MAX,
  },

  /** Upload constraints */
  upload: {
    maxBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    allowedMimeTypes: env.ALLOWED_MIME_TYPES.split(",").map((t) => t.trim()),
    allowedExtensions: [".pdf"] as string[],
    pdfMagicBytes: Buffer.from("%PDF"),
  },
} as const;

/** CORS + origin guard — in dev, allow any localhost port (Vite may use 5174+). */
export function isOriginAllowed(origin: string): boolean {
  const normalized = origin.toLowerCase();
  if (securityConfig.allowedOrigins.some((o) => o.toLowerCase() === normalized)) {
    return true;
  }
  if (env.NODE_ENV === "development") {
    try {
      const { hostname } = new URL(origin);
      return hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }
  return false;
}

export function assertProductionSecrets(): void {
  if (env.NODE_ENV !== "production") return;

  if (WEAK_JWT_SECRETS.has(env.JWT_SECRET)) {
    console.error("FATAL: JWT_SECRET is a known weak/default value. Set a strong random secret.");
    process.exit(1);
  }

  if (env.JWT_SECRET.length < 64) {
    console.warn("WARNING: JWT_SECRET should be at least 64 characters in production.");
  }
}
