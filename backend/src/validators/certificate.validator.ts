import { z } from "zod";
import { sanitizeString } from "../utils/sanitize.util";

const safeText = (min: number, max: number) =>
  z
    .string()
    .transform(sanitizeString)
    .pipe(z.string().min(min).max(max));

export const uploadCertificateSchema = z.object({
  studentName: safeText(2, 150),
  studentEmail: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeString(v) : ""))
    .pipe(z.union([z.literal(""), z.string().email()])),
  course: safeText(2, 200),
  department: safeText(2, 150),
  issueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date must be YYYY-MM-DD"),
});
