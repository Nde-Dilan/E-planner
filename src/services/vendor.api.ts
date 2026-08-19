/**
 * @file vendor.api.ts
 * @description Client API layer for Vendors module with typed fetch functions
 */

import { Vendor, VendorExtendedSearchParams, Quote, QuoteRequest, ApiResponse, PaginatedResponse } from '../shared/types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Search vendors with optional filters and pagination
 */
export async function searchVendors(params?: Partial<VendorExtendedSearchParams>): Promise<PaginatedResponse<Vendor>> {
  const query = new URLSearchParams();
  
  if (params?.category) query.append('category', params.category);
  if (params?.city) query.append('city', params.city);
  if (params?.minRating !== undefined) query.append('minRating', params.minRating.toString());
  if (params?.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE}/vendors?${query.toString()}`);
  
  if (!response.ok) {
    const error = await response.json() as ApiResponse;
    throw new Error(error.message || 'Failed to search vendors');
  }

  const data = await response.json() as ApiResponse<PaginatedResponse<Vendor>>;
  return data.data!;
}

/**
 * Get vendor by ID
 */
export async function getVendorById(vendorId: string): Promise<Vendor> {
  const response = await fetch(`${API_BASE}/vendors/${vendorId}`);
  
  if (!response.ok) {
    const error = await response.json() as ApiResponse;
    throw new Error(error.message || 'Vendor not found');
  }

  const data = await response.json() as ApiResponse<Vendor>;
  return data.data!;
}

/**
 * Request a quote from a vendor
 */
export async function requestQuote(vendorId: string, payload: QuoteRequest): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/vendors/${vendorId}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json() as ApiResponse;
    throw new Error(error.message || 'Failed to request quote');
  }

  const data = await response.json() as ApiResponse<{ success: boolean }>;
  return data.data!;
}
