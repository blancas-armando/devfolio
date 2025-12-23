/**
 * Market Service Client
 *
 * Yahoo Finance client initialization, caching utilities,
 * and API call tracking.
 */

import YahooFinance from 'yahoo-finance2';
import { recordApiCall, recordCacheHit, recordError } from '../stats.js';
import {
  rateLimitedCall,
  getRefreshMultiplier,
  getRateLimitStatus,
  shouldThrottle,
} from '../ratelimit.js';

// ═══════════════════════════════════════════════════════════════════════════
// Yahoo Finance Client
// ═══════════════════════════════════════════════════════════════════════════

export const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
});

// ═══════════════════════════════════════════════════════════════════════════
// In-Memory Cache
// ═══════════════════════════════════════════════════════════════════════════

const cache = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  recordCacheHit(key);
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export function clearCache(): void {
  cache.clear();
}

// ═══════════════════════════════════════════════════════════════════════════
// API Call Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wrapper to track API calls with rate limiting
 */
export async function trackedApiCall<T>(
  endpoint: string,
  fn: () => Promise<T>,
  options: { essential?: boolean; dedupeKey?: string } = {}
): Promise<T> {
  const start = Date.now();
  try {
    const result = await rateLimitedCall(
      endpoint,
      async () => {
        const data = await fn();
        recordApiCall(endpoint, false, Date.now() - start);
        return data;
      },
      options
    );
    return result;
  } catch (error) {
    recordError(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Re-export rate limit utilities for use by other modules
export { getRefreshMultiplier, getRateLimitStatus, shouldThrottle };
