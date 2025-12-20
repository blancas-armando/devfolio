import YahooFinance from 'yahoo-finance2';
import type { ETFProfile, ETFHolding } from '../types/index.js';
import { CACHE_TTL } from '../constants/index.js';
import { getQuotes, getPerformanceReturnsBatch, getHistoricalData } from './market.js';

// Initialize Yahoo Finance client with notices suppressed
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

// Sector name mapping for display
const SECTOR_NAMES: Record<string, string> = {
  realestate: 'Real Estate',
  consumer_cyclical: 'Consumer Cyclical',
  basic_materials: 'Basic Materials',
  consumer_defensive: 'Consumer Defensive',
  technology: 'Technology',
  communication_services: 'Communication Services',
  financial_services: 'Financial Services',
  utilities: 'Utilities',
  industrials: 'Industrials',
  energy: 'Energy',
  healthcare: 'Healthcare',
};

// ═══════════════════════════════════════════════════════════════════════════
// ETF Profile
// ═══════════════════════════════════════════════════════════════════════════

export async function getETFProfile(symbol: string): Promise<ETFProfile | null> {
  const cacheKey = `etf:${symbol}`;
  const cached = getCached<ETFProfile>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch ETF-specific data using quoteSummary
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'price',
        'summaryDetail',
        'fundProfile',
        'topHoldings',
        'fundPerformance',
        'defaultKeyStatistics',
      ],
    });

    const price = result.price;
    const detail = result.summaryDetail;
    const fundProfile = result.fundProfile;
    const topHoldings = result.topHoldings;
    const fundPerformance = result.fundPerformance;
    const stats = result.defaultKeyStatistics;

    if (!price) return null;

    // Extract top holdings (basic info first)
    const holdingsBasic: ETFHolding[] = (topHoldings?.holdings ?? []).map((h) => ({
      symbol: h.symbol ?? '',
      name: h.holdingName ?? '',
      weight: (h.holdingPercent ?? 0) * 100, // Convert to percentage
    }));

    // Fetch performance data for top 10 holdings
    const holdingSymbols = holdingsBasic
      .slice(0, 10)
      .map(h => h.symbol)
      .filter(s => s && s.length > 0);

    let holdingsWithPerf: ETFHolding[] = holdingsBasic;

    if (holdingSymbols.length > 0) {
      try {
        // Fetch quotes and performance returns in parallel
        const [quotes, perfReturns] = await Promise.all([
          getQuotes(holdingSymbols),
          getPerformanceReturnsBatch(holdingSymbols),
        ]);

        const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

        holdingsWithPerf = holdingsBasic.map(h => {
          const quote = quoteMap.get(h.symbol);
          const perf = perfReturns.get(h.symbol);
          if (quote) {
            return {
              ...h,
              price: quote.price,
              changePercent: quote.changePercent,
              threeMonthReturn: perf?.threeMonthReturn ?? undefined,
              ytdReturn: perf?.ytdReturn ?? undefined,
            };
          }
          return h;
        });
      } catch {
        // If quote fetch fails, continue with basic holdings
        holdingsWithPerf = holdingsBasic;
      }
    }

    const holdings = holdingsWithPerf;

    // Extract sector weights
    const sectorWeights: Record<string, number> = {};
    if (topHoldings?.sectorWeightings) {
      for (const sectorObj of topHoldings.sectorWeightings) {
        for (const [key, value] of Object.entries(sectorObj)) {
          if (typeof value === 'number' && value > 0) {
            const displayName = SECTOR_NAMES[key] ?? key;
            sectorWeights[displayName] = value * 100; // Convert to percentage
          }
        }
      }
    }

    // Get performance data
    const perfOverview = fundPerformance?.performanceOverview;
    const riskStats = fundPerformance?.riskOverviewStatistics?.riskStatistics?.[0];

    // Fetch historical prices for chart (90 days)
    const historicalPrices = await getHistoricalData(symbol, 90);

    const etfProfile: ETFProfile = {
      // Identity
      symbol: price.symbol ?? symbol,
      name: price.shortName ?? price.longName ?? symbol,
      family: fundProfile?.family ?? stats?.fundFamily ?? null,
      category: fundProfile?.categoryName ?? null,
      inceptionDate: stats?.fundInceptionDate ? new Date(stats.fundInceptionDate) : null,

      // Data timestamp
      asOfDate: new Date(),

      // Price & Yield
      price: price.regularMarketPrice ?? 0,
      change: price.regularMarketChange ?? 0,
      changePercent: price.regularMarketChangePercent ?? 0,
      yield: stats?.yield ? stats.yield * 100 : (detail?.yield ? detail.yield * 100 : null),

      // Costs & Size
      expenseRatio: fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio
        ? fundProfile.feesExpensesInvestment.annualReportExpenseRatio * 100
        : (stats?.annualReportExpenseRatio ? stats.annualReportExpenseRatio * 100 : null),
      totalAssets: stats?.totalAssets ?? detail?.totalAssets ?? null,

      // Holdings
      topHoldings: holdings,
      holdingsCount: topHoldings?.holdings?.length ?? null,

      // Allocation
      stockPosition: topHoldings?.stockPosition ? topHoldings.stockPosition * 100 : null,
      bondPosition: topHoldings?.bondPosition ? topHoldings.bondPosition * 100 : null,
      cashPosition: topHoldings?.cashPosition ? topHoldings.cashPosition * 100 : null,

      // Sector Weights
      sectorWeights,

      // Performance
      ytdReturn: perfOverview?.ytdReturnPct ? perfOverview.ytdReturnPct * 100 : null,
      oneYearReturn: perfOverview?.oneYearTotalReturn ? perfOverview.oneYearTotalReturn * 100 : null,
      threeYearReturn: perfOverview?.threeYearTotalReturn ? perfOverview.threeYearTotalReturn * 100 : null,
      fiveYearReturn: perfOverview?.fiveYrAvgReturnPct ? perfOverview.fiveYrAvgReturnPct * 100 : null,

      // Risk
      beta: riskStats?.beta ?? detail?.beta ?? null,
      sharpeRatio: riskStats?.sharpeRatio ?? null,

      // Historical prices
      historicalPrices,
    };

    setCache(cacheKey, etfProfile, CACHE_TTL.fundamentals); // 1 hour cache
    return etfProfile;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ETF Comparison
// ═══════════════════════════════════════════════════════════════════════════

export async function compareETFs(symbols: string[]): Promise<ETFProfile[]> {
  const results = await Promise.all(symbols.map(getETFProfile));
  return results.filter((etf): etf is ETFProfile => etf !== null);
}
