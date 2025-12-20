import YahooFinance from 'yahoo-finance2';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { execSync } from 'child_process';
import type { Quote } from '../types/index.js';
import { CACHE_TTL, HISTORICAL_DAYS } from '../constants/index.js';

// Initialize Yahoo Finance client with notices suppressed
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
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
// Company Profile Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CompanyProfile {
  // Identity
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  website: string;
  employees: number | null;

  // Price Data
  price: number;
  change: number;
  changePercent: number;
  high52w: number | null;
  low52w: number | null;
  avgVolume: number | null;

  // Market Data
  marketCap: number | null;
  enterpriseValue: number | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  beta: number | null;

  // Financials
  revenue: number | null;
  revenueGrowth: number | null;
  grossProfit: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
  ebitda: number | null;
  netIncome: number | null;
  eps: number | null;
  epsGrowth: number | null;

  // Balance Sheet
  totalCash: number | null;
  totalDebt: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  bookValue: number | null;

  // Valuation
  peRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  evToRevenue: number | null;
  evToEbitda: number | null;

  // Dividends
  dividendYield: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;
  exDividendDate: string | null;

  // Analyst Data
  targetPrice: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  recommendationKey: string | null;
  numberOfAnalysts: number | null;

  // Performance & Chart Data
  asOfDate: Date;
  threeMonthReturn: number | null;
  ytdReturn: number | null;
  historicalPrices: number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Quote Functions
// ═══════════════════════════════════════════════════════════════════════════

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

    setCache(cacheKey, quote, CACHE_TTL.quote);
    return quote;
  } catch {
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const results = await Promise.all(symbols.map(getQuote));
  return results.filter((q): q is Quote => q !== null);
}

// ═══════════════════════════════════════════════════════════════════════════
// Company Profile
// ═══════════════════════════════════════════════════════════════════════════

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const cacheKey = `profile:${symbol}`;
  const cached = getCached<CompanyProfile>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch comprehensive data using quoteSummary
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryProfile',
        'summaryDetail',
        'financialData',
        'defaultKeyStatistics',
        'earnings',
      ],
    });

    const price = result.price;
    const profile = result.summaryProfile;
    const detail = result.summaryDetail;
    const financial = result.financialData;
    const stats = result.defaultKeyStatistics;

    if (!price) return null;

    // Fetch historical prices and performance returns
    const [historicalPrices, perfReturns] = await Promise.all([
      getHistoricalData(symbol, 90),
      getPerformanceReturns(symbol),
    ]);

    const companyProfile: CompanyProfile = {
      // Identity
      symbol: price.symbol ?? symbol,
      name: price.shortName ?? price.longName ?? symbol,
      description: profile?.longBusinessSummary ?? '',
      sector: profile?.sector ?? 'N/A',
      industry: profile?.industry ?? 'N/A',
      website: profile?.website ?? '',
      employees: profile?.fullTimeEmployees ?? null,

      // Price Data
      price: price.regularMarketPrice ?? 0,
      change: price.regularMarketChange ?? 0,
      changePercent: price.regularMarketChangePercent ?? 0,
      high52w: detail?.fiftyTwoWeekHigh ?? null,
      low52w: detail?.fiftyTwoWeekLow ?? null,
      avgVolume: detail?.averageVolume ?? null,

      // Market Data
      marketCap: price.marketCap ?? null,
      enterpriseValue: stats?.enterpriseValue ?? null,
      sharesOutstanding: stats?.sharesOutstanding ?? null,
      floatShares: stats?.floatShares ?? null,
      beta: detail?.beta ?? null,

      // Financials
      revenue: financial?.totalRevenue ?? null,
      revenueGrowth: financial?.revenueGrowth ?? null,
      grossProfit: financial?.grossProfits ?? null,
      grossMargin: financial?.grossMargins ?? null,
      operatingMargin: financial?.operatingMargins ?? null,
      profitMargin: financial?.profitMargins ?? null,
      ebitda: financial?.ebitda ?? null,
      netIncome: stats?.netIncomeToCommon ?? null,
      eps: stats?.trailingEps ?? null,
      epsGrowth: stats?.earningsQuarterlyGrowth ?? null,

      // Balance Sheet
      totalCash: financial?.totalCash ?? null,
      totalDebt: financial?.totalDebt ?? null,
      debtToEquity: financial?.debtToEquity ?? null,
      currentRatio: financial?.currentRatio ?? null,
      bookValue: stats?.bookValue ?? null,

      // Valuation
      peRatio: detail?.trailingPE ?? null,
      forwardPE: stats?.forwardPE ?? null,
      pegRatio: stats?.pegRatio ?? null,
      priceToSales: typeof stats?.priceToSalesTrailing12Months === 'number' ? stats.priceToSalesTrailing12Months : null,
      priceToBook: stats?.priceToBook ?? null,
      evToRevenue: stats?.enterpriseToRevenue ?? null,
      evToEbitda: stats?.enterpriseToEbitda ?? null,

      // Dividends
      dividendYield: detail?.dividendYield ?? null,
      dividendRate: detail?.dividendRate ?? null,
      payoutRatio: detail?.payoutRatio ?? null,
      exDividendDate: detail?.exDividendDate ? new Date(detail.exDividendDate).toLocaleDateString() : null,

      // Analyst Data
      targetPrice: financial?.targetMeanPrice ?? null,
      targetHigh: financial?.targetHighPrice ?? null,
      targetLow: financial?.targetLowPrice ?? null,
      recommendationKey: financial?.recommendationKey ?? null,
      numberOfAnalysts: financial?.numberOfAnalystOpinions ?? null,

      // Performance & Chart Data
      asOfDate: new Date(),
      threeMonthReturn: perfReturns.threeMonthReturn,
      ytdReturn: perfReturns.ytdReturn,
      historicalPrices,
    };

    setCache(cacheKey, companyProfile, CACHE_TTL.quote * 2); // Cache longer for profiles
    return companyProfile;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Stock Comparison
// ═══════════════════════════════════════════════════════════════════════════

export async function compareStocks(symbols: string[]): Promise<CompanyProfile[]> {
  const profiles = await Promise.all(symbols.map(getCompanyProfile));
  return profiles.filter((p): p is CompanyProfile => p !== null);
}

// ═══════════════════════════════════════════════════════════════════════════
// Historical Data
// ═══════════════════════════════════════════════════════════════════════════

export async function getHistoricalData(
  symbol: string,
  days: number = HISTORICAL_DAYS
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

    setCache(cacheKey, closes, CACHE_TTL.historical);
    return closes;
  } catch {
    return [];
  }
}

export async function getHistoricalDataBatch(
  symbols: string[],
  days: number = HISTORICAL_DAYS
): Promise<Map<string, number[]>> {
  const results = await Promise.all(
    symbols.map(async (symbol) => ({
      symbol,
      data: await getHistoricalData(symbol, days),
    }))
  );

  return new Map(results.map((r) => [r.symbol, r.data]));
}

// ═══════════════════════════════════════════════════════════════════════════
// OHLCV Data with Timeframe Support
// ═══════════════════════════════════════════════════════════════════════════

export interface OHLCVBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartTimeframe = '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';

const TIMEFRAME_CONFIG: Record<ChartTimeframe, { days: number; interval: '1d' | '1wk' | '1mo' }> = {
  '1d': { days: 1, interval: '1d' },
  '5d': { days: 5, interval: '1d' },
  '1m': { days: 30, interval: '1d' },
  '3m': { days: 90, interval: '1d' },
  '6m': { days: 180, interval: '1d' },
  '1y': { days: 365, interval: '1d' },
  '5y': { days: 1825, interval: '1wk' },
};

export async function getOHLCVData(
  symbol: string,
  timeframe: ChartTimeframe = '3m'
): Promise<OHLCVBar[]> {
  const config = TIMEFRAME_CONFIG[timeframe];
  const cacheKey = `ohlcv:${symbol}:${timeframe}`;
  const cached = getCached<OHLCVBar[]>(cacheKey);
  if (cached) return cached;

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - config.days);

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: config.interval,
    });

    const bars: OHLCVBar[] = result.quotes
      .filter(q =>
        q.date !== null &&
        q.open !== null &&
        q.high !== null &&
        q.low !== null &&
        q.close !== null &&
        q.volume !== null
      )
      .map(q => ({
        date: q.date!,
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
        volume: q.volume!,
      }));

    setCache(cacheKey, bars, CACHE_TTL.historical);
    return bars;
  } catch {
    return [];
  }
}

export function timeframeToDays(timeframe: ChartTimeframe): number {
  return TIMEFRAME_CONFIG[timeframe].days;
}

export function parseTimeframe(input: string): ChartTimeframe | null {
  const normalized = input.toLowerCase().trim();
  const valid: ChartTimeframe[] = ['1d', '5d', '1m', '3m', '6m', '1y', '5y'];
  return valid.includes(normalized as ChartTimeframe) ? (normalized as ChartTimeframe) : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Performance Returns
// ═══════════════════════════════════════════════════════════════════════════

export interface PerformanceReturns {
  threeMonthReturn: number | null;
  ytdReturn: number | null;
}

export async function getPerformanceReturns(symbol: string): Promise<PerformanceReturns> {
  const cacheKey = `perf:${symbol}`;
  const cached = getCached<PerformanceReturns>(cacheKey);
  if (cached) return cached;

  try {
    const now = new Date();

    // Calculate start dates
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const yearStart = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year

    // Use the earlier date for the API call
    const startDate = yearStart < threeMonthsAgo ? yearStart : threeMonthsAgo;

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: now,
      interval: '1d',
    });

    const quotes = result.quotes.filter(q => q.close !== null && q.close !== undefined);
    if (quotes.length === 0) {
      return { threeMonthReturn: null, ytdReturn: null };
    }

    const currentPrice = quotes[quotes.length - 1].close!;

    // Find YTD start price (first trading day of year or closest)
    let ytdReturn: number | null = null;
    const ytdQuote = quotes.find(q => {
      const qDate = new Date(q.date);
      return qDate.getFullYear() === now.getFullYear();
    });
    if (ytdQuote && ytdQuote.close) {
      ytdReturn = ((currentPrice - ytdQuote.close) / ytdQuote.close) * 100;
    }

    // Find 3M start price
    let threeMonthReturn: number | null = null;
    const threeMonthDate = new Date(now);
    threeMonthDate.setMonth(threeMonthDate.getMonth() - 3);

    // Find the quote closest to 3 months ago
    const threeMonthQuote = quotes.find(q => new Date(q.date) >= threeMonthsAgo);
    if (threeMonthQuote && threeMonthQuote.close) {
      threeMonthReturn = ((currentPrice - threeMonthQuote.close) / threeMonthQuote.close) * 100;
    }

    const returns = { threeMonthReturn, ytdReturn };
    setCache(cacheKey, returns, CACHE_TTL.historical);
    return returns;
  } catch {
    return { threeMonthReturn: null, ytdReturn: null };
  }
}

export async function getPerformanceReturnsBatch(
  symbols: string[]
): Promise<Map<string, PerformanceReturns>> {
  const results = await Promise.all(
    symbols.map(async (symbol) => ({
      symbol,
      returns: await getPerformanceReturns(symbol),
    }))
  );

  return new Map(results.map((r) => [r.symbol, r.returns]));
}

// ═══════════════════════════════════════════════════════════════════════════
// Search
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Market Overview
// ═══════════════════════════════════════════════════════════════════════════

export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number | null;
  dayLow: number | null;
}

export interface SectorPerformance {
  name: string;
  symbol: string;
  changePercent: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export interface MarketOverview {
  indices: IndexQuote[];
  sectors: SectorPerformance[];
  gainers: MarketMover[];
  losers: MarketMover[];
  vix: number | null;
  breadth: {
    advancing: number;
    declining: number;
  };
  asOfDate: Date;
}

const INDEX_SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'DOW' },
  { symbol: '^RUT', name: 'Russell 2000' },
];

const SECTOR_ETFS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLV', name: 'Healthcare' },
  { symbol: 'XLF', name: 'Financials' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLY', name: 'Consumer Disc.' },
  { symbol: 'XLP', name: 'Consumer Staples' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLB', name: 'Materials' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLU', name: 'Utilities' },
  { symbol: 'XLC', name: 'Communication' },
];

// Top 50 S&P 500 stocks by market cap for comprehensive coverage
const SP500_TOP_50 = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'BRK-B', 'TSLA', 'UNH', 'JNJ',
  'JPM', 'V', 'XOM', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'LLY',
  'PEP', 'KO', 'COST', 'AVGO', 'TMO', 'WMT', 'MCD', 'CSCO', 'ACN', 'DHR',
  'ABT', 'VZ', 'NEE', 'ADBE', 'CRM', 'NKE', 'TXN', 'PM', 'UPS', 'RTX',
  'HON', 'QCOM', 'LOW', 'UNP', 'ORCL', 'IBM', 'CAT', 'GS', 'BA', 'AMGN',
];

// Legacy alias for backward compatibility
const MOVER_UNIVERSE = SP500_TOP_50;

// Additional market indicators
const MARKET_INDICATORS = [
  { symbol: '^TNX', name: '10Y Treasury' },
  { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'CL=F', name: 'Crude Oil' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
];

export async function getMarketOverview(): Promise<MarketOverview> {
  const cacheKey = 'market-overview';
  const cached = getCached<MarketOverview>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch all data in parallel
    const [indicesData, sectorsData, vixData, moversData] = await Promise.all([
      // Indices
      yahooFinance.quote(INDEX_SYMBOLS.map(i => i.symbol)),
      // Sector ETFs
      yahooFinance.quote(SECTOR_ETFS.map(s => s.symbol)),
      // VIX
      yahooFinance.quote('^VIX'),
      // Mover universe
      yahooFinance.quote(MOVER_UNIVERSE),
    ]);

    // Process indices
    const indices: IndexQuote[] = INDEX_SYMBOLS.map(idx => {
      const data = Array.isArray(indicesData)
        ? indicesData.find(d => d.symbol === idx.symbol)
        : indicesData;
      return {
        symbol: idx.symbol,
        name: idx.name,
        price: data?.regularMarketPrice ?? 0,
        change: data?.regularMarketChange ?? 0,
        changePercent: data?.regularMarketChangePercent ?? 0,
        dayHigh: data?.regularMarketDayHigh ?? null,
        dayLow: data?.regularMarketDayLow ?? null,
      };
    });

    // Process sectors
    const sectors: SectorPerformance[] = SECTOR_ETFS.map(sec => {
      const data = Array.isArray(sectorsData)
        ? sectorsData.find(d => d.symbol === sec.symbol)
        : sectorsData;
      return {
        name: sec.name,
        symbol: sec.symbol,
        changePercent: data?.regularMarketChangePercent ?? 0,
      };
    }).sort((a, b) => b.changePercent - a.changePercent);

    // Process movers
    const moversArray = Array.isArray(moversData) ? moversData : [moversData];
    const allMovers: MarketMover[] = moversArray
      .filter(d => d && d.regularMarketChangePercent !== undefined)
      .map(d => ({
        symbol: d.symbol ?? '',
        name: d.shortName ?? d.longName ?? d.symbol ?? '',
        price: d.regularMarketPrice ?? 0,
        changePercent: d.regularMarketChangePercent ?? 0,
      }));

    // Sort for gainers and losers
    const sortedByChange = [...allMovers].sort((a, b) => b.changePercent - a.changePercent);
    const gainers = sortedByChange.slice(0, 5);
    const losers = sortedByChange.slice(-5).reverse();

    // Calculate breadth
    const advancing = allMovers.filter(m => m.changePercent > 0).length;
    const declining = allMovers.filter(m => m.changePercent < 0).length;

    // VIX
    const vixQuote = Array.isArray(vixData) ? vixData[0] : vixData;
    const vix = vixQuote?.regularMarketPrice ?? null;

    const overview: MarketOverview = {
      indices,
      sectors,
      gainers,
      losers,
      vix,
      breadth: { advancing, declining },
      asOfDate: new Date(),
    };

    setCache(cacheKey, overview, CACHE_TTL.quote);
    return overview;
  } catch (error) {
    // Return empty overview on error
    return {
      indices: [],
      sectors: [],
      gainers: [],
      losers: [],
      vix: null,
      breadth: { advancing: 0, declining: 0 },
      asOfDate: new Date(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Events Calendar
// ═══════════════════════════════════════════════════════════════════════════

export interface EarningsEventInfo {
  symbol: string;
  name: string;
  date: Date;
  estimate: number | null;
}

export interface DividendEventInfo {
  symbol: string;
  name: string;
  exDate: Date;
  amount: number | null;
  yield: number | null;
}

export interface EventsCalendar {
  earnings: EarningsEventInfo[];
  dividends: DividendEventInfo[];
  asOfDate: Date;
}

export async function getEventsCalendar(symbols: string[]): Promise<EventsCalendar> {
  if (symbols.length === 0) {
    return { earnings: [], dividends: [], asOfDate: new Date() };
  }

  const earnings: EarningsEventInfo[] = [];
  const dividends: DividendEventInfo[] = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const result = await yahooFinance.quoteSummary(symbol, {
          modules: ['calendarEvents', 'price', 'summaryDetail'],
        });

        const calendar = result.calendarEvents;
        const price = result.price;
        const detail = result.summaryDetail;
        const name = price?.shortName ?? price?.longName ?? symbol;

        // Check for upcoming earnings
        if (calendar?.earnings?.earningsDate) {
          const earningsDates = calendar.earnings.earningsDate;
          for (const date of earningsDates) {
            const earningsDate = new Date(date);
            if (earningsDate >= now && earningsDate <= thirtyDaysFromNow) {
              earnings.push({
                symbol,
                name,
                date: earningsDate,
                estimate: calendar.earnings.earningsAverage ?? null,
              });
            }
          }
        }

        // Check for upcoming dividends
        if (calendar?.exDividendDate) {
          const exDate = new Date(calendar.exDividendDate);
          if (exDate >= now && exDate <= thirtyDaysFromNow) {
            dividends.push({
              symbol,
              name,
              exDate,
              amount: calendar.dividendDate ? detail?.dividendRate ?? null : null,
              yield: detail?.dividendYield ?? null,
            });
          }
        }
      } catch {
        // Skip symbols that fail
      }
    })
  );

  // Sort by date
  earnings.sort((a, b) => a.date.getTime() - b.date.getTime());
  dividends.sort((a, b) => a.exDate.getTime() - b.exDate.getTime());

  return {
    earnings,
    dividends,
    asOfDate: new Date(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// News Feed
// ═══════════════════════════════════════════════════════════════════════════

export interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  publishedAt: Date;
  symbols: string[];
}

export async function getNewsFeed(symbols?: string[]): Promise<NewsArticle[]> {
  const cacheKey = symbols ? `news:${symbols.join(',')}` : 'news:general';
  const cached = getCached<NewsArticle[]>(cacheKey);
  if (cached) return cached;

  try {
    const articles: NewsArticle[] = [];
    const seenTitles = new Set<string>();

    // If specific symbols provided, get news for each
    const symbolsToFetch = symbols && symbols.length > 0
      ? symbols.slice(0, 5) // Limit to 5 symbols
      : ['SPY']; // Default to S&P 500 ETF for general market news

    await Promise.all(
      symbolsToFetch.map(async (symbol) => {
        try {
          const result = await yahooFinance.search(symbol, { newsCount: 10 });

          if (result.news) {
            for (const item of result.news) {
              // Dedupe by title
              if (seenTitles.has(item.title)) continue;
              seenTitles.add(item.title);

              articles.push({
                title: item.title,
                publisher: item.publisher ?? 'Unknown',
                link: item.link ?? '',
                publishedAt: new Date(item.providerPublishTime ?? Date.now()),
                symbols: item.relatedTickers ?? [symbol],
              });
            }
          }
        } catch {
          // Skip on error
        }
      })
    );

    // Sort by date (newest first)
    articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    // Limit to 15 articles
    const limited = articles.slice(0, 15);

    setCache(cacheKey, limited, CACHE_TTL.quote);
    return limited;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Article Content Fetching
// ═══════════════════════════════════════════════════════════════════════════

export interface ArticleContent {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  siteName: string | null;
  excerpt: string | null;
}

export async function fetchArticleContent(url: string): Promise<ArticleContent | null> {
  try {
    // Use curl to fetch (handles Yahoo's large headers that break Node.js http parser)
    const html = execSync(
      `curl -sL --max-time 15 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${url}"`,
      {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 20000,
      }
    );

    if (!html || html.length < 100) {
      return null;
    }

    // Parse with JSDOM
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    // Use Readability to extract article content
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      return null;
    }

    return {
      title: article.title ?? 'Untitled',
      byline: article.byline ?? null,
      content: article.content ?? '',
      textContent: article.textContent ?? '',
      siteName: article.siteName ?? null,
      excerpt: article.excerpt ?? null,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Market Brief - Comprehensive Market Intelligence
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketIndicator {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface IndexWithHistory {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  weekChange: number | null;
  monthChange: number | null;
  ytdChange: number | null;
}

export interface SectorWithContext {
  name: string;
  symbol: string;
  changePercent: number;
  weekChange: number | null;
}

export interface MoverWithContext {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
}

export interface UpcomingEarnings {
  symbol: string;
  name: string;
  date: Date;
  estimate: number | null;
  marketCap: number | null;
}

export interface MarketBriefData {
  // Timestamp
  asOfDate: Date;

  // Major indices with historical context
  indices: IndexWithHistory[];

  // Market indicators (VIX, yields, dollar, commodities, crypto)
  indicators: {
    vix: MarketIndicator | null;
    treasury10Y: MarketIndicator | null;
    dollarIndex: MarketIndicator | null;
    gold: MarketIndicator | null;
    oil: MarketIndicator | null;
    bitcoin: MarketIndicator | null;
  };

  // Sectors ranked by performance
  sectors: SectorWithContext[];

  // Top movers
  gainers: MoverWithContext[];
  losers: MoverWithContext[];

  // Market breadth (advancing vs declining)
  breadth: {
    advancing: number;
    declining: number;
    unchanged: number;
  };

  // News
  topNews: NewsArticle[];

  // Upcoming earnings (next 7 days, major companies)
  upcomingEarnings: UpcomingEarnings[];
}

async function getHistoricalChange(symbol: string, days: number): Promise<number | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - 5); // Buffer for weekends

    const history = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    if (!history.quotes || history.quotes.length < 2) return null;

    const oldPrice = history.quotes[0]?.close;
    const newPrice = history.quotes[history.quotes.length - 1]?.close;

    if (!oldPrice || !newPrice) return null;

    return ((newPrice - oldPrice) / oldPrice) * 100;
  } catch {
    return null;
  }
}

export async function getMarketBriefData(): Promise<MarketBriefData> {
  const cacheKey = 'market-brief';
  const cached = getCached<MarketBriefData>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch all data in parallel
    const [
      indicesData,
      sectorsData,
      indicatorsData,
      moversData,
      newsData,
    ] = await Promise.all([
      // Indices
      yahooFinance.quote(INDEX_SYMBOLS.map(i => i.symbol)),
      // Sectors
      yahooFinance.quote(SECTOR_ETFS.map(s => s.symbol)),
      // Market indicators (VIX + others)
      yahooFinance.quote(['^VIX', ...MARKET_INDICATORS.map(m => m.symbol)]),
      // Top 50 stocks for movers
      yahooFinance.quote(SP500_TOP_50),
      // News
      getNewsFeed(),
    ]);

    // Process indices
    const indices: IndexWithHistory[] = await Promise.all(
      INDEX_SYMBOLS.map(async (idx) => {
        const data = Array.isArray(indicesData)
          ? indicesData.find(d => d.symbol === idx.symbol)
          : indicesData;

        // Get historical changes
        const [weekChange, monthChange, ytdChange] = await Promise.all([
          getHistoricalChange(idx.symbol, 7),
          getHistoricalChange(idx.symbol, 30),
          getHistoricalChange(idx.symbol, 365), // Approximate YTD
        ]);

        return {
          symbol: idx.symbol,
          name: idx.name,
          price: data?.regularMarketPrice ?? 0,
          change: data?.regularMarketChange ?? 0,
          changePercent: data?.regularMarketChangePercent ?? 0,
          weekChange,
          monthChange,
          ytdChange,
        };
      })
    );

    // Process indicators
    const indicatorsArray = Array.isArray(indicatorsData) ? indicatorsData : [indicatorsData];

    const findIndicator = (symbol: string): MarketIndicator | null => {
      const data = indicatorsArray.find(d => d?.symbol === symbol);
      if (!data) return null;
      return {
        name: MARKET_INDICATORS.find(m => m.symbol === symbol)?.name ?? symbol,
        value: data.regularMarketPrice ?? 0,
        change: data.regularMarketChange ?? 0,
        changePercent: data.regularMarketChangePercent ?? 0,
      };
    };

    const vixData = indicatorsArray.find(d => d?.symbol === '^VIX');
    const indicators = {
      vix: vixData ? {
        name: 'VIX',
        value: vixData.regularMarketPrice ?? 0,
        change: vixData.regularMarketChange ?? 0,
        changePercent: vixData.regularMarketChangePercent ?? 0,
      } : null,
      treasury10Y: findIndicator('^TNX'),
      dollarIndex: findIndicator('DX-Y.NYB'),
      gold: findIndicator('GC=F'),
      oil: findIndicator('CL=F'),
      bitcoin: findIndicator('BTC-USD'),
    };

    // Process sectors with week change
    const sectors: SectorWithContext[] = await Promise.all(
      SECTOR_ETFS.map(async (sec) => {
        const data = Array.isArray(sectorsData)
          ? sectorsData.find(d => d.symbol === sec.symbol)
          : sectorsData;

        const weekChange = await getHistoricalChange(sec.symbol, 7);

        return {
          name: sec.name,
          symbol: sec.symbol,
          changePercent: data?.regularMarketChangePercent ?? 0,
          weekChange,
        };
      })
    );
    sectors.sort((a, b) => b.changePercent - a.changePercent);

    // Process movers
    const moversArray = Array.isArray(moversData) ? moversData : [moversData];
    const allMovers: MoverWithContext[] = moversArray
      .filter(d => d && d.regularMarketChangePercent !== undefined)
      .map(d => ({
        symbol: d.symbol ?? '',
        name: d.shortName ?? d.longName ?? d.symbol ?? '',
        price: d.regularMarketPrice ?? 0,
        change: d.regularMarketChange ?? 0,
        changePercent: d.regularMarketChangePercent ?? 0,
        volume: d.regularMarketVolume ?? null,
        avgVolume: d.averageDailyVolume3Month ?? null,
        marketCap: d.marketCap ?? null,
      }));

    const sortedMovers = [...allMovers].sort((a, b) => b.changePercent - a.changePercent);
    const gainers = sortedMovers.slice(0, 8);
    const losers = sortedMovers.slice(-8).reverse();

    // Calculate breadth
    const advancing = allMovers.filter(m => m.changePercent > 0).length;
    const declining = allMovers.filter(m => m.changePercent < 0).length;
    const unchanged = allMovers.filter(m => m.changePercent === 0).length;

    // Get upcoming earnings for major companies
    const upcomingEarnings: UpcomingEarnings[] = [];
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Check earnings for top 20 stocks
    await Promise.all(
      SP500_TOP_50.slice(0, 20).map(async (symbol) => {
        try {
          const result = await yahooFinance.quoteSummary(symbol, {
            modules: ['calendarEvents', 'price'],
          });

          const calendar = result.calendarEvents;
          const price = result.price;

          if (calendar?.earnings?.earningsDate) {
            for (const date of calendar.earnings.earningsDate) {
              const earningsDate = new Date(date);
              if (earningsDate >= now && earningsDate <= oneWeekFromNow) {
                upcomingEarnings.push({
                  symbol,
                  name: price?.shortName ?? symbol,
                  date: earningsDate,
                  estimate: calendar.earnings.earningsAverage ?? null,
                  marketCap: price?.marketCap ?? null,
                });
              }
            }
          }
        } catch {
          // Skip on error
        }
      })
    );

    upcomingEarnings.sort((a, b) => a.date.getTime() - b.date.getTime());

    const briefData: MarketBriefData = {
      asOfDate: new Date(),
      indices,
      indicators,
      sectors,
      gainers,
      losers,
      breadth: { advancing, declining, unchanged },
      topNews: newsData.slice(0, 8),
      upcomingEarnings: upcomingEarnings.slice(0, 6),
    };

    setCache(cacheKey, briefData, CACHE_TTL.quote);
    return briefData;
  } catch (error) {
    // Return minimal data on error
    return {
      asOfDate: new Date(),
      indices: [],
      indicators: {
        vix: null,
        treasury10Y: null,
        dollarIndex: null,
        gold: null,
        oil: null,
        bitcoin: null,
      },
      sectors: [],
      gainers: [],
      losers: [],
      breadth: { advancing: 0, declining: 0, unchanged: 0 },
      topNews: [],
      upcomingEarnings: [],
    };
  }
}
