/**
 * @file vendor.router.ts
 * @description Express router for vendor endpoints.
 *              Defines all routes, applies middleware (security, validation, auth),
 *              and delegates to service layer handlers.
 *
 * Routes:
 *  - GET    /                       : Public search with filters and pagination
 *  - GET    /:id                    : Public detail view of one vendor
 *  - POST   /:id/quote              : Public quote request (with strict rate limiter)
 *  - POST   /                       : Admin only - create vendor
 *  - PUT    /:id                    : Admin only - update vendor
 *  - DELETE /:id                    : Admin only - delete vendor
 *
 * Middleware applied:
 *  - helmet()                      : Security headers on all routes
 *  - globalVendorLimiter           : 100 req/15min per IP on all routes
 *  - quoteLimiter                  : 20 req/15min per IP on POST /:id/quote only
 *  - requireAdmin                  : Admin authentication on POST/PUT/DELETE
 *  - validation chains             : input validation
 *  - validate middleware           : error collection and conversion
 */

import { Router, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  validateSearchParams,
  validateUuidParam,
  validateVendorPayload,
  validateQuoteRequest,
} from './vendor.validator';
import { vendorService } from './vendor.service';
import { quoteService } from './quote.service';
import { validate } from '@shared/middlewares/validate.middleware';
import { requireAdmin } from '@shared/middlewares/auth.middleware';
import { ApiResponse, PaginatedResponse, Vendor } from '@shared/types';

/**
 * Global vendor rate limiter
 * Applies to all routes in this module
 * Limit: 100 requests per 15 minutes per IP
 */
export const globalVendorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'TOO_MANY_REQUESTS',
    message: 'Trop de requêtes...',
    timestamp: new Date().toISOString(),
  },
});

/**
 * Strict quote request rate limiter
 * Applies only to POST /:id/quote route
 * Limit: 20 requests per 15 minutes per IP (prevents abuse/spam)
 */
export const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Limite de demandes de devis atteinte...',
    timestamp: new Date().toISOString(),
  },
});

// Create the router
const router = Router();

// Apply security middleware on all routes
router.use(helmet());
router.use(globalVendorLimiter);

/**
 * GET /
 * Public search endpoint with pagination and filtering
 *
 * Query parameters:
 *  - category?: 'caterer' | 'sound' | 'decor' | 'photo'
 *  - city?: string (max 100 chars)
 *  - minRating?: number (0.0-5.0)
 *  - minPrice?: number (XAF, >= 0)
 *  - maxPrice?: number (XAF, >= 0)
 *  - page?: number (>= 1, default 1)
 *  - limit?: number (1-100, default 20)
 *
 * Response: 200 ApiResponse<PaginatedResponse<Vendor>>
 */
router.get(
  '/',
  [...validateSearchParams, validate],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = vendorService.search(req.query as any);
      const response: ApiResponse<PaginatedResponse<Vendor>> = {
        success: true,
        data: result,
        message: 'Recherche effectuée avec succès',
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /:id
 * Public detail endpoint for a single vendor
 *
 * Path parameters:
 *  - id: UUID v4 of the vendor
 *
 * Response: 200 ApiResponse<Vendor>
 * Errors: 400 (invalid UUID), 404 (vendor not found)
 */
router.get(
  '/:id',
  [...validateUuidParam, validate],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = vendorService.findById(req.params.id);
      const response: ApiResponse<Vendor> = {
        success: true,
        data: vendor,
        message: 'Prestataire récupéré avec succès',
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /:id/quote
 * Public quote request endpoint (with strict rate limiting)
 *
 * Path parameters:
 *  - id: UUID v4 of the vendor
 *
 * Body parameters (QuoteRequest):
 *  - clientName: string (2-100 chars)
 *  - contact: email or +237 phone (E.164 format)
 *  - message: string (10-1000 chars)
 *  - eventType: string (1-100 chars)
 *
 * Response: 201 ApiResponse<{ success: true }>
 * Errors: 400 (validation), 404 (vendor not found), 429 (rate limit)
 */
router.post(
  '/:id/quote',
  quoteLimiter,
  [...validateUuidParam, ...validateQuoteRequest, validate],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      quoteService.createQuote(req.params.id, req.body);
      const response: ApiResponse<{ success: true }> = {
        success: true,
        data: { success: true },
        message: 'Demande de devis enregistrée avec succès',
        timestamp: new Date().toISOString(),
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /
 * Admin only - Create a new vendor
 *
 * Body parameters (VendorCreatePayload):
 *  - name: string (2-150 chars)
 *  - category: 'caterer' | 'sound' | 'decor' | 'photo'
 *  - city: string (2-100 chars)
 *  - priceRange: string (3-100 chars, e.g., "50 000 - 150 000 XAF")
 *  - rating?: number (0.0-5.0, default 0.0)
 *
 * Response: 201 ApiResponse<Vendor>
 * Errors: 400 (validation), 401 (no auth), 403 (insufficient permissions)
 */
router.post(
  '/',
  requireAdmin,
  [...validateVendorPayload, validate],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = vendorService.create(req.body);
      const response: ApiResponse<Vendor> = {
        success: true,
        data: vendor,
        message: 'Prestataire créé avec succès',
        timestamp: new Date().toISOString(),
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /:id
 * Admin only - Update an entire vendor
 *
 * Path parameters:
 *  - id: UUID v4 of the vendor
 *
 * Body parameters (VendorCreatePayload):
 *  - name: string (2-150 chars)
 *  - category: 'caterer' | 'sound' | 'decor' | 'photo'
 *  - city: string (2-100 chars)
 *  - priceRange: string (3-100 chars, e.g., "50 000 - 150 000 XAF")
 *  - rating?: number (0.0-5.0)
 *
 * Response: 200 ApiResponse<Vendor>
 * Errors: 400 (validation), 401 (no auth), 403 (insufficient permissions), 404 (vendor not found)
 */
router.put(
  '/:id',
  requireAdmin,
  [...validateUuidParam, ...validateVendorPayload, validate],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = vendorService.update(req.params.id, req.body);
      const response: ApiResponse<Vendor> = {
        success: true,
        data: vendor,
        message: 'Prestataire mis à jour avec succès',
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /:id
 * Admin only - Delete a vendor and its associated quotes
 *
 * Path parameters:
 *  - id: UUID v4 of the vendor
 *
 * Response: 200 ApiResponse<{ message: string }>
 * Errors: 401 (no auth), 403 (insufficient permissions), 404 (vendor not found)
 */
router.delete(
  '/:id',
  requireAdmin,
  [...validateUuidParam, validate],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      vendorService.delete(req.params.id);
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Prestataire supprimé avec succès' },
        message: 'Prestataire supprimé avec succès',
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Export router as default
export default router;
