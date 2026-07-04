import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(err.message, {
      requestId: req.requestId,
      statusCode: err.statusCode,
      details: err.details,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined && { errors: err.details }),
    });
    return;
  }

  logger.error("Unhandled error", {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: "Route not found" });
}
