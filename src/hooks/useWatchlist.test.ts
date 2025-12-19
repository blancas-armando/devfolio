import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testHook, actSync } from '../test/hookTestUtils.js';
import { useWatchlist } from './useWatchlist.js';

// Mock the db functions
vi.mock('../db/watchlist.js', () => ({
  getWatchlist: vi.fn(() => ['AAPL', 'NVDA']),
  addToWatchlist: vi.fn(),
}));

describe('useWatchlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return stable callback references across renders', () => {
    const { result, rerender } = testHook(() => useWatchlist());

    const initialRefresh = result.current.refresh;
    const initialSeedDemoData = result.current.seedDemoData;

    // Trigger a rerender
    rerender();

    // Callbacks should be the same reference (stable)
    expect(result.current.refresh).toBe(initialRefresh);
    expect(result.current.seedDemoData).toBe(initialSeedDemoData);
  });

  it('should update symbols when refresh is called', () => {
    const { result } = testHook(() => useWatchlist());

    expect(result.current.symbols).toEqual([]);

    actSync(() => {
      result.current.refresh();
    });

    expect(result.current.symbols).toEqual(['AAPL', 'NVDA']);
  });

  it('should correctly report isEmpty', () => {
    const { result } = testHook(() => useWatchlist());

    expect(result.current.isEmpty).toBe(true);

    actSync(() => {
      result.current.refresh();
    });

    expect(result.current.isEmpty).toBe(false);
  });
});
