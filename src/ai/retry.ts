/**
 * Retry logic with exponential backoff
 * Used by all AI providers for resilient API calls
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if an error is retryable (network issues, rate limits, server errors)
 */
function isRetryableError(error: Error): boolean {
  const msg = error.message.toLowerCase();

  // Rate limits - retryable
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return true;
  }

  // Network errors - retryable
  if (
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('socket')
  ) {
    return true;
  }

  // Server errors (5xx) - retryable
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
    return true;
  }

  // Auth errors - NOT retryable
  if (msg.includes('401') || msg.includes('403') || msg.includes('api key') || msg.includes('unauthorized')) {
    return false;
  }

  // Bad request - NOT retryable
  if (msg.includes('400') || msg.includes('bad request') || msg.includes('invalid')) {
    return false;
  }

  return false;
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry: (error: Error) => boolean = isRetryableError
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt or non-retryable errors
      if (attempt === config.maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Wait before retry with jitter to avoid thundering herd
      const jitter = Math.random() * 100;
      await sleep(delay + jitter);

      // Exponential backoff capped at max delay
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError ?? new Error('Retry failed');
}
