import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { securityConfig } from "../config/security.config";
import { ValidationError } from "../errors/AppError";
import { isAllowedUploadFilename } from "../utils/file-validation.util";

const uploadDir = path.resolve(env.UPLOAD_DIR);
export const certDir = path.join(uploadDir, "certificates");
export const qrDir = path.join(uploadDir, "qrcodes");

[uploadDir, certDir, qrDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, certDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const uploadPdf = multer({
  storage,
  limits: { fileSize: securityConfig.upload.maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedUploadFilename(file.originalname)) {
      cb(new Error("Only .pdf files with a valid filename are allowed"));
      return;
    }
    if (!securityConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error(`File type not allowed. Allowed: ${securityConfig.upload.allowedMimeTypes.join(", ")}`));
      return;
    }
    cb(null, true);
  },
});

export function handleMulterError(err: Error, _req: Request, _res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ValidationError(`File exceeds ${env.MAX_FILE_SIZE_MB}MB limit`));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new ValidationError("Only one file may be uploaded at a time"));
    }
    return next(new ValidationError(err.message));
  }
  if (err) {
    return next(new ValidationError(err.message));
  }
  next();
}
