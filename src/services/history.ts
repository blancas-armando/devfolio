/**
 * Historical Analysis Service
 * Fetches comprehensive historical data for deep-dive analysis
 */

import YahooFinance from 'yahoo-finance2';
import { CACHE_TTL } from '../constants/index.js';

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
  validation: {
    logErrors: false,       // Suppress validation error logging
    logOptionsErrors: false,
  },
});

// Query options to handle Yahoo's sometimes inconsistent data
const QUERY_OPTIONS = {
  validateResult: false as const,  // Yahoo's quarterly data often fails strict validation
};

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
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type HistoryPeriod = 'annual' | 'quarterly';

export interface HistoricalMetric {
  year: number;
  quarter?: number;  // 1-4 for quarterly data
  value: number | null;
}

// Label helper for metrics
export function getMetricLabel(metric: HistoricalMetric): string {
  if (metric.quarter) {
    return `Q${metric.quarter}'${String(metric.year).slice(-2)}`;
  }
  return String(metric.year);
}

export interface ValuationRange {
  current: number | null;
  fiveYearAvg: number | null;
  fiveYearHigh: number | null;
  fiveYearLow: number | null;
}

export interface PriceMilestone {
  allTimeHigh: number | null;
  allTimeHighDate: Date | null;
  allTimeLow: number | null;
  allTimeLowDate: Date | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export interface DividendHistory {
  currentYield: number | null;
  fiveYearAvgYield: number | null;
  payoutRatio: number | null;
  dividendGrowthRate: number | null;
  consecutiveYears: number | null;
  annualDividends: HistoricalMetric[];
}

export interface HistoricalAnalysis {
  symbol: string;
  name: string;
  period: HistoryPeriod;

  // Revenue history (5 years annual, 8 quarters)
  revenueHistory: HistoricalMetric[];
  revenueGrowthRate: number | null;

  // EPS history (5 years)
  epsHistory: HistoricalMetric[];
  epsGrowthRate: number | null;

  // Free Cash Flow history
  fcfHistory: HistoricalMetric[];

  // Margin history
  grossMarginHistory: HistoricalMetric[];
  operatingMarginHistory: HistoricalMetric[];
  netMarginHistory: HistoricalMetric[];

  // Valuation ranges
  peRatio: ValuationRange;
  psRatio: ValuationRange;
  evRevenue: number | null;
  evEbitda: number | null;
  evFcf: number | null;

  // Price milestones
  priceMilestones: PriceMilestone;

  // Dividend history (if applicable)
  dividendHistory: DividendHistory | null;

  // Performance returns
  returns: {
    oneMonth: number | null;
    threeMonth: number | null;
    sixMonth: number | null;
    ytd: number | null;
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
    tenYear: number | null;
  };

  asOfDate: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Function
// ═══════════════════════════════════════════════════════════════════════════

export async function getHistoricalAnalysis(
  symbol: string,
  period: HistoryPeriod = 'annual'
): Promise<HistoricalAnalysis | null> {
  const cacheKey = `history:${symbol}:${period}`;
  const cached = getCached<HistoricalAnalysis>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch time series data - may fail validation for quarterly, so handle separately
    let timeSeriesResult: Awaited<ReturnType<typeof yahooFinance.fundamentalsTimeSeries>> = [];
    let actualPeriod = period;
    try {
      timeSeriesResult = await yahooFinance.fundamentalsTimeSeries(symbol.toUpperCase(), {
        period1: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
        type: period,
        module: 'all',
      }, QUERY_OPTIONS);
    } catch {
      // Quarterly data often fails validation - fall back to annual
      if (period === 'quarterly') {
        actualPeriod = 'annual';  // Track that we fell back
        try {
          timeSeriesResult = await yahooFinance.fundamentalsTimeSeries(symbol.toUpperCase(), {
            period1: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
            type: 'annual',
            module: 'all',
          }, QUERY_OPTIONS);
        } catch {
          // Continue with empty time series
        }
      }
    }

    // Fetch other data in parallel
    const [summaryResult, chartResult] = await Promise.all([
      yahooFinance.quoteSummary(symbol.toUpperCase(), {
        modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData'],
      }),
      yahooFinance.chart(symbol.toUpperCase(), {
        period1: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        interval: '1wk',
      }),
    ]);

    const price = summaryResult.price;
    const detail = summaryResult.summaryDetail;
    const stats = summaryResult.defaultKeyStatistics;
    const financial = summaryResult.financialData;

    if (!price) return null;

    // Group time series by period (year for annual, year+quarter for quarterly)
    type PeriodKey = string; // "2024" for annual, "2024-Q1" for quarterly
    const dataByPeriod = new Map<PeriodKey, { year: number; quarter?: number; data: Record<string, unknown> }>();

    for (const item of timeSeriesResult) {
      // item.date can be a Date object or Unix timestamp (number)
      const dateObj = item.date instanceof Date ? item.date : new Date(item.date * 1000);
      const year = dateObj.getFullYear();
      const quarter = actualPeriod === 'quarterly' ? Math.ceil((dateObj.getMonth() + 1) / 3) : undefined;
      const key = quarter ? `${year}-Q${quarter}` : String(year);

      const existing = dataByPeriod.get(key) || { year, quarter, data: {} as Record<string, unknown> };
      const itemData = item as unknown as Record<string, unknown>;
      for (const [k, value] of Object.entries(itemData)) {
        if (k !== 'date' && value !== null && value !== undefined) {
          existing.data[k] = value;
        }
      }
      dataByPeriod.set(key, existing);
    }

    // Sort periods descending and limit
    const periodLimit = actualPeriod === 'quarterly' ? 8 : 5;
    const sortedPeriods = Array.from(dataByPeriod.entries())
      .sort((a, b) => {
        if (b[1].year !== a[1].year) return b[1].year - a[1].year;
        return (b[1].quarter ?? 0) - (a[1].quarter ?? 0);
      })
      .slice(0, periodLimit);

    // Helper to get metric for a period
    const getMetric = (periodEntry: typeof sortedPeriods[0], key: string): number | null => {
      const val = periodEntry[1].data[key];
      return typeof val === 'number' ? val : null;
    };

    // Build historical metrics using sortedPeriods
    const revenueHistory: HistoricalMetric[] = sortedPeriods.map(entry => ({
      year: entry[1].year,
      quarter: entry[1].quarter,
      value: getMetric(entry, 'totalRevenue'),
    }));

    const epsHistory: HistoricalMetric[] = sortedPeriods.map(entry => ({
      year: entry[1].year,
      quarter: entry[1].quarter,
      value: getMetric(entry, 'dilutedEPS') ?? getMetric(entry, 'basicEPS'),
    }));

    const fcfHistory: HistoricalMetric[] = sortedPeriods.map(entry => {
      const opCf = getMetric(entry, 'operatingCashFlow');
      const capex = getMetric(entry, 'capitalExpenditure');
      const fcf = opCf !== null && capex !== null ? opCf + capex : getMetric(entry, 'freeCashFlow');
      return { year: entry[1].year, quarter: entry[1].quarter, value: fcf };
    });

    const grossMarginHistory: HistoricalMetric[] = sortedPeriods.map(entry => {
      const revenue = getMetric(entry, 'totalRevenue');
      const grossProfit = getMetric(entry, 'grossProfit');
      return {
        year: entry[1].year,
        quarter: entry[1].quarter,
        value: revenue && grossProfit ? (grossProfit / revenue) * 100 : null,
      };
    });

    const operatingMarginHistory: HistoricalMetric[] = sortedPeriods.map(entry => {
      const revenue = getMetric(entry, 'totalRevenue');
      const opIncome = getMetric(entry, 'operatingIncome');
      return {
        year: entry[1].year,
        quarter: entry[1].quarter,
        value: revenue && opIncome ? (opIncome / revenue) * 100 : null,
      };
    });

    const netMarginHistory: HistoricalMetric[] = sortedPeriods.map(entry => {
      const revenue = getMetric(entry, 'totalRevenue');
      const netIncome = getMetric(entry, 'netIncome');
      return {
        year: entry[1].year,
        quarter: entry[1].quarter,
        value: revenue && netIncome ? (netIncome / revenue) * 100 : null,
      };
    });

    // Calculate growth rates
    const calcGrowthRate = (metrics: HistoricalMetric[]): number | null => {
      const validMetrics = metrics.filter(m => m.value !== null);
      if (validMetrics.length < 2) return null;
      const oldest = validMetrics[validMetrics.length - 1].value!;
      const newest = validMetrics[0].value!;
      if (oldest <= 0) return null;
      const years = validMetrics.length - 1;
      return (Math.pow(newest / oldest, 1 / years) - 1) * 100;
    };

    // Price milestones from chart data
    const quotes = chartResult.quotes.filter(q => q.close !== null);
    let allTimeHigh: number | null = null;
    let allTimeHighDate: Date | null = null;
    let allTimeLow: number | null = null;
    let allTimeLowDate: Date | null = null;

    for (const q of quotes) {
      if (q.close !== null) {
        if (allTimeHigh === null || q.close > allTimeHigh) {
          allTimeHigh = q.close;
          allTimeHighDate = q.date;
        }
        if (allTimeLow === null || q.close < allTimeLow) {
          allTimeLow = q.close;
          allTimeLowDate = q.date;
        }
      }
    }

    // Calculate returns
    const currentPrice = quotes[quotes.length - 1]?.close ?? null;
    const calcReturn = (targetDate: Date): number | null => {
      if (!currentPrice) return null;
      const quote = quotes.find(q => q.date >= targetDate);
      if (quote?.close) {
        return ((currentPrice - quote.close) / quote.close) * 100;
      }
      return null;
    };

    const now = new Date();
    const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
    const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3);
    const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);
    const oneYearAgo = new Date(now); oneYearAgo.setFullYear(now.getFullYear() - 1);
    const threeYearsAgo = new Date(now); threeYearsAgo.setFullYear(now.getFullYear() - 3);
    const fiveYearsAgo = new Date(now); fiveYearsAgo.setFullYear(now.getFullYear() - 5);
    const tenYearsAgo = new Date(now); tenYearsAgo.setFullYear(now.getFullYear() - 10);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Dividend history
    let dividendHistory: DividendHistory | null = null;
    const divYield = detail?.dividendYield ?? null;
    if (divYield && divYield > 0) {
      const fiveYrAvg = stats?.fiveYearAvgDividendYield;
      const payout = stats?.payoutRatio;
      dividendHistory = {
        currentYield: divYield * 100,
        fiveYearAvgYield: typeof fiveYrAvg === 'number' ? fiveYrAvg : null,
        payoutRatio: typeof payout === 'number' ? payout * 100 : null,
        dividendGrowthRate: null, // Would need more data
        consecutiveYears: null, // Would need more data
        annualDividends: [],
      };
    }

    const analysis: HistoricalAnalysis = {
      symbol: price.symbol ?? symbol.toUpperCase(),
      name: price.shortName ?? price.longName ?? symbol,
      period: actualPeriod,

      revenueHistory,
      revenueGrowthRate: calcGrowthRate(revenueHistory),

      epsHistory,
      epsGrowthRate: calcGrowthRate(epsHistory),

      fcfHistory,

      grossMarginHistory,
      operatingMarginHistory,
      netMarginHistory,

      peRatio: {
        current: detail?.trailingPE ?? null,
        fiveYearAvg: null, // Would need historical P/E data
        fiveYearHigh: null,
        fiveYearLow: null,
      },

      psRatio: {
        current: detail?.priceToSalesTrailing12Months ?? null,
        fiveYearAvg: null,
        fiveYearHigh: null,
        fiveYearLow: null,
      },

      evRevenue: typeof financial?.enterpriseToRevenue === 'number' ? financial.enterpriseToRevenue : null,
      evEbitda: typeof financial?.enterpriseToEbitda === 'number' ? financial.enterpriseToEbitda : null,
      evFcf: (() => {
        const ev = stats?.enterpriseValue;
        const latestFcf = fcfHistory[0]?.value;
        if (typeof ev === 'number' && latestFcf && latestFcf > 0) {
          return ev / latestFcf;
        }
        return null;
      })(),

      priceMilestones: {
        allTimeHigh,
        allTimeHighDate,
        allTimeLow,
        allTimeLowDate,
        fiftyTwoWeekHigh: detail?.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: detail?.fiftyTwoWeekLow ?? null,
      },

      dividendHistory,

      returns: {
        oneMonth: calcReturn(oneMonthAgo),
        threeMonth: calcReturn(threeMonthsAgo),
        sixMonth: calcReturn(sixMonthsAgo),
        ytd: calcReturn(yearStart),
        oneYear: calcReturn(oneYearAgo),
        threeYear: calcReturn(threeYearsAgo),
        fiveYear: calcReturn(fiveYearsAgo),
        tenYear: calcReturn(tenYearsAgo),
      },

      asOfDate: new Date(),
    };

    setCache(cacheKey, analysis, CACHE_TTL.quote * 4);
    return analysis;
  } catch {
    return null;
  }
}
