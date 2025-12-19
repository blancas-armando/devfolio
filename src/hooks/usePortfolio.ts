import { useState, useCallback, useRef } from 'react';
import type { Portfolio } from '../types/index.js';
import { getPortfolio, addHolding } from '../db/portfolio.js';
import { DEMO_HOLDINGS } from '../constants/index.js';

const EMPTY_PORTFOLIO: Portfolio = {
  holdings: [],
  totalValue: 0,
  totalCost: 0,
  totalGain: 0,
  totalGainPercent: 0,
};

interface UsePortfolioResult {
  portfolio: Portfolio;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  seedDemoData: () => void;
}

export function usePortfolio(): UsePortfolioResult {
  const [portfolio, setPortfolio] = useState<Portfolio>(EMPTY_PORTFOLIO);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const p = await getPortfolio();
      setPortfolio(p);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load portfolio';
      setError(message);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, []);

  const seedDemoData = useCallback(() => {
    for (const h of DEMO_HOLDINGS) {
      addHolding(h.symbol, h.shares, h.costBasis);
    }
  }, []);

  return {
    portfolio,
    isLoading,
    error,
    refresh,
    seedDemoData,
  };
}
