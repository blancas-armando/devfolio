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
import { addToWatchlist, removeFromWatchlist } from '../db/watchlist.js';
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
  showWatchlist,
  showPortfolio,
  showHomeScreen,
  showHelp,
} from './display/index.js';
import { getLastNewsArticles, getLastFilings, getLastFilingsSymbol } from './state.js';

// ═══════════════════════════════════════════════════════════════════════════
// Command Parsers
// ═══════════════════════════════════════════════════════════════════════════

export function parseStockCommand(input: string): string | null {
  const stockMatch = input.match(/^(?:s|stock)\s+([A-Za-z]{1,5})$/i);
  if (stockMatch) return stockMatch[1].toUpperCase();
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

// ═══════════════════════════════════════════════════════════════════════════
// Command Handlers
// ═══════════════════════════════════════════════════════════════════════════

export async function showStock(symbol: string): Promise<void> {
  const upperSymbol = symbol.toUpperCase();

  // Fetch profile first
  const profile = await getCompanyProfile(upperSymbol);

  if (!profile) {
    console.log('');
    console.log(chalk.red(`  Error: Could not find company: ${upperSymbol}`));
    console.log(chalk.dim(`    Try a valid ticker symbol like AAPL, MSFT, or NVDA`));
    console.log('');
    return;
  }

  // Fetch AI quick take in background (don't block display)
  const quickTake = await getQuickTake(profile);

  displayCompanyProfile(profile, quickTake);
}

export async function showStockComparison(symbols: string[]): Promise<void> {
  const profiles = await compareStocks(symbols.map(s => s.toUpperCase()));

  if (profiles.length === 0) {
    console.log('');
    console.log(chalk.red(`  Error: Could not find any of the specified stocks`));
    console.log(chalk.dim(`    Try valid stock symbols like AAPL, MSFT, or GOOGL`));
    console.log('');
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
    console.log(chalk.red(`  Error: Could not generate report for: ${symbol.toUpperCase()}`));
    console.log(chalk.dim(`    Try a valid ticker symbol like AAPL, MSFT, or NVDA`));
    console.log('');
    return;
  }

  displayResearchReport(report);
}

export async function showEarnings(symbol: string): Promise<void> {
  const report = await generateEarningsReport(symbol.toUpperCase());

  if (!report) {
    console.log('');
    console.log(chalk.red(`  Error: Could not generate earnings report for: ${symbol.toUpperCase()}`));
    console.log(chalk.dim(`    Try a valid ticker symbol like AAPL, MSFT, or NVDA`));
    console.log('');
    return;
  }

  displayEarningsReport(report);
}

export async function showETF(symbol: string): Promise<void> {
  const etf = await getETFProfile(symbol.toUpperCase());

  if (!etf) {
    console.log('');
    console.log(chalk.red(`  Error: Could not find ETF: ${symbol.toUpperCase()}`));
    console.log(chalk.dim(`    Try a valid ETF symbol like VTI, SPY, or QQQ`));
    console.log('');
    return;
  }

  displayETFProfile(etf);
}

export async function showETFComparison(symbols: string[]): Promise<void> {
  const etfs = await compareETFs(symbols.map(s => s.toUpperCase()));

  if (etfs.length === 0) {
    console.log('');
    console.log(chalk.red(`  Error: Could not find any of the specified ETFs`));
    console.log(chalk.dim(`    Try valid ETF symbols like VTI, SPY, or QQQ`));
    console.log('');
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
    console.log(chalk.red(`  Error: Could not analyze ${symbol.toUpperCase()}`));
    console.log(chalk.dim(`    Make sure GROQ_API_KEY is set and the symbol is valid`));
    console.log('');
    return;
  }

  displayWhyExplanation(explanation);
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

// Re-export display functions that can be used directly
export { showWatchlist, showPortfolio, showHomeScreen, showHelp };
