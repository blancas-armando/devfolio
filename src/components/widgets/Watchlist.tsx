import { Box, Text } from 'ink';
import { memo } from 'react';
import type { Quote } from '../../types/index.js';
import { colors } from '../../utils/colors.js';
import { formatCurrency, formatVolume, padRight } from '../../utils/format.js';
import { PriceChange } from './PriceChange.js';
import { Sparkline } from './Sparkline.js';

interface WatchlistProps {
  quotes: Quote[];
  historicalData?: Map<string, number[]>;
  isLoading?: boolean;
}

export const Watchlist = memo(function Watchlist({
  quotes,
  historicalData,
  isLoading = false,
}: WatchlistProps) {
  if (isLoading) {
    return (
      <Box flexDirection="column">
        <Text color={colors.textSecondary}>Loading watchlist...</Text>
      </Box>
    );
  }

  if (quotes.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color={colors.textSecondary}>
          No symbols in watchlist. Try "add AAPL to watchlist"
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.textTertiary}>
          {padRight('Symbol', 8)}
          {padRight('Price', 12)}
          {padRight('Change', 10)}
          {padRight('Volume', 10)}
          {'7D'}
        </Text>
      </Box>

      {/* Rows */}
      {quotes.map((quote) => (
        <Box key={quote.symbol}>
          <Text bold color={colors.text}>
            {padRight(quote.symbol, 8)}
          </Text>
          <Text color={colors.text}>
            {padRight(formatCurrency(quote.price), 12)}
          </Text>
          <Box width={10}>
            <PriceChange value={quote.changePercent} showArrow={false} />
          </Box>
          <Text color={colors.textSecondary}>
            {padRight(formatVolume(quote.volume), 10)}
          </Text>
          <Sparkline
            data={historicalData?.get(quote.symbol) || []}
            width={10}
          />
        </Box>
      ))}
    </Box>
  );
});
