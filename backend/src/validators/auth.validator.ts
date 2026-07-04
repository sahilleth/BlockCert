import { z } from "zod";
import { sanitizeString } from "../utils/sanitize.util";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required")
    .max(255),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const certificateIdParamSchema = z.object({
  id: z.string().uuid("Invalid certificate ID"),
});
