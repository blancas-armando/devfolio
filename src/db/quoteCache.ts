/**
 * Quote Cache
 * Persistent storage for quotes, enabling offline viewing
 */

import { getDb } from './index.js';
import type { Quote } from '../types/index.js';

export interface CachedQuote extends Quote {
  cachedAt: Date;
  isStale: boolean;
}

// Quotes older than 4 hours are considered stale
const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000;

/**
 * Save a quote to persistent cache
 */
export function cacheQuote(quote: Quote): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO quote_cache (symbol, data, cached_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(quote.symbol, JSON.stringify(quote));
}

/**
 * Save multiple quotes to persistent cache
 */
export function cacheQuotes(quotes: Quote[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO quote_cache (symbol, data, cached_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);

  const insertMany = db.transaction((items: Quote[]) => {
    for (const quote of items) {
      stmt.run(quote.symbol, JSON.stringify(quote));
    }
  });

  insertMany(quotes);
}

/**
 * Get a cached quote by symbol
 */
export function getCachedQuote(symbol: string): CachedQuote | null {
  const db = getDb();
  const stmt = db.prepare<[string], { data: string; cached_at: string }>(`
    SELECT data, cached_at FROM quote_cache WHERE symbol = ?
  `);

  const row = stmt.get(symbol);
  if (!row) return null;

  const quote = JSON.parse(row.data) as Quote;
  const cachedAt = new Date(row.cached_at);
  const isStale = Date.now() - cachedAt.getTime() > STALE_THRESHOLD_MS;

  return {
    ...quote,
    cachedAt,
    isStale,
  };
}

/**
 * Get multiple cached quotes
 */
export function getCachedQuotes(symbols: string[]): CachedQuote[] {
  if (symbols.length === 0) return [];

  const db = getDb();
  const placeholders = symbols.map(() => '?').join(',');
  const stmt = db.prepare<string[], { data: string; cached_at: string }>(`
    SELECT data, cached_at FROM quote_cache WHERE symbol IN (${placeholders})
  `);

  const rows = stmt.all(...symbols);
  return rows.map(row => {
    const quote = JSON.parse(row.data) as Quote;
    const cachedAt = new Date(row.cached_at);
    const isStale = Date.now() - cachedAt.getTime() > STALE_THRESHOLD_MS;
    return { ...quote, cachedAt, isStale };
  });
}

/**
 * Get all cached quotes (for diagnostics)
 */
export function getAllCachedQuotes(): CachedQuote[] {
  const db = getDb();
  const stmt = db.prepare<[], { data: string; cached_at: string }>(`
    SELECT data, cached_at FROM quote_cache ORDER BY cached_at DESC
  `);

  const rows = stmt.all();
  return rows.map(row => {
    const quote = JSON.parse(row.data) as Quote;
    const cachedAt = new Date(row.cached_at);
    const isStale = Date.now() - cachedAt.getTime() > STALE_THRESHOLD_MS;
    return { ...quote, cachedAt, isStale };
  });
}

/**
 * Clear old cached quotes (older than 24 hours)
 */
export function clearOldCachedQuotes(): number {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM quote_cache WHERE cached_at < datetime('now', '-24 hours')
  `);
  const result = stmt.run();
  return result.changes;
}

/**
 * Check if we have any cached data for offline mode
 */
export function hasCachedData(): boolean {
  const db = getDb();
  const stmt = db.prepare<[], { count: number }>(`
    SELECT COUNT(*) as count FROM quote_cache
  `);
  const row = stmt.get();
  return (row?.count ?? 0) > 0;
}
