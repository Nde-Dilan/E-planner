/**
 * @file vendor.validator.ts
 * @description Validation chains using express-validator for the Vendors module.
 *              Handles input validation and sanitization for all vendor-related endpoints.
 *
 * Validation Strategy:
 *  - All inputs are trimmed and cast to expected types
 *  - Range validators (ratings, prices) use ISO float/integer validation
 *  - Custom validators enforce business rules (email/phone format, inter-field constraints)
 *  - Validation errors are collected and returned as VALIDATION_ERROR with detailed field info
 */

import { body, query, param, ValidationChain } from 'express-validator';

/**
 * Helper function: isEmailOrCameroonPhone
 *
 * Validates that a contact is either:
 *  1. A valid email in RFC 5322 format, OR
 *  2. A valid Cameroon phone number in E.164 format (+237 prefix, 13 chars total)
 *
 * @param value - The contact string to validate
 * @returns true if valid email or phone, false otherwise
 *
 * @example
 * isEmailOrCameroonPhone('client@example.com') // true
 * isEmailOrCameroonPhone('+237612345678') // true (13 chars, +237 prefix)
 * isEmailOrCameroonPhone('+23761234567') // false (12 chars, invalid E.164)
 * isEmailOrCameroonPhone('invalid') // false
 */
export function isEmailOrCameroonPhone(value: string): boolean {
  // Validate email format using RFC 5322 basic pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(value)) {
    return true;
  }

  // Validate Cameroon phone: +237 prefix + 9 digits (total 13 chars)
  const phoneRegex = /^\+237\d{9}$/;
  if (phoneRegex.test(value)) {
    return true;
  }

  return false;
}

/**
 * Helper validator: validatePriceRange
 *
 * Custom body validator that enforces inter-field constraint:
 *  - If both minPrice and maxPrice are present, ensure minPrice <= maxPrice
 *  - If only one or neither is present, validation passes (fields are optional)
 *
 * This is applied as body().custom(validatePriceRange) to validate across fields.
 *
 * @throws {Error} with message if minPrice > maxPrice
 *
 * @example
 * // Both present and valid
 * req.body = { minPrice: 50000, maxPrice: 150000 } // passes
 *
 * // Both present and invalid
 * req.body = { minPrice: 150000, maxPrice: 50000 } // throws
 *
 * // Only one present
 * req.body = { minPrice: 50000 } // passes
 */
export async function validatePriceRange(_value: unknown, { req }: any) {
  const { minPrice, maxPrice } = req.body;

  // If both are present, enforce the constraint
  if (minPrice !== undefined && maxPrice !== undefined) {
    if (minPrice > maxPrice) {
      throw new Error('minPrice must be less than or equal to maxPrice');
    }
  }

  // If only one or neither is present, pass
  return true;
}

/**
 * Validation chain: validateSearchParams
 *
 * Validates query parameters for GET /api/vendors search endpoint.
 * Supports filtering by category, city, rating, price range, and pagination.
 *
 * Fields:
 *  - category: optional, one of ['caterer', 'sound', 'decor', 'photo']
 *  - city: optional, string, trimmed, max 100 chars
 *  - minRating: optional, float between 0.0 and 5.0
 *  - minPrice: optional, integer >= 0
 *  - maxPrice: optional, integer >= 0
 *  - page: optional, integer >= 1
 *  - limit: optional, integer between 1 and 100
 *  - Plus custom validator for price range: minPrice <= maxPrice
 */
export const validateSearchParams: ValidationChain[] = [
  // Category filter
  query('category')
    .optional()
    .isIn(['caterer', 'sound', 'decor', 'photo'])
    .withMessage('La catégorie doit être l\'une des valeurs : caterer, sound, decor, photo'),

  // City filter
  query('city')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('La ville ne peut pas être vide')
    .isLength({ max: 100 })
    .withMessage('La ville doit contenir au maximum 100 caractères'),

  // Minimum rating filter
  query('minRating')
    .optional()
    .isFloat({ min: 0.0, max: 5.0 })
    .withMessage('La note minimale doit être entre 0.0 et 5.0'),

  // Minimum price filter
  query('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le prix minimum doit être un entier >= 0'),

  // Maximum price filter
  query('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le prix maximum doit être un entier >= 0'),

  // Page number
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier >= 1'),

  // Items per page
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un entier entre 1 et 100'),

  // Inter-field validation: minPrice <= maxPrice
  body().custom(validatePriceRange),
];

/**
 * Validation chain: validateUuidParam
 *
 * Validates route parameter :id as a valid UUID v4.
 * Used for endpoints like GET /api/vendors/:id, DELETE /api/vendors/:id, etc.
 *
 * Fields:
 *  - id: must be a valid UUID v4
 */
export const validateUuidParam: ValidationChain[] = [
  param('id')
    .isUUID(4)
    .withMessage('L\'identifiant doit être un UUID v4 valide'),
];

/**
 * Validation chain: validateVendorPayload
 *
 * Validates request body for POST /api/vendors (create) and PUT /api/vendors/:id (update).
 * All fields are required for creation/update operations.
 *
 * Fields:
 *  - name: string, trimmed, 2-150 characters
 *  - category: one of ['caterer', 'sound', 'decor', 'photo']
 *  - city: string, trimmed, 2-100 characters
 *  - priceRange: string, trimmed, 3-100 characters
 *  - rating: optional, float between 0.0 and 5.0
 */
export const validateVendorPayload: ValidationChain[] = [
  // Vendor name
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Le nom du prestataire doit contenir entre 2 et 150 caractères'),

  // Vendor category
  body('category')
    .isIn(['caterer', 'sound', 'decor', 'photo'])
    .withMessage('La catégorie doit être l\'une des valeurs : caterer, sound, decor, photo'),

  // Vendor city
  body('city')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ville doit contenir entre 2 et 100 caractères'),

  // Price range description
  body('priceRange')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('La fourchette de prix doit contenir entre 3 et 100 caractères'),

  // Optional rating (0.0 to 5.0)
  body('rating')
    .optional()
    .isFloat({ min: 0.0, max: 5.0 })
    .withMessage('La note doit être entre 0.0 et 5.0'),
];

/**
 * Validation chain: validateQuoteRequest
 *
 * Validates request body for POST /api/vendors/:id/quote (create quote/contact request).
 * Ensures all required fields are present and in valid format.
 *
 * Fields:
 *  - clientName: string, trimmed, 2-100 characters
 *  - contact: email (RFC 5322) OR phone (E.164 +237, 13 chars)
 *  - message: string, trimmed, 10-1000 characters
 *  - eventType: string, trimmed, non-empty, max 100 characters
 */
export const validateQuoteRequest: ValidationChain[] = [
  // Client name
  body('clientName')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du client doit contenir entre 2 et 100 caractères'),

  // Contact: email or phone
  body('contact')
    .custom(isEmailOrCameroonPhone)
    .withMessage('Le contact doit être une adresse email valide ou un numéro de téléphone camerounais au format E.164 (+237XXXXXXXXX)'),

  // Quote message
  body('message')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Le message doit contenir entre 10 et 1000 caractères'),

  // Event type
  body('eventType')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Le type d\'événement ne peut pas être vide')
    .isLength({ max: 100 })
    .withMessage('Le type d\'événement doit contenir au maximum 100 caractères'),
];
