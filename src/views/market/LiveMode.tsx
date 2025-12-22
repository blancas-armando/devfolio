/**
 * LiveMode Component
 *
 * Auto-refreshing view for real-time quote monitoring
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getQuotes, setLiveMode } from '../../services/market.js';
import type { Quote } from '../../types/index.js';
import { LIVE_MODE_INTERVAL_MS } from '../../constants/index.js';

interface LiveModeProps {
  symbols: string[];
  onStop?: () => void;
}

export function LiveModeView({ symbols, onStop }: LiveModeProps): React.ReactElement {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Enable live mode (bypasses cache)
    setLiveMode(true);

    const fetchQuotes = async () => {
      try {
        const data = await getQuotes(symbols, { fresh: true });
        setQuotes(data);
        setLastUpdate(new Date());
        setError(null);
      } catch (e) {
        setError('Failed to fetch quotes');
      }
    };

    // Initial fetch
    fetchQuotes();

    // Set up interval
    const interval = setInterval(fetchQuotes, LIVE_MODE_INTERVAL_MS);

    // Cleanup
    return () => {
      clearInterval(interval);
      setLiveMode(false);
    };
  }, [symbols.join(',')]);

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatChange = (change: number, percent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">LIVE MODE</Text>
        <Text color="gray"> - Refreshing every {LIVE_MODE_INTERVAL_MS / 1000}s</Text>
        <Text color="gray"> - Press Ctrl+C to stop</Text>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
        <Box marginBottom={1}>
          <Text bold>
            {'Symbol'.padEnd(8)}
            {'Price'.padStart(12)}
            {'Change'.padStart(20)}
            {'Volume'.padStart(14)}
          </Text>
        </Box>

        {error ? (
          <Text color="red">{error}</Text>
        ) : quotes.length === 0 ? (
          <Text color="gray">Loading...</Text>
        ) : (
          quotes.map((quote) => (
            <Box key={quote.symbol}>
              <Text bold color="white">{quote.symbol.padEnd(8)}</Text>
              <Text color="white">{('$' + formatPrice(quote.price)).padStart(12)}</Text>
              <Text color={quote.changePercent >= 0 ? 'green' : 'red'}>
                {formatChange(quote.change, quote.changePercent).padStart(20)}
              </Text>
              <Text color="gray">
                {(quote.volume ? (quote.volume / 1000000).toFixed(1) + 'M' : 'N/A').padStart(14)}
              </Text>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Last update: {lastUpdate.toLocaleTimeString()}</Text>
      </Box>
    </Box>
  );
}
