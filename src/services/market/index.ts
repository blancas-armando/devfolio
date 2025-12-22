/**
 * Market Module
 *
 * Infrastructure utilities for the market service.
 * Types and functions remain in the parent market.ts for now.
 * This module provides shared client and cache utilities.
 */

// Re-export client utilities
export {
  yahooFinance,
  getCached,
  setCache,
  clearCache,
  trackedApiCall,
  getRefreshMultiplier,
  getRateLimitStatus,
  shouldThrottle,
} from './client.js';

// Note: Types and main functions remain in ../market.ts
// Full modularization will be done incrementally
