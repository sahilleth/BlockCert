import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { assertProductionSecrets, isOriginAllowed } from "./config/security.config";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import { httpLoggerMiddleware } from "./middlewares/logger.middleware";
import { globalRateLimiter } from "./middlewares/rate-limit.middleware";
import { originGuard } from "./middlewares/security.middleware";

assertProductionSecrets();

export function createApp(): Application {
  const app = express();
  const isProduction = env.NODE_ENV === "production";

  app.set("trust proxy", 1);

  // ─── Helmet: security headers (CSP, HSTS, X-Frame-Options, etc.) ─────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'"],
              frameSrc: ["'none'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
            },
          }
        : false,
      hsts: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      noSniff: true,
      frameguard: { action: "deny" },
    })
  );

  // ─── CORS: restrict browser origins ───────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = isOriginAllowed(origin);
        callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
      maxAge: 86400,
    })
  );

  // ─── CSRF awareness: validate Origin on state-changing requests ─────────────
  app.use(originGuard);

  // ─── Body parsing with size limit (separate from file upload limit) ───────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);

  // ─── Global rate limiting ─────────────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ─── Static uploads — nosniff + inline PDF only ───────────────────────────────
  app.use(
    "/uploads/certificates",
    (_req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
      next();
    },
    express.static(path.join(path.resolve(env.UPLOAD_DIR), "certificates"))
  );
  app.use("/uploads/qrcodes", express.static(path.join(path.resolve(env.UPLOAD_DIR), "qrcodes")));

  app.use(env.API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
