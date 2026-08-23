/**
 * @file error.middleware.ts
 * @description Global Express error handler middleware for E-Planner CMR.
 *              Catches all errors thrown during request processing and returns
 *              standardized ApiResponse with appropriate HTTP status codes.
 *
 * Responsibilities:
 *  - Catch errors from the request pipeline
 *  - Extract error metadata (statusCode, errorCode, message)
 *  - Mask sensitive information in production
 *  - Build standardized ApiResponse structure
 *  - Send response with correct HTTP status
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { AppError } from '../errors';

/**
 * Global error handler middleware.
 *
 * Must be registered as the LAST middleware in the Express app to catch
 * all errors from previous middleware and route handlers.
 *
 * @param err - The error object (unknown type to handle any error thrown)
 * @param _req - Express Request object (unused but required by Express signature)
 * @param res - Express Response object
 * @param _next - Express NextFunction (unused but required by Express signature)
 */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Cast error to AppError to safely access properties
  const appError = err as AppError;

  // Extract error metadata with sensible defaults
  const statusCode = appError?.statusCode ?? 500;
  const errorCode = appError?.errorCode ?? 'INTERNAL_SERVER_ERROR';
  let message = appError?.message ?? 'Une erreur est survenue';

  // Check environment
  const isProduction = process.env.NODE_ENV === 'production';

  // Mask error message in production for 5xx errors
  // This prevents leaking internal implementation details to clients
  if (isProduction && (!appError?.statusCode || statusCode === 500)) {
    message = 'Une erreur interne est survenue';
  }

  // Build standardized ApiResponse
  const response: ApiResponse = {
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
  };

  // Include validation errors if present (only for VALIDATION_ERROR)
  if (appError?.errors) {
    response.errors = appError.errors;
  }

  // Send response with appropriate HTTP status code
  res.status(statusCode).json(response);
}
