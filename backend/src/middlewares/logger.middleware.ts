import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
    } else {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
    }
  });

  next();
}
