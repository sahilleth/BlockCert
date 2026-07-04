import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError";
import { UserRole } from "../models/User";

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (roles.length > 0 && !roles.includes(req.user.role as UserRole)) {
      return next(new ForbiddenError(`Requires one of roles: ${roles.join(", ")}`));
    }

    next();
  };
}

export const adminOnly = authorize(UserRole.ADMIN);
export const adminOrEmployer = authorize(UserRole.ADMIN, UserRole.EMPLOYER);
