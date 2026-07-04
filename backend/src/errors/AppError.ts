export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, details);
  }
}

export class BlockchainError extends AppError {
  constructor(message = "Blockchain operation failed", details?: unknown) {
    super(502, message, details);
  }
}
