import fs from "fs";
import path from "path";
import { securityConfig } from "../config/security.config";

/** Verify file starts with %PDF magic bytes (not just MIME header) */
export function isValidPdfFile(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.subarray(0, 4).equals(securityConfig.upload.pdfMagicBytes);
  } catch {
    return false;
  }
}

/** Reject path traversal and non-whitelisted extensions */
export function isAllowedUploadFilename(originalName: string): boolean {
  const ext = path.extname(originalName).toLowerCase();
  if (!securityConfig.upload.allowedExtensions.includes(ext)) {
    return false;
  }
  const base = path.basename(originalName);
  return base === originalName && !originalName.includes("..");
}
