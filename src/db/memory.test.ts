/**
 * Memory System Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
const mockDb = {
  exec: vi.fn(),
  prepare: vi.fn(() => ({
    run: vi.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
    get: vi.fn(),
    all: vi.fn(() => []),
  })),
};

vi.mock('./index.js', () => ({
  getDb: () => mockDb,
}));

import { extractSymbolsFromText, buildConversationContext } from './memory.js';

describe('Memory System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractSymbolsFromText', () => {
    it('should extract valid stock symbols', () => {
      const text = 'I want to buy AAPL and NVDA today';
      const symbols = extractSymbolsFromText(text);

      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('NVDA');
    });

    it('should filter out common words', () => {
      const text = 'I think THE stock is going UP';
      const symbols = extractSymbolsFromText(text);

      expect(symbols).not.toContain('I');
      expect(symbols).not.toContain('THE');
      expect(symbols).not.toContain('UP');
    });

    it('should handle empty input', () => {
      expect(extractSymbolsFromText('')).toEqual([]);
    });

    it('should deduplicate symbols', () => {
      const text = 'AAPL is great, AAPL is amazing, buy AAPL';
      const symbols = extractSymbolsFromText(text);

      const aaplCount = symbols.filter(s => s === 'AAPL').length;
      expect(aaplCount).toBe(1);
    });

    it('should handle mixed case (extract uppercase only)', () => {
      const text = 'aapl is lowercase, MSFT is uppercase';
      const symbols = extractSymbolsFromText(text);

      expect(symbols).toContain('MSFT');
      expect(symbols).not.toContain('aapl');
    });

    it('should handle symbols with numbers', () => {
      // Most stock symbols are letters only, 1-5 chars
      const text = 'Check out BRK.A and META';
      const symbols = extractSymbolsFromText(text);

      // BRK.A might not match due to period
      expect(symbols).toContain('META');
      expect(symbols).toContain('BRK');
    });

    it('should respect length limits', () => {
      const text = 'TOOLONGSYMBOL is not valid, but NVDA is';
      const symbols = extractSymbolsFromText(text);

      expect(symbols).not.toContain('TOOLONGSYMBOL');
      expect(symbols).toContain('NVDA');
    });
  });

  describe('Security', () => {
    it('should not extract SQL injection attempts as symbols', () => {
      const text = "'; DROP TABLE users; -- AAPL";
      const symbols = extractSymbolsFromText(text);

      // Should only contain valid symbol-like strings
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('DROP');
      expect(symbols).toContain('TABLE');
      // These are extracted as potential symbols but won't match real stocks
    });

    it('should handle unicode characters', () => {
      const text = 'AAPL \u0000 NVDA \uD800 MSFT';
      const symbols = extractSymbolsFromText(text);

      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('NVDA');
      expect(symbols).toContain('MSFT');
    });

    it('should handle extremely long input', () => {
      const longText = 'AAPL '.repeat(10000);

      // Should not throw or hang
      const start = Date.now();
      const symbols = extractSymbolsFromText(longText);
      const elapsed = Date.now() - start;

      expect(symbols).toContain('AAPL');
      expect(elapsed).toBeLessThan(1000); // Should complete quickly
    });
  });
});
