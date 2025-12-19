import yahooFinance from 'yahoo-finance2';
import type { Quote, HistoricalData } from '../types/index.js';

// Suppress Yahoo Finance notices
yahooFinance.suppressNotices(['yahooSurvey']);

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// TTL values in milliseconds
const TTL = {
  quote: 30_000,      // 30 seconds
  historical: 300_000, // 5 minutes
  fundamentals: 3600_000, // 1 hour
};

export async function getQuote(symbol: string): Promise<Quote | null> {
  const cacheKey = `quote:${symbol}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) return cached;

  try {
    const result = await yahooFinance.quote(symbol);
    if (!result) return null;

    const quote: Quote = {
      symbol: result.symbol,
      price: result.regularMarketPrice ?? 0,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      volume: result.regularMarketVolume ?? 0,
      marketCap: result.marketCap,
      pe: result.trailingPE,
      high52w: result.fiftyTwoWeekHigh,
      low52w: result.fiftyTwoWeekLow,
    };

    setCache(cacheKey, quote, TTL.quote);
    return quote;
  } catch {
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  // Fetch all in parallel
  const results = await Promise.all(symbols.map(getQuote));
  return results.filter((q): q is Quote => q !== null);
}

export async function getHistoricalData(
  symbol: string,
  days: number = 7
): Promise<number[]> {
  const cacheKey = `historical:${symbol}:${days}`;
  const cached = getCached<number[]>(cacheKey);
  if (cached) return cached;

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    const closes = result.quotes
      .map((q) => q.close)
      .filter((c): c is number => c !== null && c !== undefined);

    setCache(cacheKey, closes, TTL.historical);
    return closes;
  } catch {
    return [];
  }
}

export async function getHistoricalDataBatch(
  symbols: string[],
  days: number = 7
): Promise<Map<string, number[]>> {
  const results = await Promise.all(
    symbols.map(async (symbol) => ({
      symbol,
      data: await getHistoricalData(symbol, days),
    }))
  );

  return new Map(results.map((r) => [r.symbol, r.data]));
}

export async function searchSymbol(query: string): Promise<string[]> {
  try {
    const results = await yahooFinance.search(query);
    return results.quotes
      .filter((q): q is typeof q & { quoteType: string; symbol: string } =>
        'quoteType' in q && 'symbol' in q && q.quoteType === 'EQUITY'
      )
      .map((q) => q.symbol)
      .slice(0, 5);
  } catch {
    return [];
  }
}
