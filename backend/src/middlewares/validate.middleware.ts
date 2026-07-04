import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { ValidationError } from "../errors/AppError";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError("Validation failed", error.flatten().fieldErrors));
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Request["query"];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError("Validation failed", error.flatten().fieldErrors));
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as Request["params"];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError("Validation failed", error.flatten().fieldErrors));
      }
      next(error);
    }
  };
}
