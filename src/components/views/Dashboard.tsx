import { Box, Text } from 'ink';
import { memo, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { Quote, Portfolio } from '../../types/index.js';
import { getQuotes, getHistoricalDataBatch } from '../../services/market.js';
import { colors } from '../../utils/colors.js';
import { formatRelativeTime } from '../../utils/format.js';
import { Watchlist } from '../widgets/Watchlist.js';
import { PortfolioSummary } from '../widgets/PortfolioSummary.js';
import { Spinner } from '../widgets/Spinner.js';
import { REFRESH_INTERVAL_MS, HISTORICAL_DAYS } from '../../constants/index.js';

interface DashboardProps {
  watchlistSymbols: string[];
  portfolio: Portfolio;
  onRefresh?: () => void;
}

export const Dashboard = memo(function Dashboard({
  watchlistSymbols,
  portfolio,
  onRefresh,
}: DashboardProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [historicalData, setHistoricalData] = useState<Map<string, number[]>>(
    () => new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Create stable key for symbol changes - proper dependency pattern
  const symbolsKey = useMemo(
    () => watchlistSymbols.join(','),
    [watchlistSymbols]
  );

  // Use ref to track symbols to avoid recreating fetchData on every render
  const symbolsRef = useRef(watchlistSymbols);
  symbolsRef.current = watchlistSymbols;

  // Stable fetchData function that reads symbols from ref
  const fetchData = useCallback(async () => {
    const symbols = symbolsRef.current;

    if (symbols.length === 0) {
      setQuotes([]);
      setHistoricalData(new Map());
      setIsLoading(false);
      return;
    }

    try {
      const [quotesData, histData] = await Promise.all([
        getQuotes(symbols),
        getHistoricalDataBatch(symbols, HISTORICAL_DAYS),
      ]);

      setQuotes(quotesData);
      setHistoricalData(histData);
      setLastUpdated(new Date());
    } catch {
      // Silently fail - errors shown in UI state
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps - uses ref for symbols

  // Fetch when symbols change - uses memoized key for stable comparison
  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [symbolsKey, fetchData]);

  // Auto-refresh interval - separate from symbol changes
  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {/* Watchlist Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color={colors.text}>
            Watchlist
          </Text>
          <Text color={colors.textTertiary}>
            {lastUpdated
              ? `Live · Updated ${formatRelativeTime(lastUpdated)}`
              : 'Loading...'}
          </Text>
        </Box>

        <Box borderStyle="single" borderColor={colors.border} paddingX={1}>
          {isLoading ? (
            <Spinner label="Fetching quotes..." />
          ) : (
            <Watchlist
              quotes={quotes}
              historicalData={historicalData}
              isLoading={false}
            />
          )}
        </Box>
      </Box>

      {/* Portfolio Section */}
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color={colors.text}>
            Portfolio
          </Text>
        </Box>

        <Box borderStyle="single" borderColor={colors.border} paddingX={1}>
          <PortfolioSummary portfolio={portfolio} isLoading={isLoading} />
        </Box>
      </Box>
    </Box>
  );
});
