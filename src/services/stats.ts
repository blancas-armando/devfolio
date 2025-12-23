/**
 * Stats Tracking Service
 *
 * Tracks API usage, cache performance, and session metrics
 * for debugging and rate limit awareness.
 */

interface ApiCallRecord {
  endpoint: string;
  timestamp: number;
  cached: boolean;
  duration?: number;
}

interface Stats {
  sessionStart: number;
  apiCalls: {
    total: number;
    cached: number;
    byEndpoint: Record<string, number>;
    recent: ApiCallRecord[];
  };
  rateLimit: {
    remaining: number | null;
    resetAt: number | null;
    warnings: number;
  };
  errors: {
    total: number;
    recent: Array<{ message: string; timestamp: number }>;
  };
}

// Global stats object
const stats: Stats = {
  sessionStart: Date.now(),
  apiCalls: {
    total: 0,
    cached: 0,
    byEndpoint: {},
    recent: [],
  },
  rateLimit: {
    remaining: null,
    resetAt: null,
    warnings: 0,
  },
  errors: {
    total: 0,
    recent: [],
  },
};

// Max recent items to keep
const MAX_RECENT = 50;

/**
 * Record an API call
 */
export function recordApiCall(endpoint: string, cached: boolean = false, duration?: number): void {
  stats.apiCalls.total++;
  if (cached) stats.apiCalls.cached++;

  // Track by endpoint
  const key = endpoint.split('?')[0]; // Remove query params
  stats.apiCalls.byEndpoint[key] = (stats.apiCalls.byEndpoint[key] || 0) + 1;

  // Add to recent
  stats.apiCalls.recent.push({
    endpoint: key,
    timestamp: Date.now(),
    cached,
    duration,
  });

  // Trim recent if too long
  if (stats.apiCalls.recent.length > MAX_RECENT) {
    stats.apiCalls.recent = stats.apiCalls.recent.slice(-MAX_RECENT);
  }
}

/**
 * Record a cache hit (convenience method)
 */
export function recordCacheHit(endpoint: string): void {
  recordApiCall(endpoint, true);
}

/**
 * Record a rate limit warning
 */
export function recordRateLimitWarning(remaining?: number, resetAt?: number): void {
  stats.rateLimit.warnings++;
  if (remaining !== undefined) stats.rateLimit.remaining = remaining;
  if (resetAt !== undefined) stats.rateLimit.resetAt = resetAt;
}

/**
 * Record an error
 */
export function recordError(message: string): void {
  stats.errors.total++;
  stats.errors.recent.push({
    message,
    timestamp: Date.now(),
  });

  // Trim recent errors
  if (stats.errors.recent.length > 20) {
    stats.errors.recent = stats.errors.recent.slice(-20);
  }
}

/**
 * Get current stats
 */
export function getStats(): Stats {
  return { ...stats };
}

/**
 * Get formatted stats summary
 */
export function getStatsSummary(): {
  sessionDuration: string;
  totalCalls: number;
  cacheHitRate: string;
  callsPerMinute: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  recentErrors: Array<{ message: string; ago: string }>;
  rateLimitWarnings: number;
} {
  const now = Date.now();
  const sessionMs = now - stats.sessionStart;
  const sessionMinutes = sessionMs / 60000;

  // Format duration
  const hours = Math.floor(sessionMs / 3600000);
  const minutes = Math.floor((sessionMs % 3600000) / 60000);
  const seconds = Math.floor((sessionMs % 60000) / 1000);
  const sessionDuration = hours > 0
    ? `${hours}h ${minutes}m`
    : minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  // Cache hit rate
  const cacheHitRate = stats.apiCalls.total > 0
    ? `${((stats.apiCalls.cached / stats.apiCalls.total) * 100).toFixed(1)}%`
    : 'N/A';

  // Calls per minute
  const callsPerMinute = sessionMinutes > 0
    ? Math.round(stats.apiCalls.total / sessionMinutes)
    : stats.apiCalls.total;

  // Top endpoints
  const topEndpoints = Object.entries(stats.apiCalls.byEndpoint)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent errors with time ago
  const recentErrors = stats.errors.recent.slice(-5).map(e => {
    const agoMs = now - e.timestamp;
    const agoMinutes = Math.floor(agoMs / 60000);
    const ago = agoMinutes > 0 ? `${agoMinutes}m ago` : 'just now';
    return { message: e.message.slice(0, 50), ago };
  });

  return {
    sessionDuration,
    totalCalls: stats.apiCalls.total,
    cacheHitRate,
    callsPerMinute,
    topEndpoints,
    recentErrors,
    rateLimitWarnings: stats.rateLimit.warnings,
  };
}

/**
 * Get calls in the last minute (for rate limit checking)
 */
export function getCallsLastMinute(): number {
  const oneMinuteAgo = Date.now() - 60000;
  return stats.apiCalls.recent.filter(c => c.timestamp > oneMinuteAgo && !c.cached).length;
}

/**
 * Check if we're approaching rate limit
 */
export function isApproachingRateLimit(threshold: number = 80): boolean {
  const callsLastMinute = getCallsLastMinute();
  return callsLastMinute >= threshold;
}

/**
 * Reset stats (for testing)
 */
export function resetStats(): void {
  stats.sessionStart = Date.now();
  stats.apiCalls = { total: 0, cached: 0, byEndpoint: {}, recent: [] };
  stats.rateLimit = { remaining: null, resetAt: null, warnings: 0 };
  stats.errors = { total: 0, recent: [] };
}
