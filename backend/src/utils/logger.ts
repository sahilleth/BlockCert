import winston from "winston";
import { env } from "../config/env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, requestId }) => {
  const rid = requestId ? `[${requestId}] ` : "";
  return `${timestamp} ${level}: ${rid}${stack ?? message}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(errors({ stack: true }), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

export function createChildLogger(meta: Record<string, unknown>) {
  return logger.child(meta);
}
