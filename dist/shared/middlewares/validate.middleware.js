"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_validator_1 = require("express-validator");
const errors_1 = require("../errors");
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
function validate(req, _res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (errors.isEmpty()) {
        next();
        return;
    }
    // Map each express-validator error to ValidationError format
    const validationErrors = errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
        rejectedValue: error.value,
    }));
    // Create ValidationAppError and pass to error handler
    const validationError = new errors_1.ValidationAppError(validationErrors);
    next(validationError);
}
//# sourceMappingURL=validate.middleware.js.map