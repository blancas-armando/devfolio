import { Box, Text } from 'ink';
import { memo } from 'react';
import type { Portfolio } from '../../types/index.js';
import { colors } from '../../utils/colors.js';
import { formatCurrency, formatPercent, padRight } from '../../utils/format.js';
import { PriceChange } from './PriceChange.js';
import { ProgressBar } from './ProgressBar.js';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  isLoading?: boolean;
}

export const PortfolioSummary = memo(function PortfolioSummary({
  portfolio,
  isLoading = false,
}: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <Box flexDirection="column">
        <Text color={colors.textSecondary}>Loading portfolio...</Text>
      </Box>
    );
  }

  if (portfolio.holdings.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color={colors.textSecondary}>
          No holdings. Try "I bought 50 AAPL at $150"
        </Text>
      </Box>
    );
  }

  // Calculate allocation percentages
  const allocations = portfolio.holdings.map((h) => ({
    symbol: h.symbol,
    value: h.value || 0,
    percent: ((h.value || 0) / portfolio.totalValue) * 100,
    gain: h.gainPercent || 0,
  }));

  // Sort by value descending
  allocations.sort((a, b) => b.value - a.value);

  return (
    <Box flexDirection="column">
      {/* Total value header */}
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color={colors.text}>
          {formatCurrency(portfolio.totalValue)}
        </Text>
        <Box>
          <PriceChange value={portfolio.totalGainPercent} />
          <Text color={colors.textSecondary}>
            {` (${formatCurrency(portfolio.totalGain)})`}
          </Text>
        </Box>
      </Box>

      {/* Allocation bars */}
      {allocations.map((alloc) => (
        <Box key={alloc.symbol} marginBottom={0}>
          <ProgressBar
            percent={alloc.percent}
            width={20}
            color={alloc.gain >= 0 ? colors.success : colors.danger}
            showPercent={false}
          />
          <Text color={colors.text}>
            {`  ${padRight(alloc.symbol, 6)}`}
          </Text>
          <Text color={colors.textSecondary}>
            {padRight(formatCurrency(alloc.value, true), 10)}
          </Text>
          <Text color={colors.textTertiary}>
            {`${alloc.percent.toFixed(0)}%`}
          </Text>
          <Text color={alloc.gain >= 0 ? colors.success : colors.danger}>
            {`  ${formatPercent(alloc.gain)}`}
          </Text>
        </Box>
      ))}
    </Box>
  );
});
