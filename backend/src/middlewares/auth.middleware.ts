import { Response, NextFunction, Request } from "express";
import { verifyToken, JwtPayload } from "../config/jwt";
import { UnauthorizedError } from "../errors/AppError";

export type { JwtPayload };

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError());
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  try {
    req.user = verifyToken(header.slice(7));
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}
