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
export declare function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=error.middleware.d.ts.map