import { useState, useCallback } from 'react';
import { getWatchlist, addToWatchlist } from '../db/watchlist.js';
import { DEMO_WATCHLIST } from '../constants/index.js';

interface UseWatchlistResult {
  symbols: string[];
  refresh: () => void;
  seedDemoData: () => void;
  isEmpty: boolean;
}

export function useWatchlist(): UseWatchlistResult {
  const [symbols, setSymbols] = useState<string[]>([]);

  const refresh = useCallback(() => {
    const list = getWatchlist();
    setSymbols(list);
  }, []);

  const seedDemoData = useCallback(() => {
    addToWatchlist([...DEMO_WATCHLIST]);
  }, []);

  return {
    symbols,
    refresh,
    seedDemoData,
    isEmpty: symbols.length === 0,
  };
}
