/**
 * Tests for AI Tool Validation Schemas
 */

import { describe, it, expect } from 'vitest';
import { validateToolArgs, isValidToolName, symbolSchema } from './schemas.js';

describe('Symbol Schema', () => {
  it('should accept valid stock symbols', () => {
    expect(symbolSchema.parse('AAPL')).toBe('AAPL');
    expect(symbolSchema.parse('msft')).toBe('MSFT'); // Transforms to uppercase
    expect(symbolSchema.parse('BRK.B')).toBe('BRK.B'); // Class shares
    expect(symbolSchema.parse('^VIX')).toBe('^VIX'); // Index
  });

  it('should reject invalid symbols', () => {
    expect(() => symbolSchema.parse('')).toThrow();
    expect(() => symbolSchema.parse('   ')).toThrow();
    expect(() => symbolSchema.parse('TOOLONGSYMBOL123')).toThrow();
  });
});

describe('isValidToolName', () => {
  it('should return true for valid tool names', () => {
    expect(isValidToolName('lookup_stock')).toBe(true);
    expect(isValidToolName('add_to_watchlist')).toBe(true);
    expect(isValidToolName('compare_stocks')).toBe(true);
  });

  it('should return false for invalid tool names', () => {
    expect(isValidToolName('invalid_tool')).toBe(false);
    expect(isValidToolName('')).toBe(false);
    expect(isValidToolName('LOOKUP_STOCK')).toBe(false); // Case sensitive
  });
});

describe('validateToolArgs', () => {
  describe('lookup_stock', () => {
    it('should validate valid arguments', () => {
      const result = validateToolArgs('lookup_stock', { symbol: 'AAPL' });
      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('AAPL');
    });

    it('should transform lowercase to uppercase', () => {
      const result = validateToolArgs('lookup_stock', { symbol: 'aapl' });
      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('AAPL');
    });

    it('should reject missing symbol', () => {
      const result = validateToolArgs('lookup_stock', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('symbol');
    });

    it('should reject empty symbol', () => {
      const result = validateToolArgs('lookup_stock', { symbol: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('add_to_watchlist', () => {
    it('should validate array of symbols', () => {
      const result = validateToolArgs('add_to_watchlist', { symbols: ['AAPL', 'MSFT'] });
      expect(result.success).toBe(true);
      expect(result.data?.symbols).toEqual(['AAPL', 'MSFT']);
    });

    it('should reject empty array', () => {
      const result = validateToolArgs('add_to_watchlist', { symbols: [] });
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one symbol');
    });
  });

  describe('add_holding', () => {
    it('should validate complete holding args', () => {
      const result = validateToolArgs('add_holding', {
        symbol: 'AAPL',
        shares: 10,
        cost_basis: 150.50,
      });
      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('AAPL');
      expect(result.data?.shares).toBe(10);
      expect(result.data?.cost_basis).toBe(150.50);
    });

    it('should reject negative shares', () => {
      const result = validateToolArgs('add_holding', {
        symbol: 'AAPL',
        shares: -10,
        cost_basis: 150.50,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('should reject negative cost basis', () => {
      const result = validateToolArgs('add_holding', {
        symbol: 'AAPL',
        shares: 10,
        cost_basis: -150.50,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('negative');
    });
  });

  describe('compare_stocks', () => {
    it('should validate 2-4 symbols', () => {
      const result = validateToolArgs('compare_stocks', { symbols: ['AAPL', 'MSFT'] });
      expect(result.success).toBe(true);
    });

    it('should reject single symbol', () => {
      const result = validateToolArgs('compare_stocks', { symbols: ['AAPL'] });
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least 2');
    });

    it('should reject more than 4 symbols', () => {
      const result = validateToolArgs('compare_stocks', {
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum 4');
    });
  });

  describe('show_dashboard', () => {
    it('should accept empty object', () => {
      const result = validateToolArgs('show_dashboard', {});
      expect(result.success).toBe(true);
    });
  });
});
