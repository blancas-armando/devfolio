import { Box, Text, useApp, useInput } from 'ink';
import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { Container } from './components/layout/Container.js';
import { Dashboard } from './components/views/Dashboard.js';
import { Spinner } from './components/widgets/Spinner.js';
import { chat } from './ai/agent.js';
import { getWatchlist, addToWatchlist } from './db/watchlist.js';
import { getPortfolio, addHolding } from './db/portfolio.js';
import type { Message, Portfolio, ViewType } from './types/index.js';
import { colors } from './utils/colors.js';

// Demo data for first-time users
const DEMO_WATCHLIST = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL'];
const DEMO_HOLDINGS = [
  { symbol: 'AAPL', shares: 50, costBasis: 150 },
  { symbol: 'NVDA', shares: 25, costBasis: 280 },
  { symbol: 'TSLA', shares: 30, costBasis: 220 },
];

export function App() {
  const { exit } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    holdings: [],
    totalValue: 0,
    totalCost: 0,
    totalGain: 0,
    totalGainPercent: 0,
  });
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState<string>('');
  const [hint, setHint] = useState<string>('try "show NVDA" or "add AMZN to watchlist"');

  // Initialize data
  useEffect(() => {
    async function init() {
      let currentWatchlist = getWatchlist();

      // If empty, add demo data
      if (currentWatchlist.length === 0) {
        addToWatchlist(DEMO_WATCHLIST);
        for (const h of DEMO_HOLDINGS) {
          addHolding(h.symbol, h.shares, h.costBasis);
        }
        currentWatchlist = getWatchlist();
      }

      setWatchlist(currentWatchlist);

      try {
        const p = await getPortfolio();
        setPortfolio(p);
      } catch (e) {
        // Silently fail, portfolio will be empty
      }

      setIsLoading(false);
    }

    init();
  }, []);

  // Handle keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
    if (key.escape) {
      setAssistantMessage('');
      setCurrentView('dashboard');
    }
  });

  // Handle user input
  const handleSubmit = useCallback(
    async (input: string) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setAssistantMessage('');
      setHint('');

      const userMessage: Message = { role: 'user', content: input };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await chat(input, messages);

        // Update state based on tool results
        for (const result of response.toolResults) {
          if (result.display === 'watchlist' || result.display === 'dashboard') {
            setWatchlist(getWatchlist());
          }
          if (result.display === 'portfolio' || result.display === 'dashboard') {
            const p = await getPortfolio();
            setPortfolio(p);
          }
        }

        setAssistantMessage(response.message);

        const assistantMsg: Message = { role: 'assistant', content: response.message };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Something went wrong';
        setAssistantMessage(`Error: ${errorMsg}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [messages, isProcessing]
  );

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setWatchlist(getWatchlist());
    const p = await getPortfolio();
    setPortfolio(p);
  }, []);

  if (isLoading) {
    return (
      <Container>
        <Box justifyContent="center" alignItems="center" minHeight={20}>
          <Spinner label="Loading DevFolio..." />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Header title="DevFolio" status="ESC to reset · Ctrl+C to exit" />

      <Box flexDirection="column" flexGrow={1}>
        <Dashboard
          watchlistSymbols={watchlist}
          portfolio={portfolio}
          onRefresh={handleRefresh}
        />

        {/* Assistant response */}
        {(assistantMessage || isProcessing) && (
          <Box paddingX={2} paddingY={1}>
            {isProcessing ? (
              <Spinner label="Thinking..." />
            ) : (
              <Text color={colors.textSecondary}>{assistantMessage}</Text>
            )}
          </Box>
        )}

        {/* Hint for new users */}
        {hint && !assistantMessage && (
          <Box paddingX={2}>
            <Text color={colors.textTertiary} dimColor>
              {hint}
            </Text>
          </Box>
        )}
      </Box>

      <Footer
        onSubmit={handleSubmit}
        isLoading={isProcessing}
        placeholder="Ask anything..."
      />
    </Container>
  );
}
