import { Request, Response, NextFunction } from 'express';
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
export declare function validate(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=validate.middleware.d.ts.map