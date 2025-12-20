/**
 * CLI Main Entry Point
 * REPL loop and command routing
 */

import * as readline from 'readline';
import chalk from 'chalk';
import { chat } from '../ai/agent.js';
import { getWatchlist, addToWatchlist } from '../db/watchlist.js';
import { addHolding } from '../db/portfolio.js';
import { DEMO_WATCHLIST, DEMO_HOLDINGS } from '../constants/index.js';
import type { Message } from '../types/index.js';
import { showSpinner, drawBox } from './ui.js';
import {
  parseStockCommand,
  parseReportCommand,
  parseEarningsCommand,
  parseETFCommand,
  parseCompareCommand,
  parseStockCompareCommand,
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
  readArticle,
  handleAddToWatchlist,
  handleRemoveFromWatchlist,
  showWatchlist,
  showPortfolio,
  showHomeScreen,
  showHelp,
} from './commands.js';

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
// Main Application
// ═══════════════════════════════════════════════════════════════════════════

export async function run(): Promise<void> {
  // Initialize
  seedDemoData();

  // Show home screen
  showHomeScreen();

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  // Track chat history for context
  const chatHistory: Message[] = [];
  let isProcessing = false;

  // Prompt function
  const prompt = (): void => {
    rl.question(chalk.magenta('> '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (isProcessing) {
        console.log(chalk.dim('  Please wait...'));
        prompt();
        return;
      }

      isProcessing = true;

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
          const stop = showSpinner('Fetching watchlist...');
          await showWatchlist();
          stop();
        } else if (cmd === 'portfolio' || cmd === 'p') {
          const stop = showSpinner('Loading portfolio...');
          await showPortfolio();
          stop();
        } else if (cmd === 'brief' || cmd === 'b' || cmd === 'market' || cmd === 'm') {
          const stop = showSpinner('Generating market brief...');
          await showBrief();
          stop();
        } else if (cmd === 'news' || cmd.startsWith('news ')) {
          const newsMatch = trimmed.match(/^news\s+(.+)$/i);
          const newsSymbols = newsMatch
            ? newsMatch[1].split(/[\s,]+/).map(s => s.toUpperCase())
            : undefined;
          const stop = showSpinner('Fetching news...');
          await showNews(newsSymbols);
          stop();
        } else if (cmd.startsWith('read ')) {
          const readMatch = trimmed.match(/^read\s+(\d+)$/i);
          if (readMatch) {
            const articleNum = parseInt(readMatch[1], 10);
            const stop = showSpinner('Fetching article...');
            await readArticle(articleNum);
            stop();
          } else {
            console.log('');
            console.log(chalk.red('  Usage: read <number> (e.g., read 1)'));
            console.log('');
          }
        } else if (cmd.startsWith('filings ') || cmd.startsWith('sec ')) {
          const filingsMatch = trimmed.match(/^(?:filings|sec)\s+([A-Za-z]{1,5})$/i);
          if (filingsMatch) {
            const symbol = filingsMatch[1].toUpperCase();
            const stop = showSpinner(`Fetching SEC filings for ${symbol}...`);
            await showFilings(symbol);
            stop();
          } else {
            console.log('');
            console.log(chalk.red('  Usage: filings <symbol> (e.g., filings AAPL)'));
            console.log('');
          }
        } else if (cmd.startsWith('filing ')) {
          const filingMatch = trimmed.match(/^filing\s+(\d+)$/i);
          if (filingMatch) {
            const filingNum = parseInt(filingMatch[1], 10);
            const stop = showSpinner('Fetching filing...');
            await showFilingContent(filingNum);
            stop();
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
          // Check parsed commands
          const reportTicker = parseReportCommand(trimmed);
          if (reportTicker) {
            const stop = showSpinner(`Generating ${reportTicker} research report...`);
            await showReport(reportTicker);
            stop();
          } else {
            const earningsTicker = parseEarningsCommand(trimmed);
            if (earningsTicker) {
              const stop = showSpinner(`Generating ${earningsTicker} earnings report (SEC + Yahoo)...`);
              await showEarnings(earningsTicker);
              stop();
            } else {
              const etfTicker = parseETFCommand(trimmed);
              if (etfTicker) {
                const stop = showSpinner(`Fetching ${etfTicker} ETF profile...`);
                await showETF(etfTicker);
                stop();
              } else {
                const compareSymbols = parseCompareCommand(trimmed);
                if (compareSymbols) {
                  const stop = showSpinner(`Comparing ETFs ${compareSymbols.join(', ')}...`);
                  await showETFComparison(compareSymbols);
                  stop();
                } else {
                  const stockCompareSymbols = parseStockCompareCommand(trimmed);
                  if (stockCompareSymbols) {
                    const stop = showSpinner(`Comparing stocks ${stockCompareSymbols.join(', ')}...`);
                    await showStockComparison(stockCompareSymbols);
                    stop();
                  } else {
                    const ticker = parseStockCommand(trimmed);
                    if (ticker) {
                      const stop = showSpinner(`Fetching ${ticker} profile...`);
                      await showStock(ticker);
                      stop();
                    } else {
                      // Send to AI
                      const stop = showSpinner('Thinking...');
                      const response = await chat(trimmed, chatHistory);
                      stop();

                      // Add to history
                      chatHistory.push({ role: 'user', content: trimmed });
                      chatHistory.push({ role: 'assistant', content: response.message });

                      // Print response in a box
                      console.log('');
                      const responseLines = response.message.split('\n').map(line =>
                        line.length > 52 ? line.substring(0, 49) + '...' : line
                      );
                      drawBox('Assistant', responseLines, 58);

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
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Something went wrong';
        console.log('');
        console.log(chalk.red(`  Error: ${msg}`));
        console.log('');
      } finally {
        isProcessing = false;
        prompt();
      }
    });
  };

  // Handle Ctrl+C gracefully
  rl.on('close', () => {
    console.log('');
    process.exit(0);
  });

  // Start prompting
  prompt();
}
