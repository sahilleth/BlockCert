/**
 * Strip HTML tags and dangerous control characters from user input.
 * Prevents stored XSS when values are rendered unsafely on the frontend.
 */
export function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[\0\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/** Zod transform helper — sanitize and enforce max length */
export function sanitizedString(min: number, max: number) {
  return (val: string) => {
    const clean = sanitizeString(val);
    if (clean.length < min) throw new Error(`Must be at least ${min} characters`);
    if (clean.length > max) throw new Error(`Must be at most ${max} characters`);
    return clean;
  };
}
