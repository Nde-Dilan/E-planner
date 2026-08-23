/**
 * @file vendor.service.ts
 * @description Business logic for vendor operations.
 *              Implements search, CRUD, and price range parsing.
 *              Manages integrity with review cleanup on deletion.
 */

import { randomUUID } from 'crypto';
import {
  Vendor,
  VendorCreatePayload,
  VendorExtendedSearchParams,
  PaginatedResponse,
  PaginationMeta,
} from '@shared/types';
import { NotFoundError } from '@shared/errors';
import { vendorStore, IVendorStore } from './vendor.store';
import { quoteStore, IQuoteStore } from './quote.store';

/**
 * Helper function to parse a price range string like "50 000 - 150 000 XAF".
 * Uses regex to extract two numbers (possibly with spaces for thousands).
 * Removes all spaces before parseInt to handle "50 000" → 50000.
 * Returns [low, high] if both parse successfully as integers, otherwise null.
 *
 * @param priceRange - The price range string to parse (e.g., "50 000 - 150 000 XAF")
 * @returns A tuple [low, high] if parsing succeeds, or null if it fails
 */
function parsePriceRange(priceRange: string): [number, number] | null {
  const match = priceRange.match(/(\d[\d\s]*)\s*[-–]\s*(\d[\d\s]*)/);
  if (!match) {
    return null;
  }

  // Remove all spaces before parseInt to handle "50 000" → 50000
  const low = parseInt(match[1].replace(/\s/g, ''), 10);
  const high = parseInt(match[2].replace(/\s/g, ''), 10);

  if (isNaN(low) || isNaN(high)) {
    return null;
  }

  return [low, high];
}

/**
 * Interface for vendor service operations.
 * Provides search, CRUD operations, and business logic enforcement.
 */
export interface IVendorService {
  /**
   * Searches vendors with combined filters (AND logic) and pagination.
   * All filters are optional — absence means no restriction on that field.
   * Price range overlap: parsedMin <= maxPrice && parsedMax >= minPrice
   *
   * @param params - Extended search parameters including filters and pagination
   * @returns Paginated response with items and metadata
   */
  search(params: VendorExtendedSearchParams): PaginatedResponse<Vendor>;

  /**
   * Retrieves a vendor by ID.
   * Throws NotFoundError if not found.
   *
   * @param id - The UUID of the vendor
   * @returns The vendor if found
   * @throws NotFoundError if vendor not found
   */
  findById(id: string): Vendor;

  /**
   * Creates a new vendor.
   * Generates a UUID v4 via crypto.randomUUID().
   * Applies default rating: payload.rating ?? 0.0
   *
   * @param payload - Vendor creation payload (without id)
   * @returns The created vendor with generated id
   */
  create(payload: VendorCreatePayload): Vendor;

  /**
   * Updates an existing vendor entirely.
   * Verifies existence via findById (throws NotFoundError if not found).
   * Returns the updated vendor from store.
   *
   * @param id - The UUID of the vendor to update
   * @param payload - New vendor data
   * @returns The updated vendor
   * @throws NotFoundError if vendor not found
   */
  update(id: string, payload: VendorCreatePayload): Vendor;

  /**
   * Deletes a vendor and its associated reviews/quotes.
   * Verifies existence via findById (throws NotFoundError if not found).
   * Cleans up all quotes associated with this vendor.
   *
   * @param id - The UUID of the vendor to delete
   * @throws NotFoundError if vendor not found
   */
  delete(id: string): void;
}

/**
 * Implementation of vendor business logic.
 * Handles search with multi-field filtering, pagination, CRUD operations,
 * and integrity constraints (e.g., rating normalization, review cleanup).
 */
class VendorService implements IVendorService {
  /**
   * Initializes the service with injected dependencies.
   * @param vendorStore - The vendor data store
   * @param quoteStore - The quote data store
   */
  constructor(
    private vendorStore: IVendorStore,
    private quoteStore: IQuoteStore
  ) {}

  /**
   * Searches vendors with combined filters (AND logic) and pagination.
   *
   * Filter logic:
   * - category: exact match (case-sensitive)
   * - city: case-insensitive substring or exact match
   * - minRating: vendor's normalized rating >= minRating
   * - minPrice/maxPrice: price range overlap check
   *   Overlap formula: parsedMin <= maxPrice && parsedMax >= minPrice
   *   If parsing fails, vendor is excluded.
   *
   * Pagination:
   * - page: default 1, must be >= 1
   * - limit: default 20, must be 1-100, capped at 100 if exceeded
   *
   * @param params - Search parameters (all optional)
   * @returns Paginated response with items and metadata
   */
  search(params: VendorExtendedSearchParams): PaginatedResponse<Vendor> {
    // Get all vendors from store
    let vendors = this.vendorStore.findAll();

    // Apply category filter (exact match)
    if (params.category) {
      vendors = vendors.filter((v) => v.category === params.category);
    }

    // Apply city filter (case-insensitive)
    if (params.city) {
      const cityLower = params.city.toLowerCase();
      vendors = vendors.filter((v) =>
        v.city.toLowerCase().includes(cityLower)
      );
    }

    // Apply minRating filter (normalized rating >= minRating)
    if (params.minRating !== undefined) {
      vendors = vendors.filter((v) => {
        const normalizedRating = Math.round(v.rating * 10) / 10;
        return normalizedRating >= (params.minRating ?? 0);
      });
    }

    // Apply price range filter (overlap check)
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      vendors = vendors.filter((v) => {
        const parsed = parsePriceRange(v.priceRange);
        if (!parsed) {
          // If parsing fails, exclude this vendor
          return false;
        }
        const [parsedMin, parsedMax] = parsed;

        // Check overlap: parsedMin <= maxPrice && parsedMax >= minPrice
        const minPriceCheck = params.minPrice !== undefined
          ? parsedMax >= params.minPrice
          : true;
        const maxPriceCheck = params.maxPrice !== undefined
          ? parsedMin <= params.maxPrice
          : true;

        return minPriceCheck && maxPriceCheck;
      });
    }

    // Apply pagination
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    const totalItems = vendors.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const items = vendors.slice(startIndex, startIndex + limit);

    const pagination: PaginationMeta = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      items,
      pagination,
    };
  }

  /**
   * Retrieves a vendor by ID.
   * Throws NotFoundError if not found.
   *
   * @param id - The UUID of the vendor
   * @returns The vendor if found
   * @throws NotFoundError if vendor not found
   */
  findById(id: string): Vendor {
    const vendor = this.vendorStore.findById(id);
    if (!vendor) {
      throw new NotFoundError('Prestataire');
    }
    return vendor;
  }

  /**
   * Creates a new vendor.
   * Generates a UUID v4 via crypto.randomUUID().
   * Applies default rating: payload.rating ?? 0.0
   *
   * @param payload - Vendor creation payload (without id)
   * @returns The created vendor with generated id
   */
  create(payload: VendorCreatePayload): Vendor {
    const id = randomUUID();
    const vendor: Vendor = {
      id,
      ...payload,
      rating: payload.rating ?? 0.0,
    };
    return this.vendorStore.create(vendor);
  }

  /**
   * Updates an existing vendor entirely.
   * Verifies existence via findById (throws NotFoundError if not found).
   * Returns the updated vendor from store.
   *
   * @param id - The UUID of the vendor to update
   * @param payload - New vendor data
   * @returns The updated vendor
   * @throws NotFoundError if vendor not found
   */
  update(id: string, payload: VendorCreatePayload): Vendor {
    // Verify existence (throws NotFoundError if not found)
    this.findById(id);

    const updated = this.vendorStore.update(id, payload);
    if (!updated) {
      // This should not happen since we verified existence, but be defensive
      throw new NotFoundError('Prestataire');
    }
    return updated;
  }

  /**
   * Deletes a vendor and its associated quotes.
   * Verifies existence via findById (throws NotFoundError if not found).
   * Cleans up all quotes associated with this vendor.
   *
   * @param id - The UUID of the vendor to delete
   * @throws NotFoundError if vendor not found
   */
  delete(id: string): void {
    // Verify existence (throws NotFoundError if not found)
    this.findById(id);

    // Delete the vendor
    this.vendorStore.delete(id);

    // Clean up quotes associated with this vendor
    const allQuotes = this.quoteStore.findAll();
    
    // Remove quotes from the store (by recreating without them)
    const remainingQuotes = allQuotes.filter((q) => q.vendorId !== id);
    this.quoteStore.seed(remainingQuotes);
  }
}

/**
 * Singleton instance of VendorService.
 * Exported for use throughout the application.
 */
export const vendorService = new VendorService(vendorStore, quoteStore);

// Export helper function for testing
export { parsePriceRange };
