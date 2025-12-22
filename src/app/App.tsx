/**
 * App Component
 *
 * Root Ink application component that manages
 * the main UI loop with input, output, and status.
 */

import React, { useState, useCallback } from 'react';
import { Box as InkBox, Text, useInput, useApp } from 'ink';
import { AppProvider, useAppState } from './AppContext.js';
import { CommandInput } from '../components/input/CommandInput.js';
import { OutputStream } from '../components/output/OutputBlock.js';
import { ProcessingIndicator } from '../components/output/Spinner.js';
import { StreamingText } from '../components/output/StreamingText.js';
import { WelcomeScreen } from '../components/chrome/WelcomeScreen.js';
import { StatusBar } from '../components/chrome/StatusBar.js';
import { createTextBlock, createErrorBlock, createCommandEchoBlock, createComponentBlock } from './types.js';
import { addToHistory } from '../db/history.js';

// View Components
import { HelpScreen } from '../views/screens/HelpScreen.js';
import { MarketBriefView } from '../views/market/MarketBrief.js';
import { MarketPulseView } from '../views/market/MarketPulse.js';
import { StockProfile } from '../views/stock/StockProfile.js';
import { StockComparisonView } from '../views/stock/StockComparison.js';
import { NewsFeed } from '../views/news/NewsFeed.js';
import { ArticleView } from '../views/news/Article.js';
import { FilingsListView } from '../views/news/FilingsList.js';
import { WatchlistView } from '../views/portfolio/WatchlistView.js';
import { PortfolioView } from '../views/portfolio/PortfolioView.js';
import { ScreenerResultsView } from '../views/screener/ScreenerResults.js';
import { ResearchReportView } from '../views/research/ResearchReport.js';
import { EarningsReportView } from '../views/research/EarningsReport.js';
import { WhyExplanationView } from '../views/research/WhyExplanation.js';
import { FinancialsView } from '../views/research/FinancialsView.js';
import { HistoryView } from '../views/research/HistoryView.js';
import { ETFProfileView } from '../views/etf/ETFProfile.js';
import { ETFComparisonView } from '../views/etf/ETFComparison.js';
import { LiveModeView } from '../views/market/LiveMode.js';
import { StatsView } from '../views/debug/StatsView.js';
import { PreferencesView } from '../views/settings/PreferencesView.js';
import { RecallView } from '../views/chat/RecallView.js';

// Data Services
import { getMarketBrief } from '../services/brief.js';
import { getMarketPulse } from '../services/pulse.js';
import { getCompanyProfile, compareStocks, getNewsFeed, fetchArticleContent, getQuotes, getEventsCalendar } from '../services/market.js';
import { getQuickTake } from '../services/quicktake.js';
import { getRelatedStocks, runScreener, getAvailablePresets } from '../services/screener.js';
import { generateResearchReport } from '../services/research.js';
import { generateEarningsReport } from '../services/earnings.js';
import { getETFProfile, compareETFs } from '../services/etf.js';
import { getRecentFilings, getFilingText, getCompanyInfo } from '../services/sec.js';
import {
  searchFTS,
  compareRiskFactors,
  getProcessedFilings,
  processAndStoreFiling,
  getSearchStats,
  type SearchResult,
} from '../services/rag/index.js';
import {
  addWebhook,
  removeWebhook,
  getWebhooks,
  testWebhook,
  getWebhookStats,
} from '../alerts/webhook.js';
import { explainMovement } from '../services/why.js';
import { getAsciiLogo } from '../services/logo.js';
import { getFinancialStatements } from '../services/financials.js';
import { getHistoricalAnalysis } from '../services/history.js';
import {
  exportWatchlistCSV,
  exportPortfolioCSV,
  exportPreferencesJSON,
  exportHistoryCSV,
} from '../services/export.js';
import { chat } from '../ai/agent.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../db/watchlist.js';
import { getPortfolio } from '../db/portfolio.js';
import { getPulseConfig, updatePulseConfig } from '../db/config.js';
import { getAllPreferences, deletePreference, clearAllPreferences } from '../db/preferences.js';
import { getRecentMessages, searchMessages, getAllSessions, getAllTrackedSymbols } from '../db/memory.js';
import { findSimilarCommands, KNOWN_COMMANDS } from '../utils/fuzzy.js';

// Command parsers (still needed)
import {
  parseStockCommand,
  parseReportCommand,
  parseEarningsCommand,
  parseETFCommand,
  parseCompareCommand,
  parseStockCompareCommand,
  parseScreenCommand,
  parseWhyCommand,
  parseFinancialsCommand,
  parseHistoryCommand,
} from '../cli/commands.js';

// Shared state for article reading
let lastNewsArticles: Array<{ title: string; link: string; publisher: string; publishedAt: Date; symbols: string[] }> = [];
let lastFilings: Array<{ symbol: string; type: string; date: string; url: string; description?: string }> = [];
let lastFilingsSymbol = '';

// Track last refreshable command for 'r' shortcut
let lastRefreshableCommand = '';

// Commands that can be refreshed (data that changes over time)
const REFRESHABLE_COMMANDS = ['s', 'stock', 'w', 'watchlist', 'p', 'portfolio', 'pulse', 'b', 'brief', 'news', 'screen'];

const isTTY = process.stdin.isTTY ?? false;

function AppInner(): React.ReactElement {
  const { state, dispatch } = useAppState();
  const { exit } = useApp();
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Track if we should handle the 'r' key for refresh
  const [pendingRefresh, setPendingRefresh] = useState(false);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      if (state.processing.isProcessing) {
        abortController?.abort();
        dispatch({ type: 'CANCEL_OPERATION' });
        dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock('Operation cancelled', 'warning') });
      } else {
        exit();
      }
    }
    if (key.ctrl && input === 'l') {
      dispatch({ type: 'CLEAR_OUTPUT' });
    }
    // Ctrl+R to refresh last command
    if (key.ctrl && input === 'r' && !state.processing.isProcessing) {
      if (lastRefreshableCommand) {
        setPendingRefresh(true);
      } else {
        dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock('No command to refresh. Run a command first (e.g., s AAPL)', 'warning') });
      }
    }
  }, { isActive: isTTY });

  // Handle pending refresh outside of useInput to avoid async issues
  React.useEffect(() => {
    if (pendingRefresh && lastRefreshableCommand) {
      setPendingRefresh(false);
      handleSubmit(lastRefreshableCommand);
    }
  }, [pendingRefresh]);

  const handleSubmit = useCallback(async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    dispatch({ type: 'APPEND_OUTPUT', block: createCommandEchoBlock(trimmed) });
    dispatch({ type: 'SHOW_WELCOME', show: false });

    const noHistoryCommands = ['exit', 'quit', 'q', 'help', '?', 'clear', 'home', 'history'];
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase();
    if (!noHistoryCommands.includes(firstWord)) {
      try { addToHistory(trimmed); } catch { /* ignore */ }
    }

    dispatch({ type: 'START_PROCESSING', operation: trimmed });
    const controller = new AbortController();
    setAbortController(controller);

    try {
      await routeCommand(trimmed, dispatch);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock((error as Error).message || 'An error occurred', undefined, ['Try: help']),
        });
      }
    } finally {
      dispatch({ type: 'STOP_PROCESSING' });
      setAbortController(null);
    }
  }, [dispatch]);

  return (
    <InkBox flexDirection="column" width="100%">
      {state.ui.showWelcome && state.output.blocks.length === 0 && <WelcomeScreen version="1.0.0" />}
      <OutputStream blocks={state.output.blocks} streamingContent={state.output.streamingContent} isStreaming={state.output.isStreaming} />
      {state.processing.isProcessing && !state.output.isStreaming && (
        <ProcessingIndicator operation={state.processing.currentOperation || 'Processing...'} />
      )}
      {state.output.isStreaming && state.output.streamingContent && (
        <InkBox marginTop={1} marginLeft={2}>
          <StreamingText content={state.output.streamingContent} complete={false} />
        </InkBox>
      )}
      <InkBox marginTop={1} />
      <CommandInput onSubmit={handleSubmit} disabled={state.processing.isProcessing} modelName="llama-3.3-70b" showBorder={true} showHints={true} width="terminal" />
      <StatusBar modelName="llama-3.3-70b" isProcessing={state.processing.isProcessing} />
    </InkBox>
  );
}

async function routeCommand(command: string, dispatch: React.Dispatch<any>): Promise<void> {
  const trimmed = command.trim().toLowerCase();
  const originalCommand = command.trim();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];

  // Track refreshable commands for 'r' shortcut
  if (REFRESHABLE_COMMANDS.includes(cmd)) {
    lastRefreshableCommand = originalCommand;
  }

  // Utility commands
  if (cmd === 'clear' || cmd === 'home') {
    dispatch({ type: 'CLEAR_OUTPUT' });
    return;
  }

  if (cmd === 'help' || cmd === '?') {
    dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<HelpScreen />) });
    return;
  }

  if (cmd === 'quit' || cmd === 'q' || cmd === 'exit') {
    process.exit(0);
  }

  // Brief
  if (cmd === 'b' || cmd === 'brief') {
    try {
      const brief = await getMarketBrief();
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<MarketBriefView brief={brief} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to load market brief', ['Check network connection']) });
    }
    return;
  }

  // Pulse
  if (cmd === 'pulse') {
    if (parts[1] === 'config') {
      const config = getPulseConfig();
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createTextBlock(
          `Pulse Configuration:\n` +
          `  Index Drop Alert: ${config.indexDropThreshold}%\n` +
          `  Index Rise Alert: ${config.indexRiseThreshold}%\n` +
          `  VIX Alert: ${config.vixThreshold}\n` +
          `  Mover Threshold: ${config.moverThreshold}%\n` +
          `  Top Movers: ${config.topMoversCount}`,
          'info'
        ),
      });
    } else if (parts[1] === 'set' && parts[2] && parts[3]) {
      const key = parts[2];
      const value = parseFloat(parts[3]);
      if (!isNaN(value)) {
        const updates: any = {};
        if (key === 'vix') updates.vixThreshold = value;
        else if (key === 'drop') updates.indexDropThreshold = value;
        else if (key === 'rise') updates.indexRiseThreshold = value;
        else if (key === 'mover') updates.moverThreshold = value;
        if (Object.keys(updates).length > 0) {
          updatePulseConfig(updates);
          dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Updated ${key} to ${value}`, 'success') });
        }
      }
    } else {
      try {
        const pulse = await getMarketPulse();
        dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<MarketPulseView pulse={pulse} />) });
      } catch {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to load market pulse', ['Check network connection']) });
      }
    }
    return;
  }

  // Stock lookup
  const stockCmd = parseStockCommand(originalCommand);
  if (stockCmd) {
    try {
      const [profile, relatedStocks] = await Promise.all([
        getCompanyProfile(stockCmd.symbol, stockCmd.timeframe),
        getRelatedStocks(stockCmd.symbol),
      ]);
      if (!profile) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Symbol not found: ${stockCmd.symbol}`, ['Check the symbol is valid']) });
        return;
      }
      // Fetch quick take and logo in parallel (logo uses website from profile)
      const [quickTake, logo] = await Promise.all([
        getQuickTake(profile),
        getAsciiLogo(stockCmd.symbol, profile.website),
      ]);
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<StockProfile profile={profile} quickTake={quickTake} relatedStocks={relatedStocks} timeframe={stockCmd.timeframe} logo={logo} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Failed to load ${stockCmd.symbol}`, ['Check network connection']) });
    }
    return;
  }

  // Compare stocks
  const stockCompareSymbols = parseStockCompareCommand(originalCommand);
  if (stockCompareSymbols) {
    try {
      const stocks = await compareStocks(stockCompareSymbols);
      if (stocks.length === 0) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('No valid stocks found', ['Check the symbols']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<StockComparisonView stocks={stocks} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to compare stocks', ['Check network connection']) });
    }
    return;
  }

  // News
  if (cmd === 'n' || cmd === 'news') {
    const symbol = parts[1]?.toUpperCase();
    try {
      const articles = await getNewsFeed(symbol ? [symbol] : undefined);
      lastNewsArticles = articles;
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<NewsFeed articles={articles} symbols={symbol ? [symbol] : undefined} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to load news', ['Check network connection']) });
    }
    return;
  }

  // Read article
  if (cmd === 'read') {
    const num = parseInt(parts[1], 10);
    if (!isNaN(num) && num > 0 && num <= lastNewsArticles.length) {
      const article = lastNewsArticles[num - 1];
      try {
        const content = await fetchArticleContent(article.link);
        if (content) {
          dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<ArticleView article={content} url={article.link} />) });
        } else {
          dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Could not fetch article. Visit: ${article.link}`, 'warning') });
        }
      } catch {
        dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Could not fetch article. Visit: ${article.link}`, 'warning') });
      }
    } else {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Invalid article number', ['Use "news" to see available articles']) });
    }
    return;
  }

  // Watchlist
  if (cmd === 'w' || cmd === 'watchlist') {
    try {
      const symbols = getWatchlist();
      if (symbols.length === 0) {
        dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock('Watchlist is empty. Use "add SYMBOL" to add stocks.', 'info') });
        return;
      }
      const [quotes, calendar] = await Promise.all([
        getQuotes(symbols),
        getEventsCalendar(symbols),
      ]);
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<WatchlistView quotes={quotes} calendar={calendar} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to load watchlist', ['Check network connection']) });
    }
    return;
  }

  // Portfolio
  if (cmd === 'p' || cmd === 'portfolio') {
    try {
      const portfolio = await getPortfolio();
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<PortfolioView portfolio={portfolio} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to load portfolio', ['Check network connection']) });
    }
    return;
  }

  // Add to watchlist
  if (cmd === 'add') {
    const symbol = parts[1]?.toUpperCase();
    if (symbol) {
      addToWatchlist([symbol]);
      dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Added ${symbol} to watchlist`, 'success') });
    } else {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Missing symbol', ['Usage: add AAPL']) });
    }
    return;
  }

  // Remove from watchlist
  if (cmd === 'rm' || cmd === 'remove') {
    const symbol = parts[1]?.toUpperCase();
    if (symbol) {
      removeFromWatchlist([symbol]);
      dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Removed ${symbol} from watchlist`, 'success') });
    } else {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Missing symbol', ['Usage: rm AAPL']) });
    }
    return;
  }

  // Screener - normalize 'sc' to 'screen' for parsing
  const normalizedScreenCmd = originalCommand.replace(/^sc(\s|$)/i, 'screen$1');
  const screenCmd = parseScreenCommand(normalizedScreenCmd);
  if (screenCmd !== null) {
    if (screenCmd === 'help') {
      const presets = getAvailablePresets();
      const presetList = presets.map(p => `  ${p.id}: ${p.description}`).join('\n');
      dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Available screeners:\n${presetList}`, 'info') });
    } else {
      try {
        const results = await runScreener(screenCmd);
        if (!results) {
          dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Screener returned no results', ['Try a different preset']) });
          return;
        }
        dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<ScreenerResultsView screener={results} />) });
      } catch {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to run screener', ['Try: screen help']) });
      }
    }
    return;
  }

  // Research report
  const reportSymbol = parseReportCommand(originalCommand);
  if (reportSymbol) {
    try {
      const report = await generateResearchReport(reportSymbol);
      if (!report) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Could not generate report for ${reportSymbol}`, ['Check the symbol']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<ResearchReportView report={report} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to generate report', ['Check network connection']) });
    }
    return;
  }

  // Earnings report
  const earningsSymbol = parseEarningsCommand(originalCommand);
  if (earningsSymbol) {
    try {
      const report = await generateEarningsReport(earningsSymbol);
      if (!report) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Could not generate earnings report for ${earningsSymbol}`, ['Check the symbol']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<EarningsReportView report={report} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to generate earnings report', ['Check network connection']) });
    }
    return;
  }

  // ETF lookup
  const etfSymbol = parseETFCommand(originalCommand);
  if (etfSymbol) {
    try {
      const etf = await getETFProfile(etfSymbol);
      if (!etf) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`ETF not found: ${etfSymbol}`, ['Check the symbol']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<ETFProfileView etf={etf} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Failed to load ${etfSymbol}`, ['Check network connection']) });
    }
    return;
  }

  // Compare ETFs
  const compareSymbols = parseCompareCommand(originalCommand);
  if (compareSymbols) {
    try {
      const etfs = await compareETFs(compareSymbols);
      if (etfs.length === 0) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('No valid ETFs found', ['Check the symbols']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<ETFComparisonView etfs={etfs} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Failed to compare ETFs', ['Check network connection']) });
    }
    return;
  }

  // SEC Filings
  if (cmd === 'filings' || cmd === 'sec') {
    const symbol = parts[1]?.toUpperCase();
    const subCmd = parts[2]?.toLowerCase();

    if (!symbol) {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Missing symbol', ['Usage: filings AAPL', 'Usage: filings AAPL search <query>', 'Usage: filings AAPL risks']) });
      return;
    }

    // filings <SYM> search <query>
    if (subCmd === 'search' && parts.length > 3) {
      const query = parts.slice(3).join(' ');
      const results = searchFTS(query, { symbol, limit: 10 });

      if (results.length === 0) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Filing Search: ${symbol}\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            `No results found for "${query}"\n\n` +
            'Tip: Use "filings AAPL cache" to index filings first.',
            'warning'
          ),
        });
      } else {
        const output = results.map((r, i) => {
          const preview = r.content.substring(0, 200).replace(/\n/g, ' ') + '...';
          return `${i + 1}. [${r.form}] ${r.sectionName} (${r.filingDate})\n   ${preview}`;
        }).join('\n\n');

        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Filing Search: ${symbol} - "${query}"\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            output + '\n\n' +
            `Found ${results.length} matching chunks.`,
            'normal'
          ),
        });
      }
      return;
    }

    // filings <SYM> risks
    if (subCmd === 'risks') {
      const results = compareRiskFactors(symbol, 5);

      if (results.length === 0) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Risk Factors: ${symbol}\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            'No risk factors found.\n\n' +
            'Tip: Use "filings AAPL cache" to index filings first.',
            'warning'
          ),
        });
      } else {
        const output = results.map((r, i) => {
          const preview = r.content.substring(0, 300).replace(/\n/g, ' ') + '...';
          return `[${r.form} - ${r.filingDate}]\n${preview}`;
        }).join('\n\n' + String.fromCharCode(0x2500).repeat(30) + '\n\n');

        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Risk Factors Comparison: ${symbol}\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            output,
            'normal'
          ),
        });
      }
      return;
    }

    // filings <SYM> cache
    if (subCmd === 'cache') {
      dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Caching filings for ${symbol}...`, 'info') });

      try {
        const filings = await getRecentFilings(symbol);
        let cached = 0;

        for (const filing of filings.slice(0, 5)) { // Cache up to 5 most recent
          try {
            const text = await getFilingText({
              form: filing.form,
              filingDate: filing.filingDate,
              fileUrl: filing.fileUrl,
            } as any);

            if (text) {
              processAndStoreFiling(
                {
                  symbol,
                  form: filing.form,
                  filingDate: filing.filingDate,
                  accessionNumber: filing.fileUrl.split('/').pop()?.replace('.htm', '') || filing.fileUrl,
                  fileUrl: filing.fileUrl,
                },
                text
              );
              cached++;
            }
          } catch {
            // Skip filings that can't be fetched
          }
        }

        const stats = getSearchStats();
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Filing Cache: ${symbol}\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            `Cached ${cached} filings.\n\n` +
            `Total indexed: ${stats.filingCount} filings, ${stats.chunkCount} chunks\n` +
            `Symbols: ${stats.symbolCount}`,
            'success'
          ),
        });
      } catch {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Failed to cache filings for ${symbol}`, ['Check network connection']) });
      }
      return;
    }

    // filings <SYM> stats
    if (subCmd === 'stats') {
      const processed = getProcessedFilings(symbol);
      const stats = getSearchStats();

      if (processed.length === 0) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Filing Stats: ${symbol}\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            'No filings cached for this symbol.\n\n' +
            'Use "filings AAPL cache" to index filings.',
            'info'
          ),
        });
      } else {
        const output = processed.map(f =>
          `  ${f.form.padEnd(8)} ${f.filingDate}  (${f.chunkCount} chunks)`
        ).join('\n');

        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Filing Stats: ${symbol}\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            `Cached filings:\n${output}\n\n` +
            `Global: ${stats.filingCount} filings, ${stats.chunkCount} chunks across ${stats.symbolCount} symbols`,
            'info'
          ),
        });
      }
      return;
    }

    // Default: list filings
    try {
      const [filings, companyInfo] = await Promise.all([
        getRecentFilings(symbol),
        getCompanyInfo(symbol),
      ]);
      lastFilings = filings.map(f => ({ symbol, type: f.form, date: f.filingDate, url: f.fileUrl, description: f.description }));
      lastFilingsSymbol = symbol;
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<FilingsListView symbol={symbol} filings={filings} companyInfo={companyInfo} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Failed to load filings for ${symbol}`, ['Check network connection']) });
    }
    return;
  }

  // Read filing
  if (cmd === 'filing') {
    const num = parseInt(parts[1], 10);
    if (!isNaN(num) && num > 0 && num <= lastFilings.length) {
      const filing = lastFilings[num - 1];
      dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Loading filing ${filing.type}...`, 'info') });
      try {
        const text = await getFilingText({ form: filing.type, filingDate: filing.date, fileUrl: filing.url } as any);
        if (text) {
          dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(text.substring(0, 3000) + (text.length > 3000 ? '\n\n[Truncated...]' : ''), 'normal') });
        } else {
          dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Could not fetch filing. Visit: ${filing.url}`, 'warning') });
        }
      } catch {
        dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Could not fetch filing. Visit: ${filing.url}`, 'warning') });
      }
    } else {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Invalid filing number', ['Use "filings SYMBOL" to see available filings']) });
    }
    return;
  }

  // Why command - explain stock movement
  const whySymbol = parseWhyCommand(originalCommand);
  if (whySymbol) {
    try {
      const explanation = await explainMovement(whySymbol);
      if (!explanation) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Could not analyze movement for ${whySymbol}`, ['Check the symbol']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<WhyExplanationView explanation={explanation} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Failed to analyze ${whySymbol}`, ['Check network connection']) });
    }
    return;
  }

  // Financials command - financial statements
  const financialsResult = parseFinancialsCommand(originalCommand);
  if (financialsResult) {
    try {
      const statements = await getFinancialStatements(financialsResult.symbol, financialsResult.period);
      if (!statements) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Could not fetch financials for ${financialsResult.symbol}`, ['Check the symbol']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<FinancialsView statements={statements} statementType={financialsResult.type} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Failed to load financials for ${financialsResult.symbol}`, ['Check network connection']) });
    }
    return;
  }

  // History command - comprehensive historical analysis
  const historyResult = parseHistoryCommand(originalCommand);
  if (historyResult) {
    try {
      const analysis = await getHistoricalAnalysis(historyResult.symbol, historyResult.period);
      if (!analysis) {
        dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Could not fetch history for ${historyResult.symbol}`, ['Check the symbol']) });
        return;
      }
      dispatch({ type: 'APPEND_OUTPUT', block: createComponentBlock(<HistoryView analysis={analysis} />) });
    } catch {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock(`Failed to load history for ${historyResult.symbol}`, ['Check network connection']) });
    }
    return;
  }

  // Options command
  if (cmd === 'options' || cmd === 'chain') {
    const symbol = parts[1]?.toUpperCase();
    if (symbol) {
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createTextBlock(
          `Options for ${symbol}\n` +
          '─'.repeat(40) + '\n\n' +
          'Options data is available. Use the CLI version for full options chain display.\n' +
          'Run: npm run cli\n\n' +
          'Commands:\n' +
          `  options ${symbol}           Options overview\n` +
          `  chain ${symbol} [expiry]    Full chain with Greeks`,
          'info'
        ),
      });
    } else {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Missing symbol', ['Usage: options AAPL']) });
    }
    return;
  }

  // Crypto command
  if (cmd === 'crypto' || cmd === 'c') {
    const symbol = parts[1]?.toUpperCase();
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createTextBlock(
        'Cryptocurrency\n' +
        '─'.repeat(40) + '\n\n' +
        'Crypto data is available via CoinGecko (free, no API key).\n' +
        'Use the CLI version for full crypto display.\n' +
        'Run: npm run cli\n\n' +
        'Commands:\n' +
        '  crypto        Top 50 cryptocurrencies\n' +
        '  c BTC         Bitcoin profile\n' +
        '  c ETH         Ethereum profile',
        'info'
      ),
    });
    return;
  }

  // Alerts command
  if (cmd === 'alerts' || cmd === 'alert') {
    const subCmd = parts[1]?.toLowerCase();
    const arg = parts[2];

    // alert webhook add <url>
    if (subCmd === 'webhook' && parts[2]?.toLowerCase() === 'add' && parts[3]) {
      const url = parts[3];
      const name = parts.slice(4).join(' ') || undefined;

      try {
        new URL(url); // Validate URL format
        const webhook = addWebhook(url, name);
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Webhook Added\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            `ID: ${webhook.id}\n` +
            `URL: ${webhook.url}\n` +
            (webhook.name ? `Name: ${webhook.name}\n` : '') +
            `\nUse "alert webhook test ${webhook.id}" to verify.`,
            'success'
          ),
        });
      } catch {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock('Invalid URL format', ['Example: alert webhook add https://example.com/hook']),
        });
      }
      return;
    }

    // alert webhook list
    if (subCmd === 'webhook' && (!parts[2] || parts[2].toLowerCase() === 'list')) {
      const webhooks = getWebhooks();
      const stats = getWebhookStats();

      if (webhooks.length === 0) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Webhooks\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            'No webhooks configured.\n\n' +
            'Add a webhook:\n' +
            '  alert webhook add <url> [name]',
            'info'
          ),
        });
      } else {
        const output = webhooks.map(w => {
          const status = w.enabled ? (w.failCount >= 3 ? '[!]' : '[+]') : '[-]';
          const name = w.name ? ` (${w.name})` : '';
          return `  ${status} #${w.id}${name}\n      ${w.url}`;
        }).join('\n');

        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(
            `Webhooks (${stats.enabled}/${stats.total} active)\n` +
            String.fromCharCode(0x2500).repeat(40) + '\n\n' +
            output + '\n\n' +
            '[+] enabled  [-] disabled  [!] failing',
            'normal'
          ),
        });
      }
      return;
    }

    // alert webhook remove <id>
    if (subCmd === 'webhook' && parts[2]?.toLowerCase() === 'remove' && parts[3]) {
      const id = parseInt(parts[3], 10);
      if (isNaN(id)) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock('Invalid webhook ID', ['Usage: alert webhook remove <id>']),
        });
        return;
      }

      if (removeWebhook(id)) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(`Webhook #${id} removed.`, 'success'),
        });
      } else {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock(`Webhook #${id} not found`, ['Use "alert webhook list" to see webhooks']),
        });
      }
      return;
    }

    // alert webhook test <id>
    if (subCmd === 'webhook' && parts[2]?.toLowerCase() === 'test' && parts[3]) {
      const id = parseInt(parts[3], 10);
      if (isNaN(id)) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock('Invalid webhook ID', ['Usage: alert webhook test <id>']),
        });
        return;
      }

      dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock('Testing webhook...', 'info') });

      const result = await testWebhook(id);
      if (result.success) {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createTextBlock(`Webhook #${id} test successful!`, 'success'),
        });
      } else {
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock(`Webhook test failed: ${result.error}`, ['Check the URL and try again']),
        });
      }
      return;
    }

    // Default: show alerts info
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createTextBlock(
        'Alerts System\n' +
        String.fromCharCode(0x2500).repeat(40) + '\n\n' +
        'The alert system monitors for:\n' +
        '  - Price drops (>5%)\n' +
        '  - Price spikes (>8%)\n' +
        '  - Upcoming earnings (3 days)\n' +
        '  - Watchlist events\n\n' +
        'Webhook Commands:\n' +
        '  alert webhook add <url> [name]  Add webhook\n' +
        '  alert webhook list              List webhooks\n' +
        '  alert webhook remove <id>       Remove webhook\n' +
        '  alert webhook test <id>         Test webhook',
        'info'
      ),
    });
    return;
  }

  // Preferences command
  if (cmd === 'preferences' || cmd === 'prefs') {
    const subCmd = parts[1]?.toLowerCase();
    const resetKey = parts[2]?.toLowerCase();

    if (subCmd === 'reset') {
      if (resetKey) {
        // Reset specific preference
        const prefs = getAllPreferences();
        const exists = prefs.find(p => p.key.toLowerCase() === resetKey || p.key === resetKey);
        if (exists) {
          deletePreference(exists.key);
          dispatch({
            type: 'APPEND_OUTPUT',
            block: createComponentBlock(
              <PreferencesView preferences={[]} mode="reset-key" resetKey={exists.key} resetCount={1} />
            ),
          });
        } else {
          dispatch({
            type: 'APPEND_OUTPUT',
            block: createErrorBlock(`Preference "${resetKey}" not found`, ['Run "preferences" to see available preferences']),
          });
        }
      } else {
        // Reset all preferences
        const count = clearAllPreferences();
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createComponentBlock(
            <PreferencesView preferences={[]} mode="reset" resetCount={count} />
          ),
        });
      }
    } else {
      // View all preferences
      const preferences = getAllPreferences();
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createComponentBlock(<PreferencesView preferences={preferences} />),
      });
    }
    return;
  }

  // Recall command
  if (cmd === 'recall') {
    const subCmd = parts[1]?.toLowerCase();

    if (subCmd === 'search' && parts.length > 2) {
      // Search messages
      const query = parts.slice(2).join(' ');
      const messages = searchMessages(query);
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createComponentBlock(
          <RecallView mode="search" messages={messages} searchQuery={query} />
        ),
      });
    } else if (subCmd === 'symbols') {
      // Show tracked symbols
      const symbols = getAllTrackedSymbols();
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createComponentBlock(<RecallView mode="symbols" symbols={symbols} />),
      });
    } else if (subCmd === 'sessions') {
      // Show session history
      const sessions = getAllSessions();
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createComponentBlock(<RecallView mode="sessions" sessions={sessions} />),
      });
    } else {
      // Default: show recent messages
      const messages = getRecentMessages(20);
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createComponentBlock(<RecallView mode="messages" messages={messages} />),
      });
    }
    return;
  }

  // Setup command - show how to reconfigure
  if (cmd === 'setup') {
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createTextBlock(
        'Setup Configuration\n' +
        String.fromCharCode(0x2500).repeat(40) + '\n\n' +
        'To reconfigure DevFolio:\n\n' +
        '1. Delete ~/.devfolio/.env\n' +
        '2. Restart DevFolio\n' +
        '3. The setup wizard will guide you\n\n' +
        'Or manually set environment variables:\n' +
        '  GROQ_API_KEY     - Groq (free tier available)\n' +
        '  OPENAI_API_KEY   - OpenAI\n' +
        '  ANTHROPIC_API_KEY - Anthropic Claude\n\n' +
        'Get API keys at:\n' +
        '  Groq: https://console.groq.com\n' +
        '  OpenAI: https://platform.openai.com\n' +
        '  Anthropic: https://console.anthropic.com',
        'info'
      ),
    });
    return;
  }

  // Export command
  if (cmd === 'export') {
    const target = parts[1]?.toLowerCase();
    const limitArg = parts[2] ? parseInt(parts[2], 10) : undefined;

    if (!target) {
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createTextBlock(
          'Export Data\n' +
          String.fromCharCode(0x2500).repeat(40) + '\n\n' +
          'Usage:\n' +
          '  export watchlist        Export watchlist to CSV\n' +
          '  export portfolio        Export portfolio to CSV\n' +
          '  export preferences      Export preferences to JSON\n' +
          '  export history [N]      Export last N commands to CSV (default: 100)\n\n' +
          'Files are saved to the current directory.',
          'info'
        ),
      });
      return;
    }

    let result;
    switch (target) {
      case 'watchlist':
      case 'w':
        result = exportWatchlistCSV();
        break;
      case 'portfolio':
      case 'p':
        result = exportPortfolioCSV();
        break;
      case 'preferences':
      case 'prefs':
        result = exportPreferencesJSON();
        break;
      case 'history':
      case 'hist':
        result = exportHistoryCSV(limitArg || 100);
        break;
      default:
        dispatch({
          type: 'APPEND_OUTPUT',
          block: createErrorBlock(
            `Unknown export target: ${target}`,
            ['Valid targets: watchlist, portfolio, preferences, history']
          ),
        });
        return;
    }

    if (result.success) {
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createTextBlock(
          `Export Successful\n` +
          String.fromCharCode(0x2500).repeat(40) + '\n\n' +
          `File: ${result.filePath}\n` +
          `Records: ${result.recordCount}`,
          'success'
        ),
      });
    } else {
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createErrorBlock(result.error || 'Export failed', []),
      });
    }
    return;
  }

  // Live mode command
  if (cmd === 'live') {
    // Get symbols from command or default to watchlist
    let symbols: string[] = parts.slice(1).map(s => s.toUpperCase());

    if (symbols.length === 0) {
      // Use watchlist symbols (getWatchlist returns string[])
      symbols = getWatchlist();
    }

    if (symbols.length === 0) {
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createTextBlock(
          'Live Mode\n' +
          '─'.repeat(40) + '\n\n' +
          'No symbols specified and watchlist is empty.\n\n' +
          'Usage:\n' +
          '  live              Live mode for watchlist symbols\n' +
          '  live AAPL NVDA    Live mode for specific symbols\n\n' +
          'Add symbols to your watchlist first: add AAPL',
          'warning'
        ),
      });
      return;
    }

    // Track as refreshable command
    lastRefreshableCommand = originalCommand;

    dispatch({
      type: 'APPEND_OUTPUT',
      block: createComponentBlock(<LiveModeView symbols={symbols} />),
    });
    return;
  }

  // Stats command (debug screen)
  if (cmd === 'stats' || cmd === '::debug' || cmd === '::stats') {
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createComponentBlock(<StatsView />),
    });
    return;
  }

  // Cost command
  if (cmd === 'cost') {
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createTextBlock(
        'AI Cost Tracking\n' +
        '─'.repeat(40) + '\n\n' +
        'Cost tracking monitors AI token usage.\n' +
        'Use the CLI version for detailed cost breakdown.\n' +
        'Run: npm run cli',
        'info'
      ),
    });
    return;
  }

  // Config command
  if (cmd === 'config') {
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createTextBlock(
        'AI Configuration\n' +
        '─'.repeat(40) + '\n\n' +
        'Configure AI providers and features.\n' +
        'Use the CLI version for configuration.\n' +
        'Run: npm run cli\n\n' +
        'Supported providers:\n' +
        '  - Groq (free tier, fastest)\n' +
        '  - OpenAI (GPT-4o)\n' +
        '  - Anthropic (Claude)\n' +
        '  - Ollama (local)',
        'info'
      ),
    });
    return;
  }

  // Tutorial command
  if (cmd === 'tutorial') {
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createTextBlock(
        'Interactive Tutorial\n' +
        '====================\n\n' +
        'Welcome to DevFolio! Here are the key commands to get started:\n\n' +
        '  1. Watchlist (w)        - Track your favorite stocks\n' +
        '  2. Stock Profile (s)    - Get detailed stock info: s AAPL\n' +
        '  3. Options (options)    - View options chains: options AAPL\n' +
        '  4. Crypto (crypto)      - Top 50 cryptocurrencies\n' +
        '  5. AI Chat              - Just type naturally!\n' +
        '  6. Alerts (alerts)      - View price alerts\n\n' +
        'More commands:\n' +
        '  b, brief      AI market analysis\n' +
        '  r AAPL        Research report\n' +
        '  cs AAPL MSFT  Compare stocks\n' +
        '  fin AAPL      Financial statements\n' +
        '  live          10-second quote refresh\n' +
        '  help          See all commands\n\n' +
        'Try: s AAPL to see a stock profile!',
        'info'
      ),
    });
    return;
  }

  // Check for similar commands before falling back to AI
  const suggestions = findSimilarCommands(cmd, KNOWN_COMMANDS, 2);
  if (suggestions.length > 0) {
    dispatch({
      type: 'APPEND_OUTPUT',
      block: createTextBlock(
        `Unknown command "${cmd}". Did you mean: ${suggestions.join(', ')}?\n` +
        `Or type your question in natural language for AI assistance.`,
        'warning'
      ),
    });
    return;
  }

  // General query - send to AI agent
  try {
    const response = await chat(command);
    dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(response.message, 'normal') });

    // Show AI learning transparency - what preferences were learned
    if (response.learnedPreferences && response.learnedPreferences.length > 0) {
      const learned = response.learnedPreferences
        .map(p => {
          const key = p.key.replace(/_/g, ' ');
          const action = p.action === 'new' ? '+' : p.action === 'updated' ? '~' : '^';
          return `${action}${key}=${p.value}`;
        })
        .join(', ');
      dispatch({
        type: 'APPEND_OUTPUT',
        block: createTextBlock(`[Learned: ${learned}]`, 'info'),
      });
    }
  } catch {
    dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(`Unknown command: ${command}. Type 'help' for available commands.`, 'warning') });
  }
}

export function App(): React.ReactElement {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
