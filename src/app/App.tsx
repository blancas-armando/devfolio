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
import { explainMovement } from '../services/why.js';
import { getAsciiLogo } from '../services/logo.js';
import { getFinancialStatements } from '../services/financials.js';
import { getHistoricalAnalysis } from '../services/history.js';
import { chat } from '../ai/agent.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../db/watchlist.js';
import { getPortfolio } from '../db/portfolio.js';
import { getPulseConfig, updatePulseConfig } from '../db/config.js';

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

const isTTY = process.stdin.isTTY ?? false;

function AppInner(): React.ReactElement {
  const { state, dispatch } = useAppState();
  const { exit } = useApp();
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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
  }, { isActive: isTTY });

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
    if (symbol) {
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
    } else {
      dispatch({ type: 'APPEND_OUTPUT', block: createErrorBlock('Missing symbol', ['Usage: filings AAPL']) });
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

  // General query - send to AI agent
  try {
    const response = await chat(command);
    dispatch({ type: 'APPEND_OUTPUT', block: createTextBlock(response.message, 'normal') });
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
