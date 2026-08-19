import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationAppError } from '../errors';
import { ValidationError } from '../types';

/**
 * Express middleware that checks for validation errors from express-validator
 * and converts them to AppError for standardized error handling.
 *
 * This middleware should be placed after validation chains in the route handler.
 * If validation errors are found, they are converted to ValidationAppError and
 * passed to the error handler middleware.
 *
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction for middleware chain
 */
export function validate(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  // Map each express-validator error to ValidationError format
  const validationErrors: ValidationError[] = errors.array().map((error: any) => ({
    field: error.param,
    message: error.msg,
    rejectedValue: error.value,
  }));

  // Create ValidationAppError and pass to error handler
  const validationError = new ValidationAppError(validationErrors);
  next(validationError);
}
