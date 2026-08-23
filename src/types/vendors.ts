/**
 * @file vendors.ts
 * @description Frontend-specific types for Vendors module
 */

import { Vendor, VendorCategory, VendorExtendedSearchParams, Quote, QuoteRequest } from '../shared/types';

// Re-export backend types for convenience
export type { Vendor, VendorCategory, VendorExtendedSearchParams, Quote, QuoteRequest };

/**
 * Frontend vendor with additional UI-specific properties
 */
export interface VendorWithUI extends Vendor {
  isSelected?: boolean;
  isHighlighted?: boolean;
}

/**
 * Quote form state
 */
export interface QuoteFormState extends QuoteRequest {
  vendorId?: string;
}

/**
 * Quote submission response
 */
export interface QuoteSubmissionResult {
  success: boolean;
  message?: string;
  error?: string;
}
