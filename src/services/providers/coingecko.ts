/**
 * CoinGecko API Client
 * Free public API for cryptocurrency data
 * Rate limit: ~10-30 calls/minute on free tier
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Simple in-memory cache to respect rate limits
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 60000; // 1 minute cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

async function fetchCoinGecko<T>(endpoint: string): Promise<T> {
  const cacheKey = `cg:${endpoint}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${COINGECKO_BASE_URL}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json() as T;
  setCache(cacheKey, data);
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

export interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    price_change_percentage_1y: number;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
    atl: { usd: number };
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
  };
  market_cap_rank: number;
  categories: string[];
  sentiment_votes_up_percentage: number | null;
  sentiment_votes_down_percentage: number | null;
}

export interface GlobalMarketData {
  data: {
    active_cryptocurrencies: number;
    markets: number;
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth: number };
    market_cap_change_percentage_24h_usd: number;
  };
}

export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    price_btc: number;
    score: number;
  };
}

export interface SearchResult {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get top cryptocurrencies by market cap
 */
export async function getTopCoins(
  limit = 50,
  page = 1,
  sparkline = false
): Promise<CoinMarketData[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: String(limit),
    page: String(page),
    sparkline: String(sparkline),
    price_change_percentage: '24h,7d,30d',
  });

  return fetchCoinGecko<CoinMarketData[]>(`/coins/markets?${params}`);
}

/**
 * Get coin details by ID
 */
export async function getCoinDetails(id: string): Promise<CoinDetails> {
  const params = new URLSearchParams({
    localization: 'false',
    tickers: 'false',
    market_data: 'true',
    community_data: 'false',
    developer_data: 'false',
  });

  return fetchCoinGecko<CoinDetails>(`/coins/${id}?${params}`);
}

/**
 * Get global market data
 */
export async function getGlobalMarket(): Promise<GlobalMarketData> {
  return fetchCoinGecko<GlobalMarketData>('/global');
}

/**
 * Get trending coins (top 7 by search)
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  const data = await fetchCoinGecko<{ coins: TrendingCoin[] }>('/search/trending');
  return data.coins;
}

/**
 * Search for coins
 */
export async function searchCoins(query: string): Promise<SearchResult> {
  return fetchCoinGecko<SearchResult>(`/search?query=${encodeURIComponent(query)}`);
}

/**
 * Get historical price data
 */
export async function getCoinHistory(
  id: string,
  days: number | 'max'
): Promise<{ prices: [number, number][] }> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    days: String(days),
  });

  return fetchCoinGecko(`/coins/${id}/market_chart?${params}`);
}

/**
 * Get prices for specific coins
 */
export async function getCoinPrices(ids: string[]): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  const params = new URLSearchParams({
    ids: ids.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  });

  return fetchCoinGecko(`/simple/price?${params}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Symbol to ID Mapping (common coins)
// ═══════════════════════════════════════════════════════════════════════════

export const COMMON_COINS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  USDC: 'usd-coin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  SHIB: 'shiba-inu',
  DAI: 'dai',
  LTC: 'litecoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  XMR: 'monero',
  ETC: 'ethereum-classic',
  XLM: 'stellar',
  BCH: 'bitcoin-cash',
  APT: 'aptos',
  FIL: 'filecoin',
  NEAR: 'near',
  LDO: 'lido-dao',
  ARB: 'arbitrum',
  OP: 'optimism',
  AAVE: 'aave',
  ALGO: 'algorand',
};

export function symbolToId(symbol: string): string | null {
  return COMMON_COINS[symbol.toUpperCase()] ?? null;
}

export function idToSymbol(id: string): string | null {
  for (const [symbol, coinId] of Object.entries(COMMON_COINS)) {
    if (coinId === id) return symbol;
  }
  return null;
}
