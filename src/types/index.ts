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
  display?: 'watchlist' | 'portfolio' | 'stock' | 'options' | 'earnings' | 'news' | 'dashboard';
}

export type ViewType = 'dashboard' | 'stock' | 'options' | 'earnings' | 'news';
