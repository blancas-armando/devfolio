/**
 * Retry Logic Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, DEFAULT_RETRY_CONFIG, type RetryConfig } from './retry.js';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successful calls', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const resultPromise = withRetry(fn, DEFAULT_RETRY_CONFIG);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should succeed after retries', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('rate limit'))
        .mockRejectedValueOnce(new Error('rate limit'))
        .mockResolvedValue('success');

      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 4 };
      const resultPromise = withRetry(fn, config);

      // Process retries
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('failure handling', () => {
    it('should throw after max attempts exceeded', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('rate limit'));

      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 2 };
      const resultPromise = withRetry(fn, config);

      // Attach catch handler to prevent unhandled rejection warning
      let caughtError: Error | null = null;
      resultPromise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await vi.waitFor(() => expect(caughtError).not.toBeNull());

      expect(caughtError).not.toBeNull();
      expect(caughtError!.message).toBe('rate limit');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('401 unauthorized'));

      const resultPromise = withRetry(fn, DEFAULT_RETRY_CONFIG);

      let caughtError: Error | null = null;
      resultPromise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await vi.waitFor(() => expect(caughtError).not.toBeNull());

      expect(caughtError).not.toBeNull();
      expect(caughtError!.message).toBe('401 unauthorized');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry bad request errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('400 bad request'));

      const resultPromise = withRetry(fn, DEFAULT_RETRY_CONFIG);

      let caughtError: Error | null = null;
      resultPromise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await vi.waitFor(() => expect(caughtError).not.toBeNull());

      expect(caughtError).not.toBeNull();
      expect(caughtError!.message).toBe('400 bad request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry rate limit errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('429 too many requests'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, DEFAULT_RETRY_CONFIG);

      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry network errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, DEFAULT_RETRY_CONFIG);

      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('custom shouldRetry function', () => {
    it('should use custom retry logic', async () => {
      const customError = new Error('CUSTOM_ERROR');
      const fn = vi
        .fn()
        .mockRejectedValueOnce(customError)
        .mockResolvedValue('success');

      const customShouldRetry = (err: Error) => err.message === 'CUSTOM_ERROR';
      const resultPromise = withRetry(fn, DEFAULT_RETRY_CONFIG, customShouldRetry);

      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle maxAttempts of 1', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('rate limit'));

      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 1 };
      const resultPromise = withRetry(fn, config);

      let caughtError: Error | null = null;
      resultPromise.catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await vi.waitFor(() => expect(caughtError).not.toBeNull());

      expect(caughtError).not.toBeNull();
      expect(caughtError!.message).toBe('rate limit');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should preserve error type', async () => {
      class CustomError extends Error {
        constructor(public code: string) {
          super('Custom error');
        }
      }

      const fn = vi.fn().mockRejectedValue(new CustomError('ERR_001'));

      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 1 };
      const resultPromise = withRetry(fn, config);

      let caughtError: CustomError | null = null;
      resultPromise.catch((e) => {
        caughtError = e as CustomError;
      });

      await vi.runAllTimersAsync();
      await vi.waitFor(() => expect(caughtError).not.toBeNull());

      expect(caughtError).not.toBeNull();
      expect(caughtError).toBeInstanceOf(CustomError);
      expect(caughtError!.code).toBe('ERR_001');
    });
  });
});
