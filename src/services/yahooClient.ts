/**
 * Yahoo Finance Client Wrapper
 *
 * Unified client for Yahoo Finance API with:
 * - Rate limiting (via ratelimit.ts)
 * - Exponential backoff on 429 errors
 * - Structured logging
 * - Request deduplication
 *
 * Use this instead of direct yahoo-finance2 calls in services.
 */

import YahooFinance from 'yahoo-finance2';
import { loggers } from '../utils/logger.js';
import { rateLimitedCall, getThrottleDelay } from './ratelimit.js';
import { recordApiCall, recordError } from './stats.js';

// ═══════════════════════════════════════════════════════════════════════════
// Client Initialization
// ═══════════════════════════════════════════════════════════════════════════

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
});

const log = loggers.yahoo;

// ═══════════════════════════════════════════════════════════════════════════
// Retry Configuration
// ═══════════════════════════════════════════════════════════════════════════

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Calculate delay with exponential backoff
 */
function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Check if error is a rate limit (429) error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests');
  }
  return false;
}

/**
 * Check if error is retryable (network issues, 5xx, etc.)
 */
function isRetryableError(error: unknown): boolean {
  if (isRateLimitError(error)) return true;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('network') ||
      msg.includes('5') // 5xx errors
    );
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Request Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute a Yahoo Finance API call with rate limiting and retry
 */
async function yahooRequest<T>(
  operation: string,
  fn: () => Promise<T>,
  options: {
    essential?: boolean;
    dedupeKey?: string;
    symbol?: string;
    retryConfig?: Partial<RetryConfig>;
  } = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
  const opLog = log(operation, options.symbol);
  const start = Date.now();

  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Apply backoff delay after failed attempt
      if (attempt > 0) {
        const delay = getBackoffDelay(attempt - 1, config);
        opLog.debug(`Retry ${attempt}/${config.maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Execute with rate limiting
      const result = await rateLimitedCall(
        operation,
        async () => {
          const data = await fn();
          recordApiCall(operation, false, Date.now() - start);
          return data;
        },
        {
          essential: options.essential,
          dedupeKey: options.dedupeKey,
        }
      );

      if (attempt > 0) {
        opLog.info(`Succeeded after ${attempt} retries`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Log the error
      if (attempt < config.maxRetries && isRetryableError(error)) {
        opLog.warn(`Attempt ${attempt + 1} failed, will retry`, { attempt });
      } else {
        opLog.error(`Failed after ${attempt + 1} attempts`, error);
        recordError(error instanceof Error ? error.message : 'Unknown error');
      }

      // Don't retry non-retryable errors
      if (!isRetryableError(error)) {
        break;
      }
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API - Typed Wrappers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a stock quote
 */
export async function getQuote(
  symbol: string,
  options?: { essential?: boolean }
): Promise<Awaited<ReturnType<typeof yahooFinance.quote>>> {
  return yahooRequest('quote', () => yahooFinance.quote(symbol), {
    symbol,
    dedupeKey: `quote:${symbol}`,
    ...options,
  });
}

/**
 * Get multiple stock quotes
 */
export async function getQuotes(
  symbols: string[],
  options?: { essential?: boolean }
): Promise<Awaited<ReturnType<typeof yahooFinance.quote>>> {
  return yahooRequest('quote', () => yahooFinance.quote(symbols), {
    dedupeKey: `quotes:${symbols.sort().join(',')}`,
    ...options,
  });
}

/**
 * Get quote summary (detailed quote data)
 * Note: Use the raw client with quoteSummaryOptions for type-safe module access
 */
export async function getQuoteSummary(
  symbol: string,
  quoteSummaryOptions: Parameters<typeof yahooFinance.quoteSummary>[1],
  options?: { essential?: boolean }
): Promise<Awaited<ReturnType<typeof yahooFinance.quoteSummary>>> {
  const modules = quoteSummaryOptions?.modules;
  const modulesList = Array.isArray(modules) ? modules : [];
  return yahooRequest(
    'quoteSummary',
    () => yahooFinance.quoteSummary(symbol, quoteSummaryOptions),
    {
      symbol,
      dedupeKey: `summary:${symbol}:${modulesList.join(',')}`,
      ...options,
    }
  );
}

/**
 * Get historical chart data
 */
export async function getChart(
  symbol: string,
  queryOptions: Parameters<typeof yahooFinance.chart>[1],
  options?: { essential?: boolean }
): Promise<Awaited<ReturnType<typeof yahooFinance.chart>>> {
  return yahooRequest('chart', () => yahooFinance.chart(symbol, queryOptions), {
    symbol,
    ...options,
  });
}

/**
 * Search for symbols
 */
export async function search(
  query: string,
  options?: { essential?: boolean }
): Promise<Awaited<ReturnType<typeof yahooFinance.search>>> {
  return yahooRequest('search', () => yahooFinance.search(query), {
    dedupeKey: `search:${query}`,
    ...options,
  });
}

/**
 * Get trending symbols
 */
export async function getTrending(
  options?: { essential?: boolean }
): Promise<Awaited<ReturnType<typeof yahooFinance.trendingSymbols>>> {
  return yahooRequest(
    'trendingSymbols',
    () => yahooFinance.trendingSymbols('US', { count: 10 }),
    {
      dedupeKey: 'trending:US',
      ...options,
    }
  );
}

/**
 * Get options chain
 */
export async function getOptions(
  symbol: string,
  queryOptions?: Parameters<typeof yahooFinance.options>[1],
  options?: { essential?: boolean }
): Promise<Awaited<ReturnType<typeof yahooFinance.options>>> {
  return yahooRequest(
    'options',
    () => yahooFinance.options(symbol, queryOptions),
    {
      symbol,
      ...options,
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Raw Client Access (for advanced use)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the raw Yahoo Finance client
 * Use sparingly - prefer the typed wrappers above
 */
export function getRawClient(): typeof yahooFinance {
  return yahooFinance;
}

/**
 * Execute a custom operation with rate limiting and retry
 */
export async function withRateLimitAndRetry<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: {
    essential?: boolean;
    dedupeKey?: string;
    symbol?: string;
  }
): Promise<T> {
  return yahooRequest(operation, fn, options);
}

// Re-export rate limit utilities for convenience
export { getThrottleDelay } from './ratelimit.js';
