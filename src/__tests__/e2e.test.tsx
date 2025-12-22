/**
 * E2E Tests for Critical Paths
 *
 * Tests the core user flows:
 * 1. Stock lookup flow
 * 2. Portfolio add/remove flow
 * 3. Watchlist management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { initializeSchema } from '../db/schema.js';

// Mock the database module to use in-memory DB
let memDb: Database.Database;

vi.mock('../db/index.js', () => ({
  getDb: () => memDb,
  closeDb: () => memDb?.close(),
}));

// Create fresh in-memory DB before each test
beforeEach(() => {
  memDb = new Database(':memory:');
  initializeSchema(memDb);
});

afterEach(() => {
  memDb?.close();
});

// ═══════════════════════════════════════════════════════════════════════════
// Database Operations Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('E2E: Watchlist Management', () => {
  it('should add a symbol to watchlist', async () => {
    const { addToWatchlist, getWatchlist } = await import('../db/watchlist.js');

    // Initially empty
    expect(getWatchlist()).toHaveLength(0);

    // Add a symbol
    addToWatchlist(['AAPL']);

    // Should now have one item
    const watchlist = getWatchlist();
    expect(watchlist).toHaveLength(1);
    expect(watchlist).toContain('AAPL');
  });

  it('should add multiple symbols to watchlist', async () => {
    const { addToWatchlist, getWatchlist } = await import('../db/watchlist.js');

    addToWatchlist(['AAPL', 'MSFT', 'GOOGL']);

    const watchlist = getWatchlist();
    expect(watchlist).toHaveLength(3);
    expect(watchlist).toContain('AAPL');
    expect(watchlist).toContain('MSFT');
    expect(watchlist).toContain('GOOGL');
  });

  it('should remove a symbol from watchlist', async () => {
    const { addToWatchlist, removeFromWatchlist, getWatchlist } = await import('../db/watchlist.js');

    addToWatchlist(['AAPL', 'MSFT']);
    expect(getWatchlist()).toHaveLength(2);

    removeFromWatchlist(['AAPL']); // Takes an array

    const watchlist = getWatchlist();
    expect(watchlist).toHaveLength(1);
    expect(watchlist).not.toContain('AAPL');
    expect(watchlist).toContain('MSFT');
  });

  it('should not duplicate symbols in watchlist', async () => {
    const { addToWatchlist, getWatchlist } = await import('../db/watchlist.js');

    addToWatchlist(['AAPL']);
    addToWatchlist(['AAPL']); // Try to add again

    expect(getWatchlist()).toHaveLength(1);
  });

  it('should handle removing non-existent symbol gracefully', async () => {
    const { removeFromWatchlist, getWatchlist } = await import('../db/watchlist.js');

    // Should not throw
    removeFromWatchlist(['NONEXISTENT']);
    expect(getWatchlist()).toHaveLength(0);
  });
});

describe('E2E: Portfolio Management', () => {
  it('should add a holding to portfolio', async () => {
    const { addHolding, getHoldings } = await import('../db/portfolio.js');

    addHolding('AAPL', 10, 150.00);

    const holdings = getHoldings();
    expect(holdings).toHaveLength(1);
    expect(holdings[0].symbol).toBe('AAPL');
    expect(holdings[0].shares).toBe(10);
    expect(holdings[0].costBasis).toBe(150.00);
  });

  it('should add multiple holdings', async () => {
    const { addHolding, getHoldings } = await import('../db/portfolio.js');

    addHolding('AAPL', 10, 150.00);
    addHolding('MSFT', 5, 300.00);

    const holdings = getHoldings();
    expect(holdings).toHaveLength(2);
  });

  it('should remove a holding by id', async () => {
    const { addHolding, removeHolding, getHoldings } = await import('../db/portfolio.js');

    addHolding('AAPL', 10, 150.00);
    const holdings = getHoldings();
    const holdingId = holdings[0].id!;

    removeHolding(holdingId);

    expect(getHoldings()).toHaveLength(0);
  });

  it('should update a holding', async () => {
    const { addHolding, updateHolding, getHoldings } = await import('../db/portfolio.js');

    addHolding('AAPL', 10, 150.00);
    const holdings = getHoldings();
    const holdingId = holdings[0].id!;

    updateHolding(holdingId, 20, 155.00);

    const updated = getHoldings()[0];
    expect(updated.shares).toBe(20);
    expect(updated.costBasis).toBe(155.00);
  });
});

describe('E2E: Quote Cache (Offline Support)', () => {
  it('should cache quotes persistently', async () => {
    const { cacheQuote, getCachedQuote } = await import('../db/quoteCache.js');

    const quote = {
      symbol: 'AAPL',
      price: 180.50,
      change: 2.30,
      changePercent: 1.29,
      volume: 50000000,
    };

    cacheQuote(quote);

    const cached = getCachedQuote('AAPL');
    expect(cached).not.toBeNull();
    expect(cached?.symbol).toBe('AAPL');
    expect(cached?.price).toBe(180.50);
    expect(cached?.cachedAt).toBeInstanceOf(Date);
  });

  it('should batch cache multiple quotes', async () => {
    const { cacheQuotes, getCachedQuotes } = await import('../db/quoteCache.js');

    const quotes = [
      { symbol: 'AAPL', price: 180.50, change: 2.30, changePercent: 1.29, volume: 50000000 },
      { symbol: 'MSFT', price: 375.20, change: -1.50, changePercent: -0.40, volume: 30000000 },
    ];

    cacheQuotes(quotes);

    const cached = getCachedQuotes(['AAPL', 'MSFT']);
    expect(cached).toHaveLength(2);
  });

  it('should return null for non-existent cache entry', async () => {
    const { getCachedQuote } = await import('../db/quoteCache.js');

    const cached = getCachedQuote('NONEXISTENT');
    expect(cached).toBeNull();
  });
});

describe('E2E: Command History', () => {
  it('should add commands to history', async () => {
    const { addToHistory, getHistory } = await import('../db/history.js');

    addToHistory('s AAPL');
    addToHistory('brief');
    addToHistory('news');

    const history = getHistory(10);
    expect(history).toHaveLength(3);
    // All commands should be in history
    const commands = history.map(h => h.command);
    expect(commands).toContain('s AAPL');
    expect(commands).toContain('brief');
    expect(commands).toContain('news');
  });

  it('should limit history results', async () => {
    const { addToHistory, getHistory } = await import('../db/history.js');

    for (let i = 0; i < 20; i++) {
      addToHistory(`command-${i}`);
    }

    const history = getHistory(5);
    expect(history).toHaveLength(5);
  });

  it('should search history', async () => {
    const { addToHistory, searchHistory } = await import('../db/history.js');

    addToHistory('s AAPL');
    addToHistory('s MSFT');
    addToHistory('brief');
    addToHistory('news AAPL');

    const results = searchHistory('AAPL');
    expect(results).toHaveLength(2);
  });

  it('should clear history', async () => {
    const { addToHistory, clearAllHistory, getHistory } = await import('../db/history.js');

    addToHistory('s AAPL');
    addToHistory('brief');

    clearAllHistory();

    expect(getHistory(10)).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Prompt Library Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('E2E: Prompt Generation', () => {
  it('should generate stock comparison prompt with data', async () => {
    const { buildStockComparisonPrompt } = await import('../ai/promptLibrary.js');

    const stocksData = `AAPL (Apple Inc):
- Price: $180.50 (+1.29%)
- Market Cap: $2800B
- P/E: 28.5`;

    const prompt = buildStockComparisonPrompt(stocksData);

    expect(prompt).toContain('AAPL');
    expect(prompt).toContain('Apple');
    expect(prompt).toContain('180.50');
    expect(prompt).toContain('TASK:');
    expect(prompt).toContain('RESPONSE SCHEMA');
  });

  it('should generate filing summary prompt', async () => {
    const { buildFilingSummaryPrompt } = await import('../ai/promptLibrary.js');

    const prompt = buildFilingSummaryPrompt(
      'AAPL',
      '10-K',
      '2024-01-15',
      'Filing content here...'
    );

    expect(prompt).toContain('AAPL');
    expect(prompt).toContain('10-K');
    expect(prompt).toContain('2024-01-15');
    expect(prompt).toContain('Filing content here');
  });

  it('should generate why prompt with correct intensity', async () => {
    const { buildWhyPrompt } = await import('../ai/promptLibrary.js');

    // < 1%: slightly, 1-3%: moderately, 3-5%: significantly, >= 5%: sharply
    const mildPrompt = buildWhyPrompt('AAPL', 'Apple Inc', 1.5, 'data', 'news');
    expect(mildPrompt).toContain('moderately');

    const strongPrompt = buildWhyPrompt('AAPL', 'Apple Inc', 6.0, 'data', 'news');
    expect(strongPrompt).toContain('sharply');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Utility Function Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('E2E: Natural Language Detection', () => {
  it('should detect natural language questions', async () => {
    const { isNaturalLanguageInput } = await import('../utils/fuzzy.js');

    expect(isNaturalLanguageInput('why is tech sector up?')).toBe(true);
    expect(isNaturalLanguageInput('what stocks should I buy')).toBe(true);
    expect(isNaturalLanguageInput('how do I add to watchlist')).toBe(true);
    expect(isNaturalLanguageInput('is AAPL a good buy')).toBe(true);
  });

  it('should not detect commands as natural language', async () => {
    const { isNaturalLanguageInput } = await import('../utils/fuzzy.js');

    expect(isNaturalLanguageInput('s AAPL')).toBe(false);
    expect(isNaturalLanguageInput('brief')).toBe(false);
    expect(isNaturalLanguageInput('add AAPL')).toBe(false);
  });

  it('should handle why command vs why question', async () => {
    const { isNaturalLanguageInput } = await import('../utils/fuzzy.js');

    // "why AAPL" is a command
    expect(isNaturalLanguageInput('why AAPL')).toBe(false);

    // "why is AAPL up" is natural language
    expect(isNaturalLanguageInput('why is AAPL up')).toBe(true);
  });
});

describe('E2E: Command Suggestions', () => {
  it('should suggest similar commands for typos', async () => {
    const { findSimilarCommands, KNOWN_COMMANDS } = await import('../utils/fuzzy.js');

    const suggestions = findSimilarCommands('breif', KNOWN_COMMANDS, 2);
    expect(suggestions).toContain('brief');
  });

  it('should return empty for very different input', async () => {
    const { findSimilarCommands, KNOWN_COMMANDS } = await import('../utils/fuzzy.js');

    const suggestions = findSimilarCommands('xyzabc', KNOWN_COMMANDS, 2);
    expect(suggestions).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JSON Extraction Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('E2E: JSON Extraction from AI Responses', () => {
  it('should extract JSON from markdown code blocks', async () => {
    const { extractJson } = await import('../ai/json.js');

    const response = `Here is my analysis:

\`\`\`json
{
  "symbol": "AAPL",
  "recommendation": "buy",
  "confidence": 0.85
}
\`\`\`

This is my reasoning...`;

    const isValid = (obj: unknown): obj is { symbol: string } =>
      typeof obj === 'object' && obj !== null && 'symbol' in obj;

    const result = extractJson<{ symbol: string }>(response, isValid);
    expect(result.success).toBe(true);
    expect(result.data?.symbol).toBe('AAPL');
  });

  it('should extract JSON from raw response', async () => {
    const { extractJson } = await import('../ai/json.js');

    const response = `{"symbol": "AAPL", "price": 180.50}`;

    const isValid = (obj: unknown): obj is { symbol: string; price: number } =>
      typeof obj === 'object' && obj !== null && 'symbol' in obj && 'price' in obj;

    const result = extractJson<{ symbol: string; price: number }>(response, isValid);
    expect(result.success).toBe(true);
    expect(result.data?.price).toBe(180.50);
  });

  it('should handle invalid JSON gracefully', async () => {
    const { extractJson } = await import('../ai/json.js');

    const response = `This is not JSON at all`;

    const isValid = (obj: unknown): obj is { symbol: string } =>
      typeof obj === 'object' && obj !== null && 'symbol' in obj;

    const result = extractJson<{ symbol: string }>(response, isValid);
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Format Utilities Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('E2E: Formatting Utilities', () => {
  it('should format currency correctly', async () => {
    const { formatCurrency } = await import('../utils/format.js');

    expect(formatCurrency(180.50)).toBe('$180.50');
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format percentages correctly', async () => {
    const { formatPercent } = await import('../utils/format.js');

    expect(formatPercent(1.5)).toBe('+1.50%');
    expect(formatPercent(-2.3)).toBe('-2.30%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('should format large numbers correctly', async () => {
    const { formatLargeNumber } = await import('../utils/format.js');

    expect(formatLargeNumber(1000000000)).toBe('1.00B');
    expect(formatLargeNumber(1500000)).toBe('1.50M');
    expect(formatLargeNumber(1000)).toBe('1.00K');
  });
});
