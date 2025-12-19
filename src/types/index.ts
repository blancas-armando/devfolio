export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  high52w?: number;
  low52w?: number;
}

export interface HistoricalData {
  date: Date;
  close: number;
}

export interface Holding {
  id?: number;
  symbol: string;
  shares: number;
  costBasis: number;
  currentPrice?: number;
  value?: number;
  gain?: number;
  gainPercent?: number;
}

export interface Portfolio {
  holdings: Holding[];
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: Date;
}

export interface OptionsContract {
  strike: number;
  expiry: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number;
}

export interface OptionsChain {
  symbol: string;
  expiry: string;
  calls: OptionsContract[];
  puts: OptionsContract[];
}

export interface NewsItem {
  title: string;
  source: string;
  timestamp: Date;
  url: string;
}

export interface EarningsEvent {
  symbol: string;
  date: Date;
  time: 'BMO' | 'AMC' | 'TAS'; // Before market open, after market close, time after session
  estimate?: number;
  actual?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
  display?: 'watchlist' | 'portfolio' | 'stock' | 'options' | 'earnings' | 'news' | 'dashboard' | 'etf' | 'etf-compare' | 'stock-compare';
}

export type ViewType = 'dashboard' | 'stock' | 'options' | 'earnings' | 'news' | 'etf' | 'etf-compare' | 'stock-compare';

// ═══════════════════════════════════════════════════════════════════════════
// ETF Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ETFHolding {
  symbol: string;
  name: string;
  weight: number; // percentage
  // Performance metrics (fetched separately)
  price?: number;
  changePercent?: number; // daily change
  threeMonthReturn?: number; // 3-month return
  ytdReturn?: number; // year to date return
}

export interface ETFProfile {
  // Identity
  symbol: string;
  name: string;
  family: string | null;
  category: string | null;
  inceptionDate: Date | null;

  // Data timestamp
  asOfDate: Date;

  // Price & Yield
  price: number;
  change: number;
  changePercent: number;
  yield: number | null;

  // Costs & Size
  expenseRatio: number | null;
  totalAssets: number | null;

  // Holdings
  topHoldings: ETFHolding[];
  holdingsCount: number | null;

  // Allocation
  stockPosition: number | null;
  bondPosition: number | null;
  cashPosition: number | null;

  // Sector Weights
  sectorWeights: Record<string, number>;

  // Performance
  ytdReturn: number | null;
  oneYearReturn: number | null;
  threeYearReturn: number | null;
  fiveYearReturn: number | null;

  // Risk (for comparisons)
  beta: number | null;
  sharpeRatio: number | null;

  // Historical prices for charting
  historicalPrices: number[];
}
