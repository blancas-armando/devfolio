import { Box, Text } from 'ink';
import { useEffect, useState, useCallback } from 'react';
import type { Quote, Portfolio } from '../../types/index.js';
import { getQuotes, getHistoricalDataBatch } from '../../services/market.js';
import { colors } from '../../utils/colors.js';
import { formatRelativeTime } from '../../utils/format.js';
import { Watchlist } from '../widgets/Watchlist.js';
import { PortfolioSummary } from '../widgets/PortfolioSummary.js';
import { Spinner } from '../widgets/Spinner.js';

interface DashboardProps {
  watchlistSymbols: string[];
  portfolio: Portfolio;
  onRefresh?: () => void;
}

export function Dashboard({
  watchlistSymbols,
  portfolio,
  onRefresh,
}: DashboardProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [historicalData, setHistoricalData] = useState<Map<string, number[]>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (watchlistSymbols.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const [quotesData, histData] = await Promise.all([
        getQuotes(watchlistSymbols),
        getHistoricalDataBatch(watchlistSymbols),
      ]);

      setQuotes(quotesData);
      setHistoricalData(histData);
      setLastUpdated(new Date());
    } catch (error) {
      // Silently fail, keep existing data
    } finally {
      setIsLoading(false);
    }
  }, [watchlistSymbols]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30_000);
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
}
