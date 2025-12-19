import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { Watchlist } from './Watchlist.js';
import type { Quote } from '../../types/index.js';

const mockQuotes: Quote[] = [
  {
    symbol: 'AAPL',
    price: 190.5,
    change: 2.5,
    changePercent: 1.33,
    volume: 50000000,
  },
  {
    symbol: 'NVDA',
    price: 450.0,
    change: -5.0,
    changePercent: -1.1,
    volume: 30000000,
  },
];

const mockHistoricalData = new Map([
  ['AAPL', [185, 186, 188, 189, 190, 190.5]],
  ['NVDA', [460, 458, 455, 452, 450, 450]],
]);

describe('Watchlist', () => {
  it('should render loading state', () => {
    const { lastFrame } = render(
      <Watchlist quotes={[]} isLoading={true} />
    );

    expect(lastFrame()).toContain('Loading watchlist');
  });

  it('should render empty state when no quotes', () => {
    const { lastFrame } = render(
      <Watchlist quotes={[]} isLoading={false} />
    );

    expect(lastFrame()).toContain('No symbols in watchlist');
  });

  it('should render quotes with symbols and prices', () => {
    const { lastFrame } = render(
      <Watchlist
        quotes={mockQuotes}
        historicalData={mockHistoricalData}
        isLoading={false}
      />
    );

    const frame = lastFrame();
    expect(frame).toContain('AAPL');
    expect(frame).toContain('NVDA');
    expect(frame).toContain('Symbol');
    expect(frame).toContain('Price');
    expect(frame).toContain('Change');
  });

  it('should not rerender when props are the same', () => {
    const { rerender, lastFrame } = render(
      <Watchlist
        quotes={mockQuotes}
        historicalData={mockHistoricalData}
        isLoading={false}
      />
    );

    const firstFrame = lastFrame();

    // Rerender with same props
    rerender(
      <Watchlist
        quotes={mockQuotes}
        historicalData={mockHistoricalData}
        isLoading={false}
      />
    );

    const secondFrame = lastFrame();

    // Frames should be identical
    expect(firstFrame).toBe(secondFrame);
  });
});
