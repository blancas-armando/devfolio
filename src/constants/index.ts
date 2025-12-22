// Timing constants (in milliseconds)
export const REFRESH_INTERVAL_MS = 10_000; // 10 seconds for live mode
export const LIVE_MODE_INTERVAL_MS = 10_000; // 10 seconds

// Cache TTL values
// Strategy: Short cache for price data, longer for static data
export const CACHE_TTL = {
  quote: 10_000,          // 10 seconds - price data changes frequently
  marketOverview: 15_000, // 15 seconds - indices/sectors
  historical: 300_000,    // 5 minutes - intraday history doesn't change much
  fundamentals: 3600_000, // 1 hour - financials rarely change
  news: 60_000,           // 1 minute - news feed
} as const;

// Demo data for first-time users
export const DEMO_WATCHLIST = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL'] as const;

export const DEMO_HOLDINGS = [
  { symbol: 'AAPL', shares: 50, costBasis: 150 },
  { symbol: 'NVDA', shares: 25, costBasis: 280 },
  { symbol: 'TSLA', shares: 30, costBasis: 220 },
] as const;

// UI constants
export const MIN_CONTAINER_HEIGHT = 24;
export const SPARKLINE_WIDTH = 10;
export const PROGRESS_BAR_WIDTH = 20;
export const HISTORICAL_DAYS = 7;
