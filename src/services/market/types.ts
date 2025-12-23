/**
 * Market Service Types
 *
 * All type definitions for the market module.
 * Extracted from market.ts for better organization.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Company Profile
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
  freeCashFlow: number | null;
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;

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
  oneMonthReturn: number | null;
  threeMonthReturn: number | null;
  sixMonthReturn: number | null;
  ytdReturn: number | null;
  oneYearReturn: number | null;
  threeYearReturn: number | null;
  fiveYearReturn: number | null;
  tenYearReturn: number | null;
  historicalPrices: number[];
  historicalData: Array<{ date: Date; close: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Quote Options
// ═══════════════════════════════════════════════════════════════════════════

export interface GetQuoteOptions {
  /** Skip cache and fetch fresh data (default: false) */
  fresh?: boolean;
}

export interface GetProfileOptions {
  /** Skip cache and fetch fresh data (default: false) */
  fresh?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Historical Data
// ═══════════════════════════════════════════════════════════════════════════

export interface HistoricalDataPoint {
  date: Date;
  close: number;
}

export interface OHLCVBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartTimeframe = '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';

// ═══════════════════════════════════════════════════════════════════════════
// Intraday Data
// ═══════════════════════════════════════════════════════════════════════════

export interface IntradayBar {
  time: Date;
  price: number;
  volume: number;
}

export interface IntradayData {
  symbol: string;
  bars: IntradayBar[];
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface MarketContext {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  volumeVsAvg: number;
  high52w: number;
  low52w: number;
  distance52wHigh: number;
  distance52wLow: number;
  beta: number | null;
  pe: number | null;
  forwardPE: number | null;
  marketCap: number | null;
  sector: string;
  industry: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Performance Returns
// ═══════════════════════════════════════════════════════════════════════════

export interface PerformanceReturns {
  oneMonth: number | null;
  threeMonth: number | null;
  sixMonth: number | null;
  ytd: number | null;
  oneYear: number | null;
  threeYear: number | null;
  fiveYear: number | null;
  tenYear: number | null;
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
}

export interface SectorPerformance {
  sector: string;
  etf: string;
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
  vix: number | null;
  sectors: SectorPerformance[];
  gainers: MarketMover[];
  losers: MarketMover[];
  mostActive: MarketMover[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Events Calendar
// ═══════════════════════════════════════════════════════════════════════════

export interface EarningsEventInfo {
  symbol: string;
  date: Date;
  time: string;
  estimate: number | null;
}

export interface DividendEventInfo {
  symbol: string;
  exDate: Date;
  amount: number | null;
  yield: number | null;
}

export interface EventsCalendar {
  earnings: EarningsEventInfo[];
  dividends: DividendEventInfo[];
}

// ═══════════════════════════════════════════════════════════════════════════
// News
// ═══════════════════════════════════════════════════════════════════════════

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  summary?: string;
  thumbnail?: string;
}

export interface ArticleContent {
  title: string;
  content: string;
  source: string;
  publishedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// Market Brief
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
  history: number[];
}

export interface SectorWithContext {
  sector: string;
  etf: string;
  changePercent: number;
  weekChange: number | null;
  monthChange: number | null;
}

export interface MoverWithContext {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  sector: string | null;
}

export interface UpcomingEarnings {
  symbol: string;
  date: Date;
  time: string;
}

export interface MarketBriefData {
  asOfDate: Date;
  marketStatus: 'pre' | 'open' | 'post' | 'closed';
  indices: IndexWithHistory[];
  indicators: MarketIndicator[];
  vix: MarketIndicator | null;
  dxy: MarketIndicator | null;
  sectors: SectorWithContext[];
  topGainers: MoverWithContext[];
  topLosers: MoverWithContext[];
  mostActive: MoverWithContext[];
  upcomingEarnings: UpcomingEarnings[];
  headlines: NewsArticle[];
  watchlistQuotes: Array<{
    symbol: string;
    price: number;
    changePercent: number;
    volume: number;
  }>;
}
