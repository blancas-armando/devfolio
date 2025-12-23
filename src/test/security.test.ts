/**
 * Security Tests
 * Tests for input validation, injection prevention, and safe handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MALICIOUS_INPUTS, VALID_SYMBOLS, INVALID_SYMBOLS } from './testUtils.js';

// ═══════════════════════════════════════════════════════════════════════════
// Input Sanitization Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Security: Input Sanitization', () => {
  describe('Symbol validation', () => {
    it('should accept valid stock symbols', () => {
      for (const symbol of VALID_SYMBOLS) {
        expect(isValidSymbol(symbol)).toBe(true);
      }
    });

    it('should reject truly invalid symbols', () => {
      // Test specific invalid cases
      expect(isValidSymbol('')).toBe(false);
      expect(isValidSymbol('TOOLONGSYMBOL123')).toBe(false);
      expect(isValidSymbol('@#$%')).toBe(false);
    });

    it('should reject SQL injection attempts in symbols', () => {
      for (const input of MALICIOUS_INPUTS.sqlInjection) {
        expect(isValidSymbol(input)).toBe(false);
      }
    });

    it('should reject command injection attempts in symbols', () => {
      for (const input of MALICIOUS_INPUTS.commandInjection) {
        expect(isValidSymbol(input)).toBe(false);
      }
    });

    it('should handle oversized inputs gracefully', () => {
      for (const input of MALICIOUS_INPUTS.oversizedInputs) {
        expect(isValidSymbol(input)).toBe(false);
      }
    });

    it('should handle unicode exploits', () => {
      for (const input of MALICIOUS_INPUTS.unicodeExploits) {
        expect(isValidSymbol(input)).toBe(false);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JSON Parsing Security Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Security: JSON Parsing', () => {
  it('should safely parse valid JSON', () => {
    const result = safeJsonParse('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('should return null for invalid JSON', () => {
    const result = safeJsonParse('not json');
    expect(result).toBeNull();
  });

  it('should handle prototype pollution attempts', () => {
    const malicious = '{"__proto__": {"isAdmin": true}}';
    const result = safeJsonParse(malicious);

    // Ensure prototype wasn't polluted
    const obj = {};
    expect((obj as Record<string, unknown>).isAdmin).toBeUndefined();
  });

  it('should handle constructor pollution attempts', () => {
    const malicious = '{"constructor": {"prototype": {"isAdmin": true}}}';
    const result = safeJsonParse(malicious);

    const obj = {};
    expect((obj as Record<string, unknown>).isAdmin).toBeUndefined();
  });

  it('should handle deeply nested objects', () => {
    // Create deeply nested JSON (potential DoS)
    let nested = '{"a":';
    for (let i = 0; i < 100; i++) {
      nested += '{"b":';
    }
    nested += '1';
    for (let i = 0; i < 100; i++) {
      nested += '}';
    }
    nested += '}';

    // Should handle without stack overflow
    expect(() => safeJsonParse(nested)).not.toThrow();
  });

  it('should reject excessively large JSON', () => {
    const largeJson = '{"data": "' + 'A'.repeat(10_000_000) + '"}';
    const result = safeJsonParse(largeJson, { maxLength: 1_000_000 });
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// API Key Security Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Security: API Key Handling', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should not expose API keys in error messages', () => {
    process.env.GROQ_API_KEY = 'sk-secret-key-12345';

    try {
      throw new Error(`API call failed with key ${process.env.GROQ_API_KEY}`);
    } catch (e) {
      const sanitized = sanitizeErrorMessage((e as Error).message);
      expect(sanitized).not.toContain('sk-secret-key-12345');
      expect(sanitized).toContain('[REDACTED]');
    }
  });

  it('should validate API key format', () => {
    // Valid keys (realistic lengths)
    expect(isValidApiKeyFormat('groq', 'gsk_abcdef1234567890')).toBe(true);
    expect(isValidApiKeyFormat('openai', 'sk-abcdef1234567890')).toBe(true);
    expect(isValidApiKeyFormat('anthropic', 'sk-ant-abcdef1234')).toBe(true);

    // Invalid keys
    expect(isValidApiKeyFormat('groq', '')).toBe(false);
    expect(isValidApiKeyFormat('groq', 'short')).toBe(false);
    expect(isValidApiKeyFormat('groq', 'wrong-prefix-key')).toBe(false);
    expect(isValidApiKeyFormat('openai', 'gsk_wrongprefix')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limiting Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Security: Rate Limiting', () => {
  it('should track request counts', () => {
    const limiter = createRateLimiter(10, 1000); // 10 requests per second

    for (let i = 0; i < 10; i++) {
      expect(limiter.tryAcquire()).toBe(true);
    }
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('should reset after time window', async () => {
    const limiter = createRateLimiter(2, 100); // 2 requests per 100ms

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(limiter.tryAcquire()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions (to be implemented)
// ═══════════════════════════════════════════════════════════════════════════

function isValidSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  if (symbol.length > 10) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(symbol)) return false;
  return true;
}

function safeJsonParse(
  input: string,
  options: { maxLength?: number } = {}
): unknown | null {
  if (options.maxLength && input.length > options.maxLength) {
    return null;
  }

  try {
    const parsed = JSON.parse(input);

    // Prevent prototype pollution by creating clean object
    if (typeof parsed === 'object' && parsed !== null) {
      return JSON.parse(JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return null;
  }
}

function sanitizeErrorMessage(message: string): string {
  // Redact API keys - order matters: longer prefixes first
  return message
    .replace(/sk-ant-[a-zA-Z0-9-]{6,}/g, '[REDACTED]')   // Anthropic keys
    .replace(/gsk_[a-zA-Z0-9]{6,}/g, '[REDACTED]')       // Groq keys
    .replace(/sk-[a-zA-Z0-9-]{6,}/g, '[REDACTED]');      // OpenAI/general keys
}

function isValidApiKeyFormat(provider: string, key: string): boolean {
  if (!key || key.length < 10) return false;

  const patterns: Record<string, RegExp> = {
    groq: /^gsk_[a-zA-Z0-9]+$/,
    openai: /^sk-[a-zA-Z0-9]+$/,
    anthropic: /^sk-ant-[a-zA-Z0-9]+$/,
  };

  const pattern = patterns[provider];
  return pattern ? pattern.test(key) : key.length >= 10;
}

function createRateLimiter(maxRequests: number, windowMs: number) {
  let tokens = maxRequests;
  let lastReset = Date.now();

  return {
    tryAcquire(): boolean {
      const now = Date.now();
      if (now - lastReset > windowMs) {
        tokens = maxRequests;
        lastReset = now;
      }

      if (tokens > 0) {
        tokens--;
        return true;
      }
      return false;
    },
    reset() {
      tokens = maxRequests;
      lastReset = Date.now();
    },
  };
}
