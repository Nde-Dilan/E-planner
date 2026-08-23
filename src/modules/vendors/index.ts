/**
 * @file index.ts
 * @description Barrel export for the vendors module.
 *              Re-exports all public APIs (router, services, stores, and interfaces)
 *              allowing external modules to import from a single entry point.
 *
 * Usage:
 *  import { vendorRouter, vendorService, quoteService } from '@modules/vendors';
 */

// Router (default export)
export { default as vendorRouter } from './vendor.router';

// Router exports (rate limiters)
export { globalVendorLimiter, quoteLimiter } from './vendor.router';

// Services and interfaces
export { vendorService, IVendorService } from './vendor.service';
export { quoteService, IQuoteService } from './quote.service';

// Stores and interfaces
export { vendorStore, IVendorStore } from './vendor.store';
export { quoteStore, IQuoteStore } from './quote.store';
