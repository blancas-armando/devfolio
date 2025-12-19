import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { PortfolioSummary } from './PortfolioSummary.js';
import type { Portfolio } from '../../types/index.js';

const mockPortfolio: Portfolio = {
  holdings: [
    {
      symbol: 'AAPL',
      shares: 50,
      costBasis: 150,
      currentPrice: 190,
      value: 9500,
      gain: 2000,
      gainPercent: 26.67,
    },
    {
      symbol: 'NVDA',
      shares: 25,
      costBasis: 280,
      currentPrice: 450,
      value: 11250,
      gain: 4250,
      gainPercent: 60.71,
    },
  ],
  totalValue: 20750,
  totalCost: 14500,
  totalGain: 6250,
  totalGainPercent: 43.1,
};

const emptyPortfolio: Portfolio = {
  holdings: [],
  totalValue: 0,
  totalCost: 0,
  totalGain: 0,
  totalGainPercent: 0,
};

describe('PortfolioSummary', () => {
  it('should render loading state', () => {
    const { lastFrame } = render(
      <PortfolioSummary portfolio={emptyPortfolio} isLoading={true} />
    );

    expect(lastFrame()).toContain('Loading portfolio');
  });

  it('should render empty state when no holdings', () => {
    const { lastFrame } = render(
      <PortfolioSummary portfolio={emptyPortfolio} isLoading={false} />
    );

    expect(lastFrame()).toContain('No holdings');
  });

  it('should render portfolio with holdings', () => {
    const { lastFrame } = render(
      <PortfolioSummary portfolio={mockPortfolio} isLoading={false} />
    );

    const frame = lastFrame();
    expect(frame).toContain('AAPL');
    expect(frame).toContain('NVDA');
  });

  it('should sort holdings by value descending', () => {
    const { lastFrame } = render(
      <PortfolioSummary portfolio={mockPortfolio} isLoading={false} />
    );

    const frame = lastFrame();
    const nvdaIndex = frame?.indexOf('NVDA') ?? -1;
    const aaplIndex = frame?.indexOf('AAPL') ?? -1;

    // NVDA should appear before AAPL (higher value)
    expect(nvdaIndex).toBeLessThan(aaplIndex);
  });

  it('should not mutate original holdings array', () => {
    const originalHoldings = [...mockPortfolio.holdings];

    render(
      <PortfolioSummary portfolio={mockPortfolio} isLoading={false} />
    );

    // Original holdings should not be mutated
    expect(mockPortfolio.holdings).toEqual(originalHoldings);
  });
});
