/**
 * Cryptocurrency Service
 * Provides crypto market data using CoinGecko
 */

import {
  getTopCoins,
  getCoinDetails,
  getGlobalMarket,
  getTrendingCoins,
  searchCoins,
  getCoinHistory,
  getCoinPrices,
  symbolToId,
  type CoinMarketData,
  type CoinDetails as CoinDetailsRaw,
} from './providers/coingecko.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
  high24h: number;
  low24h: number;
}

export interface CryptoProfile {
  id: string;
  symbol: string;
  name: string;
  description: string;
  rank: number;
  price: number;
  changePercent24h: number;
  changePercent7d: number;
  changePercent30d: number;
  changePercent1y: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  ath: number;
  athChangePercent: number;
  atl: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  categories: string[];
  website: string | null;
  github: string | null;
  sentiment: { up: number; down: number } | null;
}

export interface CryptoMarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChange24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptos: number;
  markets: number;
  topGainers: CryptoQuote[];
  topLosers: CryptoQuote[];
  trending: Array<{ symbol: string; name: string; rank: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Quote Functions
// ═══════════════════════════════════════════════════════════════════════════

function mapCoinToQuote(coin: CoinMarketData): CryptoQuote {
  return {
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    change24h: coin.price_change_24h,
    changePercent24h: coin.price_change_percentage_24h,
    volume24h: coin.total_volume,
    marketCap: coin.market_cap,
    rank: coin.market_cap_rank,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
  };
}

/**
 * Get top cryptocurrencies
 */
export async function getTopCryptos(limit = 50): Promise<CryptoQuote[]> {
  try {
    const coins = await getTopCoins(limit);
    return coins.map(mapCoinToQuote);
  } catch {
    return [];
  }
}

/**
 * Get crypto quote by symbol
 */
export async function getCryptoQuote(symbol: string): Promise<CryptoQuote | null> {
  const id = symbolToId(symbol);
  if (!id) {
    // Try searching
    try {
      const results = await searchCoins(symbol);
      if (results.coins.length === 0) return null;
      const firstMatch = results.coins[0];
      // Get price data
      const prices = await getCoinPrices([firstMatch.id]);
      const priceData = prices[firstMatch.id];
      if (!priceData) return null;

      return {
        id: firstMatch.id,
        symbol: firstMatch.symbol.toUpperCase(),
        name: firstMatch.name,
        price: priceData.usd,
        change24h: 0,
        changePercent24h: priceData.usd_24h_change,
        volume24h: 0,
        marketCap: 0,
        rank: firstMatch.market_cap_rank,
        high24h: 0,
        low24h: 0,
      };
    } catch {
      return null;
    }
  }

  try {
    const coins = await getTopCoins(100);
    const coin = coins.find(c => c.id === id);
    if (coin) return mapCoinToQuote(coin);

    // If not in top 100, get just the price
    const prices = await getCoinPrices([id]);
    const priceData = prices[id];
    if (!priceData) return null;

    return {
      id,
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: priceData.usd,
      change24h: 0,
      changePercent24h: priceData.usd_24h_change,
      volume24h: 0,
      marketCap: 0,
      rank: 0,
      high24h: 0,
      low24h: 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get multiple crypto quotes
 */
export async function getCryptoQuotes(symbols: string[]): Promise<CryptoQuote[]> {
  const ids = symbols.map(s => symbolToId(s)).filter((id): id is string => id !== null);

  if (ids.length === 0) return [];

  try {
    const prices = await getCoinPrices(ids);
    const quotes: CryptoQuote[] = [];

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const id = symbolToId(symbol);
      if (!id) continue;

      const priceData = prices[id];
      if (!priceData) continue;

      quotes.push({
        id,
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        price: priceData.usd,
        change24h: 0,
        changePercent24h: priceData.usd_24h_change,
        volume24h: 0,
        marketCap: 0,
        rank: 0,
        high24h: 0,
        low24h: 0,
      });
    }

    return quotes;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Profile Functions
// ═══════════════════════════════════════════════════════════════════════════

function mapCoinToProfile(coin: CoinDetailsRaw): CryptoProfile {
  return {
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    description: coin.description.en?.substring(0, 500) ?? '',
    rank: coin.market_cap_rank,
    price: coin.market_data.current_price.usd,
    changePercent24h: coin.market_data.price_change_percentage_24h,
    changePercent7d: coin.market_data.price_change_percentage_7d,
    changePercent30d: coin.market_data.price_change_percentage_30d,
    changePercent1y: coin.market_data.price_change_percentage_1y,
    marketCap: coin.market_data.market_cap.usd,
    volume24h: coin.market_data.total_volume.usd,
    high24h: coin.market_data.high_24h.usd,
    low24h: coin.market_data.low_24h.usd,
    ath: coin.market_data.ath.usd,
    athChangePercent: coin.market_data.ath_change_percentage.usd,
    atl: coin.market_data.atl.usd,
    circulatingSupply: coin.market_data.circulating_supply,
    totalSupply: coin.market_data.total_supply,
    maxSupply: coin.market_data.max_supply,
    categories: coin.categories ?? [],
    website: coin.links.homepage[0] ?? null,
    github: coin.links.repos_url.github[0] ?? null,
    sentiment: coin.sentiment_votes_up_percentage !== null ? {
      up: coin.sentiment_votes_up_percentage,
      down: coin.sentiment_votes_down_percentage ?? 0,
    } : null,
  };
}

/**
 * Get detailed crypto profile
 */
export async function getCryptoProfile(symbol: string): Promise<CryptoProfile | null> {
  let id = symbolToId(symbol);

  if (!id) {
    try {
      const results = await searchCoins(symbol);
      if (results.coins.length === 0) return null;
      id = results.coins[0].id;
    } catch {
      return null;
    }
  }

  try {
    const details = await getCoinDetails(id);
    return mapCoinToProfile(details);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Market Overview
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get crypto market overview
 */
export async function getCryptoMarketOverview(): Promise<CryptoMarketOverview | null> {
  try {
    const [globalData, topCoins, trending] = await Promise.all([
      getGlobalMarket(),
      getTopCoins(100),
      getTrendingCoins(),
    ]);

    const quotes = topCoins.map(mapCoinToQuote);

    // Sort for gainers and losers
    const sorted = [...quotes].sort((a, b) => b.changePercent24h - a.changePercent24h);
    const topGainers = sorted.slice(0, 5);
    const topLosers = sorted.slice(-5).reverse();

    return {
      totalMarketCap: globalData.data.total_market_cap.usd,
      totalVolume24h: globalData.data.total_volume.usd,
      marketCapChange24h: globalData.data.market_cap_change_percentage_24h_usd,
      btcDominance: globalData.data.market_cap_percentage.btc,
      ethDominance: globalData.data.market_cap_percentage.eth,
      activeCryptos: globalData.data.active_cryptocurrencies,
      markets: globalData.data.markets,
      topGainers,
      topLosers,
      trending: trending.slice(0, 5).map(t => ({
        symbol: t.item.symbol.toUpperCase(),
        name: t.item.name,
        rank: t.item.market_cap_rank,
      })),
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Historical Data
// ═══════════════════════════════════════════════════════════════════════════

export interface CryptoHistoricalData {
  timestamp: Date;
  price: number;
}

/**
 * Get historical price data
 */
export async function getCryptoHistory(
  symbol: string,
  days: number = 30
): Promise<CryptoHistoricalData[]> {
  const id = symbolToId(symbol);
  if (!id) return [];

  try {
    const data = await getCoinHistory(id, days);
    return data.prices.map(([timestamp, price]) => ({
      timestamp: new Date(timestamp),
      price,
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Search
// ═══════════════════════════════════════════════════════════════════════════

export interface CryptoSearchResult {
  id: string;
  symbol: string;
  name: string;
  rank: number | null;
}

/**
 * Search for cryptocurrencies
 */
export async function searchCrypto(query: string): Promise<CryptoSearchResult[]> {
  try {
    const results = await searchCoins(query);
    return results.coins.slice(0, 10).map(c => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      rank: c.market_cap_rank ?? null,
    }));
  } catch {
    return [];
  }
}
