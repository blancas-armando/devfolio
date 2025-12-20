/**
 * CLI Command Handlers
 * Functions that fetch data and call display functions
 */

import chalk from 'chalk';
import { getCompanyProfile, compareStocks, getMarketOverview, getNewsFeed, fetchArticleContent } from '../services/market.js';
import { getMarketBrief } from '../services/brief.js';
import { generateResearchReport } from '../services/research.js';
import { generateEarningsReport } from '../services/earnings.js';
import { getETFProfile, compareETFs } from '../services/etf.js';
import { getRecentFilings } from '../services/sec.js';
import { getQuickTake } from '../services/quicktake.js';
import { explainMovement } from '../services/why.js';
import { getMarketPulse } from '../services/pulse.js';
import { runScreener, getAvailablePresets, getRelatedStocks, type ScreenerPreset } from '../services/screener.js';
import { getFinancialStatements } from '../services/financials.js';
import { addToWatchlist, removeFromWatchlist } from '../db/watchlist.js';
import { getPulseConfig, updatePulseConfig, type PulseConfig } from '../db/config.js';
import { ErrorMessages } from '../utils/errors.js';
import {
  displayCompanyProfile,
  displayStockComparison,
  displayMarketOverview,
  displayMarketBrief,
  displayETFProfile,
  displayETFComparison,
  displayEarningsReport,
  displayResearchReport,
  displayNewsFeed,
  displayArticle,
  displayFilings,
  displayFiling,
  displayWhyExplanation,
  displayMarketPulse,
  displayPulseConfig,
  displayScreenerResults,
  displayScreenerPresets,
  displayFinancialStatements,
  showWatchlist,
  showPortfolio,
  showHomeScreen,
  showHelp,
} from './display/index.js';
import { displayActionableError } from './ui.js';
import { getLastNewsArticles, getLastFilings, getLastFilingsSymbol } from './state.js';

// ═══════════════════════════════════════════════════════════════════════════
// Command Parsers
// ═══════════════════════════════════════════════════════════════════════════

export function parseStockCommand(input: string): { symbol: string; timeframe?: string } | null {
  // Match: s AAPL, s AAPL 1y, stock MSFT 3m
  const stockMatch = input.match(/^(?:s|stock)\s+([A-Za-z]{1,5})(?:\s+(1d|5d|1m|3m|6m|1y|5y))?$/i);
  if (stockMatch) {
    return {
      symbol: stockMatch[1].toUpperCase(),
      timeframe: stockMatch[2]?.toLowerCase(),
    };
  }
  return null;
}

export function parseReportCommand(input: string): string | null {
  const reportMatch = input.match(/^(?:r|report|primer|research)\s+([A-Za-z]{1,5})$/i);
  if (reportMatch) return reportMatch[1].toUpperCase();
  return null;
}

export function parseEarningsCommand(input: string): string | null {
  const earningsMatch = input.match(/^(?:e|earnings)\s+([A-Za-z]{1,5})$/i);
  if (earningsMatch) return earningsMatch[1].toUpperCase();
  return null;
}

export function parseETFCommand(input: string): string | null {
  const etfMatch = input.match(/^(?:etf|fund)\s+([A-Za-z]{1,5})$/i);
  if (etfMatch) return etfMatch[1].toUpperCase();
  return null;
}

export function parseCompareCommand(input: string): string[] | null {
  const compareMatch = input.match(/^(?:compare|cmp|vs)\s+([A-Za-z]{1,5})\s+([A-Za-z]{1,5})(?:\s+([A-Za-z]{1,5}))?$/i);
  if (compareMatch) {
    const symbols = [compareMatch[1].toUpperCase(), compareMatch[2].toUpperCase()];
    if (compareMatch[3]) symbols.push(compareMatch[3].toUpperCase());
    return symbols;
  }
  return null;
}

export function parseStockCompareCommand(input: string): string[] | null {
  const match = input.match(/^cs\s+([A-Za-z]{1,5})(?:\s+([A-Za-z]{1,5}))(?:\s+([A-Za-z]{1,5}))?(?:\s+([A-Za-z]{1,5}))?$/i);
  if (match) {
    const symbols: string[] = [];
    for (let i = 1; i <= 4; i++) {
      if (match[i]) symbols.push(match[i].toUpperCase());
    }
    if (symbols.length >= 2) return symbols;
  }
  return null;
}

export function parseWhyCommand(input: string): string | null {
  const whyMatch = input.match(/^why\s+([A-Za-z]{1,5})$/i);
  if (whyMatch) return whyMatch[1].toUpperCase();
  return null;
}

export function parseFinancialsCommand(input: string): { symbol: string; type?: 'income' | 'balance' | 'cashflow' } | null {
  // Match: fin AAPL, fin AAPL income, financials MSFT balance
  const match = input.match(/^(?:fin|financials|statements)\s+([A-Za-z]{1,5})(?:\s+(income|balance|cashflow|cf|is|bs))?$/i);
  if (match) {
    const symbol = match[1].toUpperCase();
    let type: 'income' | 'balance' | 'cashflow' | undefined;

    if (match[2]) {
      const typeStr = match[2].toLowerCase();
      if (typeStr === 'income' || typeStr === 'is') type = 'income';
      else if (typeStr === 'balance' || typeStr === 'bs') type = 'balance';
      else if (typeStr === 'cashflow' || typeStr === 'cf') type = 'cashflow';
    }

    return { symbol, type };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Command Handlers
// ═══════════════════════════════════════════════════════════════════════════

export async function showStock(symbol: string, timeframe?: string): Promise<void> {
  const upperSymbol = symbol.toUpperCase();

  // Fetch profile first
  const profile = await getCompanyProfile(upperSymbol);

  if (!profile) {
    displayActionableError({
      message: ErrorMessages.symbolNotFound(upperSymbol),
      suggestions: [
        'Check the ticker symbol for typos',
        'Some tickers use periods (e.g., BRK.B)',
        'The stock may be delisted or too new',
      ],
      tryCommands: [
        'screen gainers',
        'screen tech',
      ],
    });
    return;
  }

  // Fetch AI quick take and related stocks in parallel
  const [quickTake, relatedStocks] = await Promise.all([
    getQuickTake(profile),
    getRelatedStocks(upperSymbol),
  ]);

  // Note: timeframe will be used when displayCompanyProfile is extended to support it
  displayCompanyProfile(profile, quickTake, relatedStocks);
}

export async function showStockComparison(symbols: string[]): Promise<void> {
  const profiles = await compareStocks(symbols.map(s => s.toUpperCase()));

  if (profiles.length === 0) {
    displayActionableError({
      message: 'Could not find any of the specified stocks',
      suggestions: [
        'Check the ticker symbols for typos',
        'Make sure to use valid stock symbols',
      ],
      tryCommands: [
        'cs AAPL MSFT GOOGL',
        'compare SPY QQQ',
      ],
    });
    return;
  }

  if (profiles.length === 1) {
    displayCompanyProfile(profiles[0]);
    return;
  }

  displayStockComparison(profiles);
}

export async function showMarket(): Promise<void> {
  const overview = await getMarketOverview();
  displayMarketOverview(overview);
}

export async function showBrief(): Promise<void> {
  const brief = await getMarketBrief();
  displayMarketBrief(brief);
}

export async function showNews(symbols?: string[]): Promise<void> {
  const articles = await getNewsFeed(symbols);
  displayNewsFeed(articles, symbols);
}

export async function showReport(symbol: string): Promise<void> {
  const report = await generateResearchReport(symbol.toUpperCase());

  if (!report) {
    console.log('');
    console.log(chalk.red(`  ${ErrorMessages.researchUnavailable(symbol.toUpperCase())}`));
    console.log(chalk.dim('    Check the symbol is valid and try again.'));
    console.log('');
    return;
  }

  displayResearchReport(report);
}

export async function showEarnings(symbol: string): Promise<void> {
  const report = await generateEarningsReport(symbol.toUpperCase());

  if (!report) {
    console.log('');
    console.log(chalk.red(`  ${ErrorMessages.earningsUnavailable(symbol.toUpperCase())}`));
    console.log(chalk.dim('    This company may not have recent earnings data.'));
    console.log('');
    return;
  }

  displayEarningsReport(report);
}

export async function showETF(symbol: string): Promise<void> {
  const etf = await getETFProfile(symbol.toUpperCase());

  if (!etf) {
    displayActionableError({
      message: `Could not find ETF "${symbol.toUpperCase()}"`,
      suggestions: [
        'Check the ticker symbol for typos',
        'Make sure this is an ETF, not a stock',
      ],
      tryCommands: [
        'etf SPY',
        'etf QQQ',
        'etf VTI',
      ],
    });
    return;
  }

  displayETFProfile(etf);
}

export async function showETFComparison(symbols: string[]): Promise<void> {
  const etfs = await compareETFs(symbols.map(s => s.toUpperCase()));

  if (etfs.length === 0) {
    displayActionableError({
      message: 'Could not find any of the specified ETFs',
      suggestions: [
        'Check the ticker symbols for typos',
        'Make sure these are ETFs, not stocks',
      ],
      tryCommands: [
        'compare VTI SPY',
        'compare QQQ IWM',
      ],
    });
    return;
  }

  if (etfs.length === 1) {
    displayETFProfile(etfs[0]);
    return;
  }

  displayETFComparison(etfs);
}

export async function showFilings(symbol: string): Promise<void> {
  const filings = await getRecentFilings(symbol.toUpperCase(), ['10-K', '10-Q', '8-K'], 15);

  if (filings.length === 0) {
    console.log('');
    console.log(chalk.yellow(`  No SEC filings found for ${symbol.toUpperCase()}`));
    console.log(chalk.dim('  This symbol may not be a US-listed company.'));
    console.log('');
    return;
  }

  displayFilings(filings, symbol);
}

export async function showFilingContent(filingNum: number): Promise<void> {
  const lastFilings = getLastFilings();
  const lastFilingsSymbol = getLastFilingsSymbol();

  if (lastFilings.length === 0) {
    console.log('');
    console.log(chalk.yellow('  No filings loaded. Run "filings <symbol>" first.'));
    console.log('');
    return;
  }

  if (filingNum < 1 || filingNum > lastFilings.length) {
    console.log('');
    console.log(chalk.red(`  Invalid filing number. Use 1-${lastFilings.length}`));
    console.log('');
    return;
  }

  const filing = lastFilings[filingNum - 1];
  await displayFiling(filing, lastFilingsSymbol);
}

export async function showWhy(symbol: string): Promise<void> {
  const explanation = await explainMovement(symbol.toUpperCase());

  if (!explanation) {
    console.log('');
    console.log(chalk.red(`  Could not analyze movement for ${symbol.toUpperCase()}.`));
    console.log(chalk.dim('    The stock may not have significant recent activity.'));
    console.log('');
    return;
  }

  displayWhyExplanation(explanation);
}

export async function showFinancials(
  symbol: string,
  statementType?: 'income' | 'balance' | 'cashflow'
): Promise<void> {
  const statements = await getFinancialStatements(symbol.toUpperCase());

  if (!statements) {
    displayActionableError({
      message: `Could not fetch financial statements for "${symbol.toUpperCase()}"`,
      suggestions: [
        'Check the ticker symbol for typos',
        'This may be a non-US stock or the data may be unavailable',
      ],
      tryCommands: [
        `s ${symbol.toUpperCase()}`,
        'fin AAPL',
      ],
    });
    return;
  }

  displayFinancialStatements(statements, statementType ?? 'all');
}

export async function readArticle(articleNum: number): Promise<void> {
  const lastNewsArticles = getLastNewsArticles();

  if (lastNewsArticles.length === 0) {
    console.log('');
    console.log(chalk.yellow('  No articles loaded. Run "news" first to see articles.'));
    console.log('');
    return;
  }

  if (articleNum < 1 || articleNum > lastNewsArticles.length) {
    console.log('');
    console.log(chalk.red(`  Invalid article number. Use 1-${lastNewsArticles.length}`));
    console.log('');
    return;
  }

  const newsArticle = lastNewsArticles[articleNum - 1];
  const content = await fetchArticleContent(newsArticle.link);

  if (content) {
    displayArticle(content, newsArticle.publisher);
  } else {
    console.log('');
    console.log(chalk.yellow('  Could not fetch article content.'));
    console.log(chalk.dim(`  Some sites block content extraction.`));
    console.log(chalk.dim(`  Link: ${newsArticle.link}`));
    console.log('');
  }
}

export function handleAddToWatchlist(input: string): void {
  const addMatch = input.match(/^add\s+(.+)$/i);
  if (!addMatch) {
    console.log('');
    console.log(chalk.red('  Usage: add <symbol> (e.g., add AAPL MSFT)'));
    console.log('');
    return;
  }

  const symbols = addMatch[1].split(/[\s,]+/).map(s => s.toUpperCase()).filter(s => /^[A-Z]{1,5}$/.test(s));
  if (symbols.length === 0) {
    console.log('');
    console.log(chalk.red('  Invalid symbol(s). Use 1-5 letter ticker symbols.'));
    console.log('');
    return;
  }

  const added = addToWatchlist(symbols);
  console.log('');
  if (added.length > 0) {
    console.log(chalk.green(`  Added to watchlist: ${added.join(', ')}`));
  } else {
    console.log(chalk.yellow(`  ${symbols.join(', ')} already in watchlist`));
  }
  console.log('');
}

export function handleRemoveFromWatchlist(input: string): void {
  const rmMatch = input.match(/^(?:rm|remove)\s+(.+)$/i);
  if (!rmMatch) {
    console.log('');
    console.log(chalk.red('  Usage: rm <symbol> (e.g., rm AAPL)'));
    console.log('');
    return;
  }

  const symbols = rmMatch[1].split(/[\s,]+/).map(s => s.toUpperCase()).filter(s => /^[A-Z]{1,5}$/.test(s));
  if (symbols.length === 0) {
    console.log('');
    console.log(chalk.red('  Invalid symbol(s). Use 1-5 letter ticker symbols.'));
    console.log('');
    return;
  }

  const removed = removeFromWatchlist(symbols);
  console.log('');
  if (removed.length > 0) {
    console.log(chalk.green(`  Removed from watchlist: ${removed.join(', ')}`));
  } else {
    console.log(chalk.yellow(`  ${symbols.join(', ')} not found in watchlist`));
  }
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Pulse Commands
// ═══════════════════════════════════════════════════════════════════════════

export async function showPulse(): Promise<void> {
  const pulse = await getMarketPulse();
  displayMarketPulse(pulse);
}

export function showPulseConfig(): void {
  const config = getPulseConfig();
  displayPulseConfig(config);
}

export function handlePulseSet(input: string): void {
  const setMatch = input.match(/^pulse\s+set\s+(\w+)\s+(.+)$/i);
  if (!setMatch) {
    console.log('');
    console.log(chalk.red('  Usage: pulse set <key> <value>'));
    console.log(chalk.dim('  Examples:'));
    console.log(chalk.dim('    pulse set vixThreshold 25'));
    console.log(chalk.dim('    pulse set moverThreshold 8'));
    console.log(chalk.dim('    pulse set showSectors false'));
    console.log('');
    return;
  }

  const key = setMatch[1] as keyof PulseConfig;
  const valueStr = setMatch[2];

  // Valid keys
  const validKeys: (keyof PulseConfig)[] = [
    'indexDropThreshold',
    'indexRiseThreshold',
    'vixThreshold',
    'moverThreshold',
    'showSectors',
    'showIndicators',
    'topMoversCount',
  ];

  if (!validKeys.includes(key)) {
    console.log('');
    console.log(chalk.red(`  Unknown setting: ${key}`));
    console.log(chalk.dim(`  Valid settings: ${validKeys.join(', ')}`));
    console.log('');
    return;
  }

  // Parse value based on key type
  let value: number | boolean;

  if (key === 'showSectors' || key === 'showIndicators') {
    // Boolean values
    if (valueStr.toLowerCase() === 'true' || valueStr === '1' || valueStr.toLowerCase() === 'yes') {
      value = true;
    } else if (valueStr.toLowerCase() === 'false' || valueStr === '0' || valueStr.toLowerCase() === 'no') {
      value = false;
    } else {
      console.log('');
      console.log(chalk.red(`  Invalid value for ${key}. Use true/false.`));
      console.log('');
      return;
    }
  } else {
    // Numeric values
    value = parseFloat(valueStr);
    if (isNaN(value) || value < 0) {
      console.log('');
      console.log(chalk.red(`  Invalid value for ${key}. Use a positive number.`));
      console.log('');
      return;
    }
  }

  const updates = { [key]: value } as Partial<PulseConfig>;
  const newConfig = updatePulseConfig(updates);

  console.log('');
  console.log(chalk.green(`  Updated ${key} to ${value}`));
  console.log(chalk.dim('  Run "pulse config" to see all settings.'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Screener Commands
// ═══════════════════════════════════════════════════════════════════════════

const VALID_PRESETS: ScreenerPreset[] = [
  'gainers', 'losers', 'active', 'trending', 'value', 'growth', 'dividend',
  'tech', 'healthcare', 'finance', 'energy', 'consumer', 'industrial',
];

export function parseScreenCommand(input: string): ScreenerPreset | 'help' | null {
  const match = input.match(/^screen(?:\s+(\w+))?$/i);
  if (!match) return null;

  const preset = match[1]?.toLowerCase();
  if (!preset) return 'help';

  if (VALID_PRESETS.includes(preset as ScreenerPreset)) {
    return preset as ScreenerPreset;
  }

  return null;
}

export async function showScreener(preset: ScreenerPreset): Promise<void> {
  const results = await runScreener(preset);

  if (!results) {
    console.log('');
    console.log(chalk.red(`  Error: Could not run screener "${preset}"`));
    console.log('');
    return;
  }

  displayScreenerResults(results);
}

export function showScreenerHelp(): void {
  const presets = getAvailablePresets();
  displayScreenerPresets(presets);
}

// ═══════════════════════════════════════════════════════════════════════════
// History Commands
// ═══════════════════════════════════════════════════════════════════════════

import { getHistory, searchHistory, getHistoryCommand, clearOldHistory } from '../db/history.js';
import { getAllGroups, getGroup, createGroup, deleteGroup, type ComparisonGroup } from '../db/groups.js';
import { drawBox, WIDTH } from './ui.js';

export function showHistory(limit: number = 20): void {
  const history = getHistory(limit);

  if (history.length === 0) {
    console.log('');
    console.log(chalk.dim('  No command history yet. Start using commands!'));
    console.log('');
    return;
  }

  console.log('');
  const lines: string[] = [];
  lines.push(chalk.dim('  #   Command'));
  lines.push(chalk.dim('  ' + '─'.repeat(52)));

  for (const [idx, entry] of history.entries()) {
    const num = chalk.cyan(`${(idx + 1).toString().padStart(3)}`);
    const cmd = entry.command.length > 45
      ? entry.command.slice(0, 42) + '...'
      : entry.command;
    lines.push(`  ${num}  ${chalk.white(cmd)}`);
  }

  drawBox('Command History', lines, WIDTH.COMPACT);

  console.log('');
  console.log(chalk.dim('  Tip: Use "!N" to re-run command N (e.g., "!3")'));
  console.log('');
}

export function showHistorySearch(query: string): void {
  const results = searchHistory(query);

  if (results.length === 0) {
    console.log('');
    console.log(chalk.dim(`  No commands matching "${query}"`));
    console.log('');
    return;
  }

  console.log('');
  console.log(chalk.cyan(`  Commands matching "${query}":`));
  console.log('');

  for (const [idx, entry] of results.entries()) {
    const num = chalk.dim(`${(idx + 1).toString().padStart(3)}.`);
    console.log(`  ${num} ${chalk.white(entry.command)}`);
  }

  console.log('');
}

export function getHistoryRerun(num: number): string | null {
  return getHistoryCommand(num);
}

export function clearHistory(): void {
  const deleted = clearOldHistory(0); // Clear all
  console.log('');
  console.log(chalk.green(`  Cleared ${deleted} history entries`));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Group Commands
// ═══════════════════════════════════════════════════════════════════════════

export function showGroups(): void {
  const groups = getAllGroups();

  if (groups.length === 0) {
    console.log('');
    console.log(chalk.cyan('  No saved comparison groups'));
    console.log('');
    console.log(chalk.dim('  Save a group after comparing stocks:'));
    console.log(chalk.yellow('    cs AAPL MSFT GOOGL'));
    console.log(chalk.yellow('    group save tech-leaders'));
    console.log('');
    return;
  }

  console.log('');
  const lines: string[] = [];

  for (const group of groups) {
    const name = chalk.cyan(group.name.padEnd(18));
    const members = chalk.white(group.members.join(' '));
    const type = chalk.dim(`(${group.type})`);
    lines.push(`${name} ${members} ${type}`);
  }

  drawBox('Saved Groups', lines, WIDTH.STANDARD);

  console.log('');
  console.log(chalk.dim('  Load a group with: ') + chalk.yellow('group load <name>'));
  console.log('');
}

export function saveGroup(name: string, symbols: string[], type: 'stocks' | 'etfs' = 'stocks'): void {
  try {
    createGroup(name, symbols, type);
    console.log('');
    console.log(chalk.green(`  Saved group "${name}" with ${symbols.length} symbols`));
    console.log('');
  } catch {
    console.log('');
    console.log(chalk.red(`  Error: Could not save group "${name}"`));
    console.log(chalk.dim('    A group with this name may already exist.'));
    console.log('');
  }
}

export function loadGroup(name: string): string[] | null {
  const group = getGroup(name);
  return group?.members ?? null;
}

export function removeGroup(name: string): void {
  const deleted = deleteGroup(name);

  if (deleted) {
    console.log('');
    console.log(chalk.green(`  Deleted group "${name}"`));
    console.log('');
  } else {
    displayActionableError({
      message: `Group "${name}" not found`,
      suggestions: [
        'Check the group name for typos',
      ],
      tryCommands: [
        'groups',
      ],
    });
  }
}

// Re-export display functions that can be used directly
export { showWatchlist, showPortfolio, showHomeScreen, showHelp };
