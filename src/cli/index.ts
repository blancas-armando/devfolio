/**
 * CLI Main Entry Point
 * REPL loop and command routing with tab completion and Ctrl+C cancellation
 */

import * as readline from 'readline';
import chalk from 'chalk';
import { streamChat } from '../ai/agent.js';
import { getWatchlist, addToWatchlist } from '../db/watchlist.js';
import { addHolding } from '../db/portfolio.js';
import { DEMO_WATCHLIST, DEMO_HOLDINGS } from '../constants/index.js';
import type { Message } from '../types/index.js';
import { showSpinner } from './ui.js';
import {
  parseStockCommand,
  parseReportCommand,
  parseEarningsCommand,
  parseETFCommand,
  parseCompareCommand,
  parseStockCompareCommand,
  parseWhyCommand,
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
} from './commands.js';

// ═══════════════════════════════════════════════════════════════════════════
// Tab Completion
// ═══════════════════════════════════════════════════════════════════════════

const COMMANDS = [
  'brief', 'b',
  'pulse',
  'screen',
  'watchlist', 'w',
  'portfolio', 'p',
  'news',
  'read',
  'help', 'h',
  'clear', 'home',
  'quit', 'q', 'exit',
  'add',
  'rm', 'remove',
  'filings', 'filing', 'sec',
  's', 'stock',
  'r', 'report', 'research',
  'e', 'earnings',
  'why',
  'etf',
  'compare', 'cs',
];

// Screener presets for tab completion
const SCREEN_PRESETS = [
  'gainers', 'losers', 'active', 'trending', 'value', 'growth', 'dividend',
  'tech', 'healthcare', 'finance', 'energy', 'consumer', 'industrial',
];

// Common stock symbols for completion
const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'UNH', 'HD', 'MA',
  'SPY', 'QQQ', 'VTI', 'VOO', 'IWM', 'VGT', 'VUG',
];

function completer(line: string): [string[], string] {
  const trimmed = line.trim().toLowerCase();

  // If empty or just starting, suggest commands
  if (!trimmed) {
    return [COMMANDS.slice(0, 10), line];
  }

  // If starts with a command that takes symbols, suggest symbols
  const symbolCommands = ['s ', 'stock ', 'r ', 'report ', 'e ', 'earnings ', 'why ', 'etf ', 'filings ', 'sec ', 'add ', 'news '];
  for (const cmd of symbolCommands) {
    if (trimmed.startsWith(cmd)) {
      const partial = trimmed.slice(cmd.length).toUpperCase();
      const matches = POPULAR_SYMBOLS.filter(s => s.startsWith(partial));
      return [matches.map(s => cmd.trim() + ' ' + s), line];
    }
  }

  // Compare commands - suggest symbols after first
  if (trimmed.startsWith('compare ') || trimmed.startsWith('cs ')) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const partial = (parts[parts.length - 1] || '').toUpperCase();
      const matches = POPULAR_SYMBOLS.filter(s => s.startsWith(partial));
      const prefix = parts.slice(0, -1).join(' ') + ' ';
      return [matches.map(s => prefix + s), line];
    }
  }

  // Screen command - suggest presets
  if (trimmed.startsWith('screen ')) {
    const partial = trimmed.slice(7).toLowerCase();
    const matches = SCREEN_PRESETS.filter(p => p.startsWith(partial));
    return [matches.map(p => 'screen ' + p), line];
  }

  // Otherwise, complete commands
  const matches = COMMANDS.filter(c => c.startsWith(trimmed));
  return [matches, line];
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Initialization
// ═══════════════════════════════════════════════════════════════════════════

function seedDemoData(): void {
  const watchlist = getWatchlist();
  if (watchlist.length === 0) {
    addToWatchlist([...DEMO_WATCHLIST]);
    for (const h of DEMO_HOLDINGS) {
      addHolding(h.symbol, h.shares, h.costBasis);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Cancellation Support
// ═══════════════════════════════════════════════════════════════════════════

let currentAbortController: AbortController | null = null;
let currentStopSpinner: (() => void) | null = null;

function cancelCurrentOperation(): boolean {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    if (currentStopSpinner) {
      currentStopSpinner();
      currentStopSpinner = null;
    }
    console.log('');
    console.log(chalk.yellow('  Operation cancelled'));
    console.log('');
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Application
// ═══════════════════════════════════════════════════════════════════════════

export async function run(): Promise<void> {
  // Initialize
  seedDemoData();

  // Show home screen
  showHomeScreen();

  // Create readline interface with tab completion
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    completer,
  });

  // Track chat history for context
  const chatHistory: Message[] = [];
  let isProcessing = false;

  // Handle Ctrl+C during operations
  process.on('SIGINT', () => {
    if (isProcessing && cancelCurrentOperation()) {
      isProcessing = false;
      // Re-prompt after cancellation
      setImmediate(() => prompt());
    } else {
      // Not processing, exit gracefully
      console.log('');
      console.log(chalk.dim('  Goodbye.'));
      console.log('');
      rl.close();
      process.exit(0);
    }
  });

  // Prompt function
  const prompt = (): void => {
    rl.question(chalk.magenta('> '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (isProcessing) {
        console.log(chalk.dim('  Please wait... (Ctrl+C to cancel)'));
        prompt();
        return;
      }

      isProcessing = true;
      currentAbortController = new AbortController();

      try {
        const cmd = trimmed.toLowerCase();

        // Built-in commands
        if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') {
          console.log('');
          console.log(chalk.dim('  Goodbye.'));
          console.log('');
          rl.close();
          process.exit(0);
        } else if (cmd === 'help' || cmd === 'h' || cmd === '?') {
          showHelp();
        } else if (cmd === 'clear' || cmd === 'home') {
          showHomeScreen();
        } else if (cmd === 'watchlist' || cmd === 'w' || cmd === 'cal' || cmd === 'calendar' || cmd === 'events') {
          currentStopSpinner = showSpinner('Fetching watchlist...');
          await showWatchlist();
          currentStopSpinner();
        } else if (cmd === 'portfolio' || cmd === 'p') {
          currentStopSpinner = showSpinner('Loading portfolio...');
          await showPortfolio();
          currentStopSpinner();
        } else if (cmd === 'brief' || cmd === 'b' || cmd === 'market' || cmd === 'm') {
          currentStopSpinner = showSpinner('Generating market brief...');
          await showBrief();
          currentStopSpinner();
        } else if (cmd === 'pulse') {
          currentStopSpinner = showSpinner('Checking market pulse...');
          await showPulse();
          currentStopSpinner();
        } else if (cmd === 'pulse config') {
          showPulseConfig();
        } else if (cmd.startsWith('pulse set ')) {
          handlePulseSet(trimmed);
        } else if (cmd === 'screen' || cmd.startsWith('screen ')) {
          const screenPreset = parseScreenCommand(trimmed);
          if (screenPreset === 'help') {
            showScreenerHelp();
          } else if (screenPreset) {
            currentStopSpinner = showSpinner(`Running ${screenPreset} screener...`);
            await showScreener(screenPreset);
            currentStopSpinner();
          } else {
            console.log('');
            console.log(chalk.red('  Unknown screener preset.'));
            showScreenerHelp();
          }
        } else if (cmd === 'news' || cmd.startsWith('news ')) {
          const newsMatch = trimmed.match(/^news\s+(.+)$/i);
          const newsSymbols = newsMatch
            ? newsMatch[1].split(/[\s,]+/).map(s => s.toUpperCase())
            : undefined;
          currentStopSpinner = showSpinner('Fetching news...');
          await showNews(newsSymbols);
          currentStopSpinner();
        } else if (cmd.startsWith('read ')) {
          const readMatch = trimmed.match(/^read\s+(\d+)$/i);
          if (readMatch) {
            const articleNum = parseInt(readMatch[1], 10);
            currentStopSpinner = showSpinner('Fetching article...');
            await readArticle(articleNum);
            currentStopSpinner();
          } else {
            console.log('');
            console.log(chalk.red('  Usage: read <number> (e.g., read 1)'));
            console.log('');
          }
        } else if (cmd.startsWith('filings ') || cmd.startsWith('sec ')) {
          const filingsMatch = trimmed.match(/^(?:filings|sec)\s+([A-Za-z]{1,5})$/i);
          if (filingsMatch) {
            const symbol = filingsMatch[1].toUpperCase();
            currentStopSpinner = showSpinner(`Fetching SEC filings for ${symbol}...`);
            await showFilings(symbol);
            currentStopSpinner();
          } else {
            console.log('');
            console.log(chalk.red('  Usage: filings <symbol> (e.g., filings AAPL)'));
            console.log('');
          }
        } else if (cmd.startsWith('filing ')) {
          const filingMatch = trimmed.match(/^filing\s+(\d+)$/i);
          if (filingMatch) {
            const filingNum = parseInt(filingMatch[1], 10);
            currentStopSpinner = showSpinner('Fetching filing...');
            await showFilingContent(filingNum);
            currentStopSpinner();
          } else {
            console.log('');
            console.log(chalk.red('  Usage: filing <number> (e.g., filing 1)'));
            console.log('');
          }
        } else if (cmd.startsWith('add ')) {
          handleAddToWatchlist(trimmed);
        } else if (cmd.startsWith('rm ') || cmd.startsWith('remove ')) {
          handleRemoveFromWatchlist(trimmed);
        } else {
          // Check for why command first (before stock command)
          const whySymbol = parseWhyCommand(trimmed);
          if (whySymbol) {
            currentStopSpinner = showSpinner(`Analyzing why ${whySymbol} is moving...`);
            await showWhy(whySymbol);
            currentStopSpinner();
          } else {
          // Check parsed commands
          const reportTicker = parseReportCommand(trimmed);
          if (reportTicker) {
            currentStopSpinner = showSpinner(`Generating ${reportTicker} research report...`);
            await showReport(reportTicker);
            currentStopSpinner();
          } else {
            const earningsTicker = parseEarningsCommand(trimmed);
            if (earningsTicker) {
              currentStopSpinner = showSpinner(`Generating ${earningsTicker} earnings report (SEC + Yahoo)...`);
              await showEarnings(earningsTicker);
              currentStopSpinner();
            } else {
              const etfTicker = parseETFCommand(trimmed);
              if (etfTicker) {
                currentStopSpinner = showSpinner(`Fetching ${etfTicker} ETF profile...`);
                await showETF(etfTicker);
                currentStopSpinner();
              } else {
                const compareSymbols = parseCompareCommand(trimmed);
                if (compareSymbols) {
                  currentStopSpinner = showSpinner(`Comparing ETFs ${compareSymbols.join(', ')}...`);
                  await showETFComparison(compareSymbols);
                  currentStopSpinner();
                } else {
                  const stockCompareSymbols = parseStockCompareCommand(trimmed);
                  if (stockCompareSymbols) {
                    currentStopSpinner = showSpinner(`Comparing stocks ${stockCompareSymbols.join(', ')}...`);
                    await showStockComparison(stockCompareSymbols);
                    currentStopSpinner();
                  } else {
                    const ticker = parseStockCommand(trimmed);
                    if (ticker) {
                      currentStopSpinner = showSpinner(`Fetching ${ticker} profile...`);
                      await showStock(ticker);
                      currentStopSpinner();
                    } else {
                      // Send to AI with streaming
                      console.log('');
                      process.stdout.write(chalk.dim('  '));
                      currentStopSpinner = showSpinner('Thinking...');
                      let firstToken = true;

                      const response = await streamChat(
                        trimmed,
                        chatHistory,
                        (token: string) => {
                          if (firstToken) {
                            if (currentStopSpinner) currentStopSpinner();
                            process.stdout.write('\r\x1b[K'); // Clear spinner line
                            process.stdout.write(chalk.cyan('  '));
                            firstToken = false;
                          }
                          // Stream tokens with word wrapping at ~70 chars
                          process.stdout.write(token);
                        }
                      );
                      if (firstToken && currentStopSpinner) currentStopSpinner();
                      console.log('');

                      // Add to history
                      chatHistory.push({ role: 'user', content: trimmed });
                      chatHistory.push({ role: 'assistant', content: response.message });

                      // Handle tool results
                      for (const result of response.toolResults) {
                        if (result.display === 'watchlist') {
                          await showWatchlist();
                        } else if (result.display === 'portfolio') {
                          await showPortfolio();
                        } else if (result.display === 'stock' && result.result) {
                          const stockResult = result.result as { symbol?: string };
                          if (stockResult.symbol) {
                            await showStock(stockResult.symbol);
                          }
                        } else if (result.display === 'etf' && result.result) {
                          const etfResult = result.result as { symbol?: string };
                          if (etfResult.symbol) {
                            await showETF(etfResult.symbol);
                          }
                        } else if (result.display === 'etf-compare' && result.result) {
                          const compareResult = result.result as { symbols?: string[] };
                          if (compareResult.symbols && compareResult.symbols.length > 0) {
                            await showETFComparison(compareResult.symbols);
                          }
                        } else if (result.display === 'stock-compare' && result.result) {
                          const compareResult = result.result as { symbols?: string[] };
                          if (compareResult.symbols && compareResult.symbols.length > 0) {
                            await showStockComparison(compareResult.symbols);
                          }
                        }
                      }

                      console.log('');
                    }
                  }
                }
              }
            }
          }
        }
        }
      } catch (error) {
        // Check if it's an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          // Already handled by SIGINT handler
        } else {
          const msg = error instanceof Error ? error.message : 'Something went wrong';
          console.log('');
          console.log(chalk.red(`  Error: ${msg}`));
          console.log('');
        }
      } finally {
        isProcessing = false;
        currentAbortController = null;
        currentStopSpinner = null;
        prompt();
      }
    });
  };

  // Handle readline close
  rl.on('close', () => {
    console.log('');
    process.exit(0);
  });

  // Start prompting
  prompt();
}
