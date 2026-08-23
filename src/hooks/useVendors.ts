/**
 * @file useVendors.ts
 * @description Custom React hook for Vendors state management and API integration
 */

import { useState, useCallback, useEffect } from 'react';
import { Vendor, VendorExtendedSearchParams, PaginatedResponse } from '../shared/types';
import { searchVendors as fetchVendors } from '../services/vendor.api';

interface UseVendorsState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse<Vendor>['pagination'] | null;
}

interface UseVendorsActions {
  search: (params?: Partial<VendorExtendedSearchParams>) => Promise<void>;
  reset: () => void;
}

export function useVendors(): UseVendorsState & UseVendorsActions {
  const [state, setState] = useState<UseVendorsState>({
    vendors: [],
    loading: false,
    error: null,
    pagination: null,
  });

  const search = useCallback(async (params?: Partial<VendorExtendedSearchParams>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchVendors(params);
      setState((prev) => ({
        ...prev,
        vendors: data.items,
        pagination: data.pagination,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      vendors: [],
      loading: false,
      error: null,
      pagination: null,
    });
  }, []);

  // Load initial vendors on mount
  useEffect(() => {
    search();
  }, [search]);

  return {
    ...state,
    search,
    reset,
  };
}
