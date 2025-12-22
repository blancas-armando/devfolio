/**
 * Rate Limiter Service
 *
 * Prevents API rate limit errors by:
 * 1. Tracking calls per minute
 * 2. Throttling when approaching limits
 * 3. Deduplicating concurrent requests
 * 4. Providing adaptive refresh recommendations
 */

// Yahoo Finance unofficial limits
const RATE_LIMIT_PER_MINUTE = 100;
const WARNING_THRESHOLD = 70;  // Start slowing down at 70%
const CRITICAL_THRESHOLD = 85; // Heavy throttling at 85%
const HARD_LIMIT = 95;         // Block non-essential calls at 95%

// Tracking
interface CallRecord {
  timestamp: number;
  endpoint: string;
}

const recentCalls: CallRecord[] = [];
const pendingRequests = new Map<string, Promise<unknown>>();

// Listeners for rate limit events
type RateLimitListener = (callsPerMinute: number, pctUsed: number) => void;
const listeners: RateLimitListener[] = [];

/**
 * Get current calls per minute
 */
export function getCallsPerMinute(): number {
  const oneMinuteAgo = Date.now() - 60_000;
  // Clean old entries
  while (recentCalls.length > 0 && recentCalls[0].timestamp < oneMinuteAgo) {
    recentCalls.shift();
  }
  return recentCalls.length;
}

/**
 * Get rate limit percentage used (0-100)
 */
export function getRateLimitPercent(): number {
  return Math.round((getCallsPerMinute() / RATE_LIMIT_PER_MINUTE) * 100);
}

/**
 * Check if we should throttle
 */
export function shouldThrottle(): boolean {
  return getRateLimitPercent() >= WARNING_THRESHOLD;
}

/**
 * Check if we should block non-essential requests
 */
export function shouldBlock(): boolean {
  return getRateLimitPercent() >= HARD_LIMIT;
}

/**
 * Get recommended delay before next request (ms)
 */
export function getThrottleDelay(): number {
  const pct = getRateLimitPercent();
  if (pct < WARNING_THRESHOLD) return 0;
  if (pct < CRITICAL_THRESHOLD) return 500;  // 500ms delay
  if (pct < HARD_LIMIT) return 2000;         // 2s delay
  return 5000;                                // 5s delay when at limit
}

/**
 * Record an API call
 */
export function recordCall(endpoint: string): void {
  recentCalls.push({
    timestamp: Date.now(),
    endpoint,
  });

  // Notify listeners
  const pct = getRateLimitPercent();
  listeners.forEach(fn => fn(getCallsPerMinute(), pct));
}

/**
 * Subscribe to rate limit changes
 */
export function onRateLimitChange(fn: RateLimitListener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * Get recommended refresh interval based on current rate usage
 * Returns multiplier (1 = normal, 2 = double interval, etc.)
 */
export function getRefreshMultiplier(): number {
  const pct = getRateLimitPercent();
  if (pct < WARNING_THRESHOLD) return 1;
  if (pct < CRITICAL_THRESHOLD) return 2;
  if (pct < HARD_LIMIT) return 4;
  return 8; // Aggressive slowdown at hard limit
}

/**
 * Deduplicate concurrent requests for the same resource
 * If a request for the same key is in flight, return that promise
 */
export async function dedupeRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if request is already in flight
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // Create new request
  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Wrap an API call with rate limiting
 * - Records the call
 * - Applies throttle delays
 * - Blocks if at hard limit (optional)
 */
export async function rateLimitedCall<T>(
  endpoint: string,
  fn: () => Promise<T>,
  options: {
    essential?: boolean;  // If true, never block even at hard limit
    dedupeKey?: string;   // If provided, deduplicate concurrent requests
  } = {}
): Promise<T> {
  const { essential = false, dedupeKey } = options;

  // Block non-essential calls at hard limit
  if (!essential && shouldBlock()) {
    throw new Error('Rate limit approaching - request blocked. Try again in a moment.');
  }

  // Apply throttle delay
  const delay = getThrottleDelay();
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Execute with deduplication if key provided
  const execute = async () => {
    recordCall(endpoint);
    return fn();
  };

  if (dedupeKey) {
    return dedupeRequest(dedupeKey, execute);
  }

  return execute();
}

/**
 * Get human-readable rate limit status
 */
export function getRateLimitStatus(): {
  callsPerMinute: number;
  limit: number;
  percentUsed: number;
  status: 'ok' | 'warning' | 'critical' | 'blocked';
  message: string;
} {
  const calls = getCallsPerMinute();
  const pct = getRateLimitPercent();

  let status: 'ok' | 'warning' | 'critical' | 'blocked';
  let message: string;

  if (pct < WARNING_THRESHOLD) {
    status = 'ok';
    message = 'API usage normal';
  } else if (pct < CRITICAL_THRESHOLD) {
    status = 'warning';
    message = 'Approaching rate limit - requests slowing';
  } else if (pct < HARD_LIMIT) {
    status = 'critical';
    message = 'Near rate limit - heavy throttling active';
  } else {
    status = 'blocked';
    message = 'At rate limit - non-essential requests blocked';
  }

  return {
    callsPerMinute: calls,
    limit: RATE_LIMIT_PER_MINUTE,
    percentUsed: pct,
    status,
    message,
  };
}

/**
 * Calculate optimal batch size based on current rate usage
 * Useful for batching multiple symbol requests
 */
export function getOptimalBatchSize(requested: number): number {
  const pct = getRateLimitPercent();
  const remaining = RATE_LIMIT_PER_MINUTE - getCallsPerMinute();

  // Leave headroom for other operations
  const available = Math.max(1, Math.floor(remaining * 0.5));

  // Also consider throttle status
  if (pct >= HARD_LIMIT) return Math.min(5, requested);
  if (pct >= CRITICAL_THRESHOLD) return Math.min(10, requested);
  if (pct >= WARNING_THRESHOLD) return Math.min(20, requested);

  return Math.min(available, requested);
}

// Export constants for use in other modules
export const RATE_LIMITS = {
  perMinute: RATE_LIMIT_PER_MINUTE,
  warningThreshold: WARNING_THRESHOLD,
  criticalThreshold: CRITICAL_THRESHOLD,
  hardLimit: HARD_LIMIT,
} as const;
