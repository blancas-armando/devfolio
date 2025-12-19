import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testHook, actAsync } from '../test/hookTestUtils.js';
import { usePortfolio } from './usePortfolio.js';

const mockPortfolio = {
  holdings: [
    { symbol: 'AAPL', shares: 50, costBasis: 150, value: 9500, gainPercent: 26.67 },
  ],
  totalValue: 9500,
  totalCost: 7500,
  totalGain: 2000,
  totalGainPercent: 26.67,
};

// Mock the db functions
vi.mock('../db/portfolio.js', () => ({
  getPortfolio: vi.fn(() => Promise.resolve(mockPortfolio)),
  addHolding: vi.fn(),
}));

describe('usePortfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return stable callback references across renders', () => {
    const { result, rerender } = testHook(() => usePortfolio());

    const initialRefresh = result.current.refresh;
    const initialSeedDemoData = result.current.seedDemoData;

    // Trigger a rerender
    rerender();

    // Callbacks should be the same reference (stable)
    expect(result.current.refresh).toBe(initialRefresh);
    expect(result.current.seedDemoData).toBe(initialSeedDemoData);
  });

  it('should start with empty portfolio', () => {
    const { result } = testHook(() => usePortfolio());

    expect(result.current.portfolio.holdings).toEqual([]);
    expect(result.current.portfolio.totalValue).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update portfolio when refresh is called', async () => {
    const { result } = testHook(() => usePortfolio());

    await actAsync(async () => {
      await result.current.refresh();
    });

    expect(result.current.portfolio).toEqual(mockPortfolio);
  });

  it('should handle refresh errors gracefully', async () => {
    const { getPortfolio } = await import('../db/portfolio.js');
    vi.mocked(getPortfolio).mockRejectedValueOnce(new Error('Network error'));

    const { result } = testHook(() => usePortfolio());

    await actAsync(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe('Network error');
  });
});
