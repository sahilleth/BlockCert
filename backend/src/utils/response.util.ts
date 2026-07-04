import { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, 201, message);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
