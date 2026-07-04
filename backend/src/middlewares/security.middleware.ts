import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { ForbiddenError, ValidationError } from "../errors/AppError";
import { isOriginAllowed } from "../config/security.config";
import { isValidPdfFile } from "../utils/file-validation.util";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function extractOrigin(req: Request): string | null {
  const origin = req.headers.origin;
  if (origin) return origin;

  const referer = req.headers.referer;
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/**
 * CSRF awareness — API uses Bearer JWT (not cookies), so classic CSRF does not apply.
 * This middleware validates Origin/Referer on state-changing requests when browsers
 * send them, blocking cross-site form submissions that might accompany cookie auth.
 */
export function originGuard(req: Request, _res: Response, next: NextFunction): void {
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  const origin = extractOrigin(req);
  if (!origin) {
    return next();
  }

  if (!isOriginAllowed(origin)) {
    return next(new ForbiddenError("Request origin not allowed"));
  }

  next();
}

/**
 * Post-multer validation — magic-byte PDF check and empty file guard.
 * Deletes invalid uploads from disk immediately.
 */
export function validatePdfUpload(req: Request, _res: Response, next: NextFunction): void {
  const file = req.file;
  if (!file) {
    return next(new ValidationError("PDF certificate file is required"));
  }

  if (file.size === 0) {
    fs.unlinkSync(file.path);
    return next(new ValidationError("Uploaded file is empty"));
  }

  if (!isValidPdfFile(file.path)) {
    fs.unlinkSync(file.path);
    return next(new ValidationError("File is not a valid PDF (magic-byte check failed)"));
  }

  next();
}
