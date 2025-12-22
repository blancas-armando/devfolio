import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';

import { MarketBriefView } from '../views/market/MarketBrief.js';
import { MarketOverviewView } from '../views/market/MarketOverview.js';
import { MarketPulseView } from '../views/market/MarketPulse.js';
import { StockProfile } from '../views/stock/StockProfile.js';
import { HelpScreen } from '../views/screens/HelpScreen.js';
import { WelcomeScreen } from '../components/chrome/WelcomeScreen.js';

import type { MarketBrief as MarketBriefType } from '../services/brief.js';
import type { MarketOverview, CompanyProfile } from '../services/market.js';
import type { MarketPulse } from '../services/pulse.js';

const mockMarketBrief: MarketBriefType = {
  data: {
    asOfDate: new Date(),
    indices: [
      { symbol: 'SPY', name: 'S&P 500', price: 450.25, change: 5.50, changePercent: 1.24, weekChange: 2.5, monthChange: 4.2, ytdChange: null },
      { symbol: 'QQQ', name: 'Nasdaq', price: 380.10, change: 8.20, changePercent: 2.20, weekChange: 3.1, monthChange: 5.0, ytdChange: null },
    ],
    indicators: {
      vix: { name: 'VIX', value: 15.5, change: -0.3, changePercent: -1.9 },
      treasury10Y: null,
      dollarIndex: null,
      gold: null,
      oil: null,
      bitcoin: null,
    },
    sectors: [
      { name: 'Technology', symbol: 'XLK', changePercent: 2.5, weekChange: 3.0 },
      { name: 'Healthcare', symbol: 'XLV', changePercent: -0.5, weekChange: 1.2 },
    ],
    gainers: [
      { symbol: 'NVDA', name: 'NVIDIA', price: 450, change: 22.5, changePercent: 5.2, volume: 50000000, avgVolume: 40000000, marketCap: 1100000000000 },
    ],
    losers: [
      { symbol: 'XOM', name: 'Exxon', price: 100, change: -2.15, changePercent: -2.1, volume: 20000000, avgVolume: 18000000, marketCap: 450000000000 },
    ],
    breadth: {
      advancing: 300,
      declining: 200,
      unchanged: 10,
    },
    topNews: [],
    upcomingEarnings: [],
  },
  narrative: {
    headline: 'Markets Rally on Tech Strength',
    summary: 'Markets are up today driven by tech stocks.',
    sectorAnalysis: 'Technology leads with strong AI-driven growth.',
    keyThemes: ['Tech stocks rally', 'Energy sector weak'],
    outlook: 'Positive momentum expected to continue.',
  },
};

const mockMarketOverview: MarketOverview = {
  indices: [
    { symbol: 'SPY', name: 'S&P 500', price: 450.25, change: 5.50, changePercent: 1.24, dayHigh: 452.00, dayLow: 448.00 },
  ],
  sectors: [
    { name: 'Technology', symbol: 'XLK', changePercent: 2.5 },
  ],
  gainers: [{ symbol: 'AAPL', name: 'Apple Inc', price: 185.50, changePercent: 3.5 }],
  losers: [{ symbol: 'MSFT', name: 'Microsoft Corp', price: 375.20, changePercent: -1.2 }],
  vix: 15.5,
  breadth: { advancing: 300, declining: 200 },
  asOfDate: new Date(),
};

const mockMarketPulse: MarketPulse = {
  marketStatus: 'open',
  indices: [
    { symbol: 'SPY', name: 'S&P 500', price: 450.25, change: 5.50, changePercent: 1.24, dayHigh: 452.00, dayLow: 448.00 },
  ],
  vix: 15.5,
  breadth: { advancing: 300, declining: 200 },
  topSectors: [{ name: 'Technology', symbol: 'XLK', changePercent: 2.5 }],
  bottomSectors: [{ name: 'Energy', symbol: 'XLE', changePercent: -1.2 }],
  topMovers: [{ symbol: 'AAPL', name: 'Apple', price: 180, changePercent: 2.85 }],
  topHeadline: 'Tech stocks rally on AI optimism',
  futures: null,
  dxy: { price: 103.50, changePercent: 0.2 },
  watchlistSnapshot: [],
  alerts: [],
  aiTake: 'Markets showing strength',
  asOfDate: new Date(),
  config: {
    indexDropThreshold: 2.0,
    indexRiseThreshold: 2.0,
    vixThreshold: 20,
    moverThreshold: 5,
    showSectors: true,
    showIndicators: true,
    topMoversCount: 5,
  },
};

const mockStockProfile: CompanyProfile = {
  symbol: 'AAPL',
  name: 'Apple Inc',
  description: 'Technology company',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  website: 'https://apple.com',
  employees: 150000,
  price: 180.50,
  change: 2.30,
  changePercent: 1.29,
  high52w: 199.62,
  low52w: 124.17,
  avgVolume: 50000000,
  marketCap: 2800000000000,
  enterpriseValue: 2900000000000,
  sharesOutstanding: 15500000000,
  floatShares: 15400000000,
  beta: 1.25,
  revenue: 380000000000,
  revenueGrowth: 8.5,
  grossProfit: 165000000000,
  grossMargin: 43.5,
  operatingMargin: 30.2,
  profitMargin: 25.3,
  ebitda: 125000000000,
  netIncome: 95000000000,
  eps: 6.33,
  epsGrowth: 12.5,
  freeCashFlow: 95000000000,
  operatingCashFlow: 110000000000,
  capitalExpenditures: 15000000000,
  totalCash: 60000000000,
  totalDebt: 110000000000,
  debtToEquity: 180,
  currentRatio: 1.0,
  bookValue: 4.0,
  peRatio: 28.5,
  forwardPE: 25.2,
  pegRatio: 2.1,
  priceToSales: 7.5,
  priceToBook: 45.2,
  evToRevenue: 7.8,
  evToEbitda: 22.5,
  dividendYield: 0.5,
  dividendRate: 0.96,
  payoutRatio: 15,
  exDividendDate: '2024-02-09',
  targetPrice: 200,
  targetHigh: 220,
  targetLow: 180,
  recommendationKey: 'buy',
  numberOfAnalysts: 35,
  asOfDate: new Date(),
  oneMonthReturn: 3.2,
  threeMonthReturn: 8.5,
  sixMonthReturn: 12.4,
  ytdReturn: 15.2,
  oneYearReturn: 25.8,
  threeYearReturn: 45.2,
  fiveYearReturn: 120.5,
  tenYearReturn: 350.2,
  historicalPrices: [175, 178, 180, 179, 182, 180.5],
  historicalData: [
    { date: new Date('2024-01-01'), close: 175 },
    { date: new Date('2024-01-02'), close: 178 },
    { date: new Date('2024-01-03'), close: 180 },
    { date: new Date('2024-01-04'), close: 179 },
    { date: new Date('2024-01-05'), close: 182 },
    { date: new Date('2024-01-06'), close: 180.5 },
  ],
};

describe('View Components', () => {
  describe('MarketBrief', () => {
    it('renders without crashing', () => {
      const { lastFrame } = render(<MarketBriefView brief={mockMarketBrief} />);
      expect(lastFrame()).toBeTruthy();
    });

    it('displays the headline', () => {
      const { lastFrame } = render(<MarketBriefView brief={mockMarketBrief} />);
      expect(lastFrame()).toContain('Markets Rally');
    });

    it('displays index names', () => {
      const { lastFrame } = render(<MarketBriefView brief={mockMarketBrief} />);
      expect(lastFrame()).toContain('S&P 500');
    });
  });

  describe('MarketOverview', () => {
    it('renders without crashing', () => {
      const { lastFrame } = render(<MarketOverviewView overview={mockMarketOverview} />);
      expect(lastFrame()).toBeTruthy();
    });

    it('displays indices', () => {
      const { lastFrame } = render(<MarketOverviewView overview={mockMarketOverview} />);
      expect(lastFrame()).toContain('S&P 500');
    });
  });

  describe('MarketPulse', () => {
    it('renders without crashing', () => {
      const { lastFrame } = render(<MarketPulseView pulse={mockMarketPulse} />);
      expect(lastFrame()).toBeTruthy();
    });

    it('displays VIX', () => {
      const { lastFrame } = render(<MarketPulseView pulse={mockMarketPulse} />);
      expect(lastFrame()).toContain('VIX');
    });
  });

  describe('StockProfile', () => {
    it('renders without crashing', () => {
      const { lastFrame } = render(<StockProfile profile={mockStockProfile} />);
      expect(lastFrame()).toBeTruthy();
    });

    it('displays the symbol', () => {
      const { lastFrame } = render(<StockProfile profile={mockStockProfile} />);
      expect(lastFrame()).toContain('AAPL');
    });

    it('displays the company name', () => {
      const { lastFrame } = render(<StockProfile profile={mockStockProfile} />);
      expect(lastFrame()).toContain('Apple Inc');
    });

    it('displays the price', () => {
      const { lastFrame } = render(<StockProfile profile={mockStockProfile} />);
      expect(lastFrame()).toContain('180.50');
    });
  });

  describe('HelpScreen', () => {
    it('renders without crashing', () => {
      const { lastFrame } = render(<HelpScreen />);
      expect(lastFrame()).toBeTruthy();
    });

    it('displays command categories', () => {
      const { lastFrame } = render(<HelpScreen />);
      expect(lastFrame()).toContain('brief');
    });
  });

  describe('WelcomeScreen', () => {
    it('renders without crashing', () => {
      const { lastFrame } = render(<WelcomeScreen />);
      expect(lastFrame()).toBeTruthy();
    });

    it('displays the tagline', () => {
      const { lastFrame } = render(<WelcomeScreen />);
      expect(lastFrame()).toContain('AI-Powered');
    });
  });
});
