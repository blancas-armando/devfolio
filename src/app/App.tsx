/**
 * App Component
 *
 * Root Ink application component that manages
 * the main UI loop with input, output, and status.
 */

import React, { useState, useCallback } from 'react';
import { Box as InkBox, Text, useInput, useApp } from 'ink';
import { AppProvider, useAppState, useAppDispatch } from './AppContext.js';
import { CommandInput } from '../components/input/CommandInput.js';
import { OutputStream } from '../components/output/OutputBlock.js';
import { ProcessingIndicator } from '../components/output/Spinner.js';
import { StreamingText } from '../components/output/StreamingText.js';
import { WelcomeScreen } from '../components/chrome/WelcomeScreen.js';
import { StatusBar } from '../components/chrome/StatusBar.js';
import { createTextBlock, createErrorBlock, createCommandEchoBlock, createComponentBlock } from './types.js';
import { palette } from '../design/tokens.js';
import { addToHistory } from '../db/history.js';

// New React view components
import { HelpScreen } from '../views/screens/HelpScreen.js';

// Command handlers from existing CLI
import {
  parseStockCommand,
  parseReportCommand,
  parseEarningsCommand,
  parseETFCommand,
  parseCompareCommand,
  parseStockCompareCommand,
  parseWhyCommand,
  parseFinancialsCommand,
  parseScreenCommand,
  showStock,
  showStockComparison,
  showBrief,
  showNews,
  showReport,
  showEarnings,
  showETF,
  showETFComparison,
  showFilings,
  showFilingContent,
  showWhy,
  showFinancials,
  showPulse,
  showPulseConfig,
  handlePulseSet,
  showScreener,
  showScreenerHelp,
  readArticle,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
  showWatchlist,
  showPortfolio,
  showHomeScreen,
  showHelp,
} from '../cli/commands.js';

// Check if we're in a TTY environment
const isTTY = process.stdin.isTTY ?? false;

// ═══════════════════════════════════════════════════════════════════════════
// App Inner Component (uses context)
// ═══════════════════════════════════════════════════════════════════════════

function AppInner(): React.ReactElement {
  const { state, dispatch } = useAppState();
  const { exit } = useApp();

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Handle Ctrl+C
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      if (state.processing.isProcessing) {
        // Cancel current operation
        abortController?.abort();
        dispatch({ type: 'CANCEL_OPERATION' });
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock('Operation cancelled', 'warning'),
        });
      } else {
        // Exit app
        exit();
      }
    }

    // Ctrl+L - Clear and show home
    if (key.ctrl && input === 'l') {
      dispatch({ type: 'CLEAR_OUTPUT' });
    }
  }, { isActive: isTTY });

  // Handle command submission
  const handleSubmit = useCallback(async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    // Echo the command
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createCommandEchoBlock(trimmed),
    });

    // Hide welcome screen
    dispatch({ type: 'SHOW_WELCOME', show: false });

    // Add to history (exclude certain commands)
    const noHistoryCommands = ['exit', 'quit', 'q', 'help', '?', 'clear', 'home', 'history'];
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase();
    if (!noHistoryCommands.includes(firstWord)) {
      try {
        addToHistory(trimmed);
      } catch {
        // Ignore history errors
      }
    }

    // Start processing
    dispatch({ type: 'START_PROCESSING', operation: trimmed });
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Route command (using existing handlers for now)
      await routeCommand(trimmed, dispatch, controller.signal);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock(
            (error as Error).message || 'An error occurred',
            undefined,
            ['Try: help']
          ),
        });
      }
    } finally {
      dispatch({ type: 'STOP_PROCESSING' });
      setAbortController(null);
    }
  }, [dispatch]);

  return (
    <InkBox flexDirection="column" width="100%">
      {/* Welcome screen (when no output) */}
      {state.ui.showWelcome && state.output.blocks.length === 0 && (
        <WelcomeScreen version="0.2.0" />
      )}

      {/* Output stream */}
      <OutputStream
        blocks={state.output.blocks}
        streamingContent={state.output.streamingContent}
        isStreaming={state.output.isStreaming}
      />

      {/* Processing indicator */}
      {state.processing.isProcessing && !state.output.isStreaming && (
        <ProcessingIndicator operation={state.processing.currentOperation || 'Processing...'} />
      )}

      {/* Streaming indicator */}
      {state.output.isStreaming && state.output.streamingContent && (
        <InkBox marginTop={1} marginLeft={2}>
          <StreamingText content={state.output.streamingContent} complete={false} />
        </InkBox>
      )}

      {/* Spacer */}
      <InkBox marginTop={1} />

      {/* Command input */}
      <CommandInput
        onSubmit={handleSubmit}
        disabled={state.processing.isProcessing}
        modelName="llama-3.3-70b"
        showBorder={true}
        showHints={true}
        width="standard"
      />

      {/* Status bar */}
      <StatusBar
        modelName="llama-3.3-70b"
        isProcessing={state.processing.isProcessing}
      />
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Command Router (bridges to existing CLI handlers)
// ═══════════════════════════════════════════════════════════════════════════

async function routeCommand(
  command: string,
  dispatch: React.Dispatch<any>,
  signal: AbortSignal
): Promise<void> {
  const trimmed = command.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];

  // Simple commands
  switch (cmd) {
    case 'clear':
    case 'home':
      dispatch({ type: 'CLEAR_OUTPUT' });
      return;

    case 'help':
    case '?':
      // Use new React HelpScreen component
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createComponentBlock(<HelpScreen />),
      });
      return;

    case 'quit':
    case 'q':
    case 'exit':
      // Will be handled by the app
      process.exit(0);
  }

  // Commands that call existing display functions
  // These will still use console.log for now - a full migration would
  // convert each display function to return React components

  // Stock command
  const stockCmd = parseStockCommand(command);
  if (stockCmd) {
    await showStock(stockCmd.symbol, stockCmd.timeframe);
    return;
  }

  // Brief
  if (cmd === 'b' || cmd === 'brief') {
    await showBrief();
    return;
  }

  // Pulse
  if (cmd === 'pulse') {
    if (parts[1] === 'config') {
      await showPulseConfig();
    } else if (parts[1] === 'set') {
      await handlePulseSet(parts.slice(2).join(' '));
    } else {
      await showPulse();
    }
    return;
  }

  // Watchlist
  if (cmd === 'w' || cmd === 'watchlist') {
    await showWatchlist();
    return;
  }

  // Portfolio
  if (cmd === 'p' || cmd === 'portfolio') {
    await showPortfolio();
    return;
  }

  // News
  if (cmd === 'n' || cmd === 'news') {
    const symbol = parts[1]?.toUpperCase();
    await showNews(symbol ? [symbol] : undefined);
    return;
  }

  // Read article
  if (cmd === 'read') {
    const num = parseInt(parts[1], 10);
    if (!isNaN(num)) {
      await readArticle(num);
    }
    return;
  }

  // Report
  const reportSymbol = parseReportCommand(command);
  if (reportSymbol) {
    await showReport(reportSymbol);
    return;
  }

  // Earnings
  const earningsSymbol = parseEarningsCommand(command);
  if (earningsSymbol) {
    await showEarnings(earningsSymbol);
    return;
  }

  // ETF
  const etfSymbol = parseETFCommand(command);
  if (etfSymbol) {
    await showETF(etfSymbol);
    return;
  }

  // Compare ETFs
  const compareSymbols = parseCompareCommand(command);
  if (compareSymbols) {
    await showETFComparison(compareSymbols);
    return;
  }

  // Compare stocks
  const stockCompareSymbols = parseStockCompareCommand(command);
  if (stockCompareSymbols) {
    await showStockComparison(stockCompareSymbols);
    return;
  }

  // Why
  const whySymbol = parseWhyCommand(command);
  if (whySymbol) {
    await showWhy(whySymbol);
    return;
  }

  // Financials
  const finCmd = parseFinancialsCommand(command);
  if (finCmd) {
    await showFinancials(finCmd.symbol, finCmd.type);
    return;
  }

  // Screener
  const screenCmd = parseScreenCommand(command);
  if (screenCmd !== null) {
    if (screenCmd === 'help') {
      await showScreenerHelp();
    } else {
      await showScreener(screenCmd);
    }
    return;
  }

  // Filings
  if (cmd === 'filings' || cmd === 'sec') {
    const symbol = parts[1]?.toUpperCase();
    if (symbol) {
      await showFilings(symbol);
    }
    return;
  }

  // Filing content
  if (cmd === 'filing') {
    const num = parseInt(parts[1], 10);
    if (!isNaN(num)) {
      await showFilingContent(num);
    }
    return;
  }

  // Add to watchlist
  if (cmd === 'add') {
    const symbol = parts[1]?.toUpperCase();
    if (symbol) {
      await handleAddToWatchlist(symbol);
    }
    return;
  }

  // Remove from watchlist
  if (cmd === 'rm' || cmd === 'remove') {
    const symbol = parts[1]?.toUpperCase();
    if (symbol) {
      await handleRemoveFromWatchlist(symbol);
    }
    return;
  }

  // Unknown command - treat as chat
  dispatch({
    type: 'APPEND_OUTPUT',
    block: createTextBlock(
      `Unknown command: ${command}. Type 'help' for available commands.`,
      'warning'
    ),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Main App Export
// ═══════════════════════════════════════════════════════════════════════════

export function App(): React.ReactElement {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
