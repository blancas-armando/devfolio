/**
 * Crypto Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the coingecko provider
vi.mock('./providers/coingecko.js', () => ({
  getTopCoins: vi.fn(() =>
    Promise.resolve([
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        price_change_24h: 1000,
        price_change_percentage_24h: 2.0,
        total_volume: 30000000000,
        market_cap: 1000000000000,
        market_cap_rank: 1,
        high_24h: 51000,
        low_24h: 49000,
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 3000,
        price_change_24h: 50,
        price_change_percentage_24h: 1.5,
        total_volume: 15000000000,
        market_cap: 400000000000,
        market_cap_rank: 2,
        high_24h: 3100,
        low_24h: 2900,
      },
    ])
  ),
  symbolToId: vi.fn((symbol: string) => {
    const map: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
    };
    return map[symbol.toUpperCase()] ?? null;
  }),
  getCoinPrices: vi.fn(() =>
    Promise.resolve({
      bitcoin: { usd: 50000, usd_24h_change: 2.0 },
      ethereum: { usd: 3000, usd_24h_change: 1.5 },
    })
  ),
  getCoinDetails: vi.fn(),
  getGlobalMarket: vi.fn(),
  getTrendingCoins: vi.fn(),
  searchCoins: vi.fn(),
  getCoinHistory: vi.fn(),
}));

import {
  getTopCryptos,
  getCryptoQuote,
  getCryptoQuotes,
} from './crypto.js';

describe('Crypto Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTopCryptos', () => {
    it('should return top cryptocurrencies', async () => {
      const cryptos = await getTopCryptos(10);

      expect(cryptos).toHaveLength(2);
      expect(cryptos[0].symbol).toBe('BTC');
      expect(cryptos[0].name).toBe('Bitcoin');
      expect(cryptos[0].price).toBe(50000);
    });

    it('should map fields correctly', async () => {
      const cryptos = await getTopCryptos(10);

      const btc = cryptos[0];
      expect(btc.id).toBe('bitcoin');
      expect(btc.changePercent24h).toBe(2.0);
      expect(btc.volume24h).toBe(30000000000);
      expect(btc.marketCap).toBe(1000000000000);
      expect(btc.rank).toBe(1);
    });

    it('should return empty array on error', async () => {
      const { getTopCoins } = await import('./providers/coingecko.js');
      vi.mocked(getTopCoins).mockRejectedValueOnce(new Error('API error'));

      const cryptos = await getTopCryptos(10);
      expect(cryptos).toEqual([]);
    });
  });

  describe('getCryptoQuote', () => {
    it('should get quote for known symbol', async () => {
      const quote = await getCryptoQuote('BTC');

      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('BTC');
    });

    it('should return null for unknown symbol', async () => {
      const quote = await getCryptoQuote('UNKNOWN123');

      expect(quote).toBeNull();
    });
  });

  describe('getCryptoQuotes', () => {
    it('should get multiple quotes', async () => {
      const quotes = await getCryptoQuotes(['BTC', 'ETH']);

      expect(quotes).toHaveLength(2);
    });

    it('should filter out unknown symbols', async () => {
      const quotes = await getCryptoQuotes(['BTC', 'UNKNOWN', 'ETH']);

      expect(quotes).toHaveLength(2);
    });

    it('should return empty array for all unknown symbols', async () => {
      const quotes = await getCryptoQuotes(['UNKNOWN1', 'UNKNOWN2']);

      expect(quotes).toEqual([]);
    });
  });

  describe('Input validation', () => {
    it('should handle empty symbol', async () => {
      const quote = await getCryptoQuote('');
      expect(quote).toBeNull();
    });

    it('should handle symbols with spaces', async () => {
      const quote = await getCryptoQuote('  BTC  ');
      // Depends on implementation - might need trimming
    });

    it('should be case insensitive', async () => {
      const quote1 = await getCryptoQuote('btc');
      const quote2 = await getCryptoQuote('BTC');

      // Both should work
      expect(quote1).not.toBeNull();
    });
  });
});
