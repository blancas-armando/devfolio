import YahooFinance from 'yahoo-finance2';
import { CACHE_TTL } from '../constants/index.js';

// Initialize Yahoo Finance client
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
});

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

// ═══════════════════════════════════════════════════════════════════════════
// Screener Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ScreenerResult {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  peRatio: number | null;
  volume: number | null;
  dividendYield: number | null;  // For income investors
  sector: string | null;
}

export interface ScreenerResponse {
  id: string;
  title: string;
  description: string;
  results: ScreenerResult[];
  total: number;
}

// Predefined screener IDs from Yahoo Finance
export type ScreenerPreset =
  | 'gainers'
  | 'losers'
  | 'active'
  | 'trending'
  | 'value'
  | 'growth'
  | 'dividend'
  // Sector presets (use ETF holdings)
  | 'tech'
  | 'healthcare'
  | 'finance'
  | 'energy'
  | 'consumer'
  | 'industrial';

interface ScreenerConfig {
  scrId?: string;      // Yahoo screener ID (for predefined screeners)
  etfSymbol?: string;  // ETF symbol (for sector-based screens)
  title: string;
  description: string;
}

const SCREENER_MAP: Record<ScreenerPreset, ScreenerConfig> = {
  gainers: {
    scrId: 'day_gainers',
    title: 'Day Gainers',
    description: 'Stocks with the biggest gains today',
  },
  losers: {
    scrId: 'day_losers',
    title: 'Day Losers',
    description: 'Stocks with the biggest losses today',
  },
  active: {
    scrId: 'most_actives',
    title: 'Most Active',
    description: 'Stocks with the highest trading volume',
  },
  trending: {
    scrId: 'most_actives',
    title: 'Trending',
    description: 'Most actively traded stocks',
  },
  value: {
    scrId: 'undervalued_large_caps',
    title: 'Undervalued Large Caps',
    description: 'Large cap stocks trading below intrinsic value',
  },
  growth: {
    scrId: 'undervalued_growth_stocks',
    title: 'Growth Stocks',
    description: 'Growth stocks at reasonable valuations',
  },
  dividend: {
    scrId: 'undervalued_large_caps',
    title: 'Dividend Stocks',
    description: 'Quality dividend-paying stocks',
  },
  // Sector-based screens using ETF top holdings
  tech: {
    etfSymbol: 'XLK',
    title: 'Technology Sector',
    description: 'Top technology stocks (XLK holdings)',
  },
  healthcare: {
    etfSymbol: 'XLV',
    title: 'Healthcare Sector',
    description: 'Top healthcare stocks (XLV holdings)',
  },
  finance: {
    etfSymbol: 'XLF',
    title: 'Financial Sector',
    description: 'Top financial stocks (XLF holdings)',
  },
  energy: {
    etfSymbol: 'XLE',
    title: 'Energy Sector',
    description: 'Top energy stocks (XLE holdings)',
  },
  consumer: {
    etfSymbol: 'XLY',
    title: 'Consumer Discretionary',
    description: 'Top consumer stocks (XLY holdings)',
  },
  industrial: {
    etfSymbol: 'XLI',
    title: 'Industrial Sector',
    description: 'Top industrial stocks (XLI holdings)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Screener Functions
// ═══════════════════════════════════════════════════════════════════════════

export async function runScreener(
  preset: ScreenerPreset,
  count: number = 15
): Promise<ScreenerResponse | null> {
  const cacheKey = `screener-${preset}-${count}`;
  const cached = getCached<ScreenerResponse>(cacheKey);
  if (cached) return cached;

  const config = SCREENER_MAP[preset];
  if (!config) return null;

  try {
    let results: ScreenerResult[];

    if (config.scrId) {
      // Use predefined Yahoo screener
      type PredefinedScreener = 'day_gainers' | 'day_losers' | 'most_actives' | 'undervalued_growth_stocks' | 'growth_technology_stocks' | 'undervalued_large_caps';

      const response = await yahooFinance.screener({
        scrIds: config.scrId as PredefinedScreener,
        count,
      });

      results = response.quotes.map((q) => ({
        symbol: q.symbol || '',
        name: q.shortName || q.longName || '',
        price: q.regularMarketPrice || 0,
        changePercent: q.regularMarketChangePercent || 0,
        marketCap: q.marketCap || null,
        peRatio: q.trailingPE || null,
        volume: q.regularMarketVolume || null,
        dividendYield: q.trailingAnnualDividendYield || null,
        sector: null,
      }));
    } else if (config.etfSymbol) {
      // Use ETF holdings for sector-based screening
      results = await getSectorStocks(config.etfSymbol, count);
    } else {
      return null;
    }

    const screenerResponse: ScreenerResponse = {
      id: preset,
      title: config.title,
      description: config.description,
      results,
      total: results.length,
    };

    setCache(cacheKey, screenerResponse, CACHE_TTL.quote);
    return screenerResponse;
  } catch {
    return null;
  }
}

// Helper function to get top stocks from a sector ETF
async function getSectorStocks(etfSymbol: string, count: number): Promise<ScreenerResult[]> {
  try {
    // Get ETF holdings
    const etfData = await yahooFinance.quoteSummary(etfSymbol, {
      modules: ['topHoldings'],
    });

    const holdings = etfData.topHoldings?.holdings ?? [];
    if (holdings.length === 0) return [];

    // Get symbols of top holdings
    const symbols = holdings
      .slice(0, count)
      .map(h => h.symbol)
      .filter((s): s is string => !!s && s.length > 0);

    if (symbols.length === 0) return [];

    // Fetch quotes for holdings
    const quotes = await yahooFinance.quote(symbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    // Map to screener results, sorted by market cap
    const results: ScreenerResult[] = quotesArray
      .map(q => ({
        symbol: q.symbol || '',
        name: q.shortName || q.longName || '',
        price: q.regularMarketPrice || 0,
        changePercent: q.regularMarketChangePercent || 0,
        marketCap: q.marketCap || null,
        peRatio: q.trailingPE || null,
        volume: q.regularMarketVolume || null,
        dividendYield: q.trailingAnnualDividendYield || null,
        sector: null,
      }))
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

    return results;
  } catch {
    return [];
  }
}

export function getAvailablePresets(): { id: ScreenerPreset; title: string; description: string }[] {
  return Object.entries(SCREENER_MAP).map(([id, config]) => ({
    id: id as ScreenerPreset,
    title: config.title,
    description: config.description,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Related Stocks (Competitors)
// ═══════════════════════════════════════════════════════════════════════════

export interface RelatedStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  peRatio: number | null;
  score: number;
}

export async function getRelatedStocks(symbol: string): Promise<RelatedStock[]> {
  const cacheKey = `related-${symbol}`;
  const cached = getCached<RelatedStock[]>(cacheKey);
  if (cached) return cached;

  try {
    // Get recommended symbols
    const recommendations = await yahooFinance.recommendationsBySymbol(symbol.toUpperCase());

    if (!recommendations.recommendedSymbols || recommendations.recommendedSymbols.length === 0) {
      return [];
    }

    // Get quotes for recommended symbols
    const symbols = recommendations.recommendedSymbols.map(r => r.symbol);
    const quotes = await yahooFinance.quote(symbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const related: RelatedStock[] = recommendations.recommendedSymbols.map(rec => {
      const quote = quotesArray.find(q => q.symbol === rec.symbol);
      return {
        symbol: rec.symbol,
        name: quote?.shortName || quote?.longName || rec.symbol,
        price: quote?.regularMarketPrice || 0,
        changePercent: quote?.regularMarketChangePercent || 0,
        marketCap: quote?.marketCap || null,
        peRatio: quote?.trailingPE || null,
        score: rec.score,
      };
    });

    setCache(cacheKey, related, CACHE_TTL.quote * 2);
    return related;
  } catch {
    return [];
  }
}
