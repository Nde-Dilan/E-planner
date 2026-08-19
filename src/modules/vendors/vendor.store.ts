/**
 * @file vendor.store.ts
 * @description In-memory store for vendors (prestataires de services).
 *              Implements IVendorStore interface with CRUD operations.
 *              Singleton pattern ensures single instance across the application.
 */

import { Vendor, VendorCreatePayload } from '@shared/types';

/**
 * Interface for vendor data store operations.
 * Provides CRUD operations and seeding for vendor data.
 */
export interface IVendorStore {
  /**
   * Retrieves all vendors from the store.
   * @returns A shallow copy of the vendors array
   */
  findAll(): Vendor[];

  /**
   * Finds a vendor by its unique identifier.
   * @param id - The UUID of the vendor to retrieve
   * @returns The vendor if found, undefined otherwise
   */
  findById(id: string): Vendor | undefined;

  /**
   * Creates and stores a new vendor.
   * Normalizes the rating to 1 decimal place before storing.
   * @param vendor - The vendor object to store (should include id)
   * @returns The stored vendor with normalized rating
   */
  create(vendor: Vendor): Vendor;

  /**
   * Updates an existing vendor with new data.
   * Replaces the entire vendor object and normalizes rating to 1 decimal place.
   * @param id - The UUID of the vendor to update
   * @param data - The new vendor data (without id)
   * @returns The updated vendor with normalized rating, or undefined if not found
   */
  update(id: string, data: VendorCreatePayload): Vendor | undefined;

  /**
   * Deletes a vendor from the store.
   * @param id - The UUID of the vendor to delete
   * @returns true if the vendor was deleted, false if not found
   */
  delete(id: string): boolean;

  /**
   * Replaces the entire vendor store with seeded data.
   * Normalizes rating to 1 decimal place for each vendor.
   * @param vendors - Array of vendors to seed
   */
  seed(vendors: Vendor[]): void;
}

/**
 * In-memory store implementation for vendors.
 * Uses a simple array as the underlying data structure.
 * All ratings are normalized to 1 decimal place for consistency.
 */
class VendorStore implements IVendorStore {
  /**
   * Private array to store vendor data.
   * @private
   */
  private vendors: Vendor[] = [];

  /**
   * Normalizes a rating value to 1 decimal place.
   * Rounds the rating and ensures it's within valid bounds.
   * @param rating - The rating to normalize (defaults to 0 if undefined)
   * @returns The normalized rating (1 decimal place)
   * @private
   */
  private normalizeRating(rating: number | undefined): number {
    return Math.round((rating ?? 0) * 10) / 10;
  }

  /**
   * Retrieves all vendors from the store.
   * @returns A shallow copy of the vendors array
   */
  findAll(): Vendor[] {
    return [...this.vendors];
  }

  /**
   * Finds a vendor by its unique identifier.
   * @param id - The UUID of the vendor to retrieve
   * @returns The vendor if found, undefined otherwise
   */
  findById(id: string): Vendor | undefined {
    return this.vendors.find((vendor) => vendor.id === id);
  }

  /**
   * Creates and stores a new vendor.
   * Normalizes the rating to 1 decimal place before storing.
   * @param vendor - The vendor object to store (should include id)
   * @returns The stored vendor with normalized rating
   */
  create(vendor: Vendor): Vendor {
    const normalized: Vendor = {
      ...vendor,
      rating: this.normalizeRating(vendor.rating),
    };
    this.vendors.push(normalized);
    return normalized;
  }

  /**
   * Updates an existing vendor with new data.
   * Replaces the entire vendor object and normalizes rating to 1 decimal place.
   * @param id - The UUID of the vendor to update
   * @param data - The new vendor data (without id)
   * @returns The updated vendor with normalized rating, or undefined if not found
   */
  update(id: string, data: VendorCreatePayload): Vendor | undefined {
    const index = this.vendors.findIndex((vendor) => vendor.id === id);
    if (index === -1) {
      return undefined;
    }

    const updated: Vendor = {
      id,
      ...data,
      rating: this.normalizeRating(data.rating),
    };

    this.vendors[index] = updated;
    return updated;
  }

  /**
   * Deletes a vendor from the store.
   * @param id - The UUID of the vendor to delete
   * @returns true if the vendor was deleted, false if not found
   */
  delete(id: string): boolean {
    const initialLength = this.vendors.length;
    this.vendors = this.vendors.filter((vendor) => vendor.id !== id);
    return this.vendors.length < initialLength;
  }

  /**
   * Replaces the entire vendor store with seeded data.
   * Normalizes rating to 1 decimal place for each vendor.
   * @param vendors - Array of vendors to seed
   */
  seed(vendors: Vendor[]): void {
    this.vendors = vendors.map((vendor) => ({
      ...vendor,
      rating: this.normalizeRating(vendor.rating),
    }));
  }
}

/**
 * Singleton instance of VendorStore.
 * Exported as a single instance for use throughout the application.
 */
export const vendorStore = new VendorStore();
