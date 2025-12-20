import * as readline from 'readline';
import chalk from 'chalk';
import asciichart from 'asciichart';
import { chat } from './ai/agent.js';
import { getWatchlist, addToWatchlist } from './db/watchlist.js';
import { getPortfolio, addHolding } from './db/portfolio.js';
import {
  getQuotes,
  getCompanyProfile,
  compareStocks,
  getMarketOverview,
  getEventsCalendar,
  getNewsFeed,
  fetchArticleContent,
  type CompanyProfile,
  type MarketOverview,
  type EventsCalendar,
  type NewsArticle,
  type ArticleContent,
} from './services/market.js';
import { getMarketBrief, type MarketBrief } from './services/brief.js';
import { generateResearchReport, type ResearchReport } from './services/research.js';
import { generateEarningsReport, type EarningsReport, type QuarterlyResults, type KPIMetric, type GuidanceMetric } from './services/earnings.js';
import { getETFProfile, compareETFs } from './services/etf.js';
import {
  getRecentFilings,
  getFilingText,
  extractKeySections,
  identify8KItems,
  getCompanyInfo,
  type SECFiling,
  type FilingSection,
} from './services/sec.js';
import type { ETFProfile } from './types/index.js';
import { formatCurrency, formatPercent } from './utils/format.js';
import { DEMO_WATCHLIST, DEMO_HOLDINGS } from './constants/index.js';
import type { Message } from './types/index.js';

// Store last news articles for "read N" command
let lastNewsArticles: NewsArticle[] = [];

// Store last SEC filings for "filing N" command
let lastFilings: SECFiling[] = [];
let lastFilingsSymbol: string = '';

// ═══════════════════════════════════════════════════════════════════════════
// ASCII Art & Branding
// ═══════════════════════════════════════════════════════════════════════════

const LOGO = `
    ██████╗ ███████╗██╗   ██╗███████╗ ██████╗ ██╗     ██╗ ██████╗
    ██╔══██╗██╔════╝██║   ██║██╔════╝██╔═══██╗██║     ██║██╔═══██╗
    ██║  ██║█████╗  ██║   ██║█████╗  ██║   ██║██║     ██║██║   ██║
    ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║   ██║██║     ██║██║   ██║
    ██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗██║╚██████╔╝
    ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝
`;

const TAGLINE = 'AI-Powered Portfolio Intelligence';
const VERSION = 'v0.1.0';

// ═══════════════════════════════════════════════════════════════════════════
// Formatting Utilities
// ═══════════════════════════════════════════════════════════════════════════

function formatLargeNumber(num: number | null, decimals: number = 2): string {
  if (num === null || num === undefined) return 'N/A';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e12) return `${sign}$${(absNum / 1e12).toFixed(decimals)}T`;
  if (absNum >= 1e9) return `${sign}$${(absNum / 1e9).toFixed(decimals)}B`;
  if (absNum >= 1e6) return `${sign}$${(absNum / 1e6).toFixed(decimals)}M`;
  if (absNum >= 1e3) return `${sign}$${(absNum / 1e3).toFixed(decimals)}K`;
  return `${sign}$${absNum.toFixed(decimals)}`;
}

function formatRatio(num: number | null, decimals: number = 2): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toFixed(decimals);
}

function formatPercentValue(num: number | null): string {
  if (num === null || num === undefined) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI Components
// ═══════════════════════════════════════════════════════════════════════════

function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function drawBox(title: string, content: string[], width: number = 60): void {
  const innerWidth = width - 4;
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  const divider = '├' + '─'.repeat(width - 2) + '┤';

  console.log(chalk.dim(top));
  console.log(chalk.dim('│') + ' ' + chalk.bold.cyan(title.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
  console.log(chalk.dim(divider));

  for (const line of content) {
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.dim('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.dim('│'));
  }

  console.log(chalk.dim(bottom));
}

function drawSection(title: string, items: [string, string][], width: number = 56): void {
  const innerWidth = width - 4;
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.dim('│') + ' ' + chalk.bold.yellow(title.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));

  for (const [label, value] of items) {
    const labelStr = chalk.dim(label.padEnd(20));
    const valueStr = value;
    const line = `${labelStr} ${valueStr}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.dim('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.dim('│'));
  }
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function drawDivider(char: string = '─'): void {
  const width = Math.min(getTerminalWidth(), 70);
  console.log(chalk.dim(char.repeat(width)));
}

// Spinner
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function showSpinner(message: string): () => void {
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(spinnerFrames[i])} ${chalk.dim(message)}`);
    i = (i + 1) % spinnerFrames.length;
  }, 80);

  return () => {
    clearInterval(interval);
    process.stdout.write('\r' + ' '.repeat(message.length + 4) + '\r');
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Company Profile Display
// ═══════════════════════════════════════════════════════════════════════════

function displayCompanyProfile(profile: CompanyProfile): void {
  const width = 60;
  const innerWidth = width - 4;

  console.log('');

  // Header
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  console.log(chalk.dim(top));

  // Company name and ticker
  const isUp = profile.changePercent >= 0;
  const arrow = isUp ? '▲' : '▼';
  const priceColor = isUp ? chalk.green : chalk.red;

  const tickerLine = `${chalk.bold.white(profile.symbol)} ${chalk.dim('│')} ${chalk.white(profile.name)}`;
  const tickerStripped = stripAnsi(tickerLine);
  const tickerPadding = Math.max(0, innerWidth - tickerStripped.length);
  console.log(chalk.dim('│') + ' ' + tickerLine + ' '.repeat(tickerPadding) + ' ' + chalk.dim('│'));

  // Price line
  const priceLine = `${chalk.bold.white(formatCurrency(profile.price))} ${priceColor(`${arrow} ${formatCurrency(profile.change)} (${formatPercent(profile.changePercent)})`)}`;
  const priceStripped = stripAnsi(priceLine);
  const pricePadding = Math.max(0, innerWidth - priceStripped.length);
  console.log(chalk.dim('│') + ' ' + priceLine + ' '.repeat(pricePadding) + ' ' + chalk.dim('│'));

  // Sector & Industry
  const sectorLine = `${chalk.dim(profile.sector)} > ${chalk.dim(profile.industry)}`;
  const sectorStripped = stripAnsi(sectorLine);
  const sectorPadding = Math.max(0, innerWidth - sectorStripped.length);
  console.log(chalk.dim('│') + ' ' + sectorLine + ' '.repeat(sectorPadding) + ' ' + chalk.dim('│'));

  // Description
  if (profile.description) {
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
    const descLines = wrapText(profile.description, innerWidth);
    const maxDescLines = 4;
    for (let i = 0; i < Math.min(descLines.length, maxDescLines); i++) {
      const line = i === maxDescLines - 1 && descLines.length > maxDescLines
        ? truncateText(descLines[i], innerWidth - 3) + '...'
        : descLines[i];
      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.dim('│') + ' ' + chalk.dim(line) + ' '.repeat(padding) + ' ' + chalk.dim('│'));
    }
  }

  // Market Data Section
  drawSection('Market Data', [
    ['Market Cap', formatLargeNumber(profile.marketCap)],
    ['Enterprise Value', formatLargeNumber(profile.enterpriseValue)],
    ['52W High', profile.high52w ? formatCurrency(profile.high52w) : 'N/A'],
    ['52W Low', profile.low52w ? formatCurrency(profile.low52w) : 'N/A'],
    ['Beta', formatRatio(profile.beta)],
    ['Avg Volume', profile.avgVolume ? `${(profile.avgVolume / 1e6).toFixed(2)}M` : 'N/A'],
  ], width);

  // Valuation Section
  drawSection('Valuation', [
    ['P/E Ratio', formatRatio(profile.peRatio)],
    ['Forward P/E', formatRatio(profile.forwardPE)],
    ['PEG Ratio', formatRatio(profile.pegRatio)],
    ['P/S Ratio', formatRatio(profile.priceToSales)],
    ['P/B Ratio', formatRatio(profile.priceToBook)],
    ['EV/EBITDA', formatRatio(profile.evToEbitda)],
  ], width);

  // Financials Section
  drawSection('Financials', [
    ['Revenue (TTM)', formatLargeNumber(profile.revenue)],
    ['Revenue Growth', formatPercentValue(profile.revenueGrowth)],
    ['Gross Margin', formatPercentValue(profile.grossMargin)],
    ['Operating Margin', formatPercentValue(profile.operatingMargin)],
    ['Profit Margin', formatPercentValue(profile.profitMargin)],
    ['EBITDA', formatLargeNumber(profile.ebitda)],
  ], width);

  // Balance Sheet Section
  drawSection('Balance Sheet', [
    ['Total Cash', formatLargeNumber(profile.totalCash)],
    ['Total Debt', formatLargeNumber(profile.totalDebt)],
    ['Debt/Equity', formatRatio(profile.debtToEquity)],
    ['Current Ratio', formatRatio(profile.currentRatio)],
    ['Book Value', profile.bookValue ? formatCurrency(profile.bookValue) : 'N/A'],
  ], width);

  // Dividends Section (if applicable)
  if (profile.dividendYield && profile.dividendYield > 0) {
    drawSection('Dividends', [
      ['Dividend Yield', formatPercentValue(profile.dividendYield)],
      ['Dividend Rate', profile.dividendRate ? formatCurrency(profile.dividendRate) : 'N/A'],
      ['Payout Ratio', formatPercentValue(profile.payoutRatio)],
      ['Ex-Dividend', profile.exDividendDate ?? 'N/A'],
    ], width);
  }

  // Analyst Section (if applicable)
  if (profile.targetPrice && profile.numberOfAnalysts) {
    const recColor = profile.recommendationKey === 'buy' || profile.recommendationKey === 'strongBuy'
      ? chalk.green
      : profile.recommendationKey === 'sell' || profile.recommendationKey === 'strongSell'
        ? chalk.red
        : chalk.yellow;

    drawSection('Analyst Estimates', [
      ['Target Price', formatCurrency(profile.targetPrice)],
      ['Target Range', `${formatCurrency(profile.targetLow ?? 0)} - ${formatCurrency(profile.targetHigh ?? 0)}`],
      ['Recommendation', recColor(profile.recommendationKey?.toUpperCase() ?? 'N/A')],
      ['# of Analysts', String(profile.numberOfAnalysts)],
    ], width);
  }

  // Performance Section
  const formatPerfValue = (val: number | null): string => {
    if (val === null) return chalk.dim('N/A');
    const sign = val >= 0 ? '+' : '';
    const color = val >= 0 ? chalk.green : chalk.red;
    return color(`${sign}${val.toFixed(1)}%`);
  };

  drawSection('Performance', [
    ['Today', formatPerfValue(profile.changePercent)],
    ['3 Month', formatPerfValue(profile.threeMonthReturn)],
    ['YTD', formatPerfValue(profile.ytdReturn)],
  ], width);

  // Price Chart Section
  if (profile.historicalPrices && profile.historicalPrices.length > 10) {
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
    console.log(chalk.dim('│') + ' ' + chalk.bold.yellow('Price Chart (90 days)'.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));

    // Determine trend for color
    const firstPrice = profile.historicalPrices[0];
    const lastPrice = profile.historicalPrices[profile.historicalPrices.length - 1];
    const isUpTrend = lastPrice >= firstPrice;
    const chartColor = isUpTrend ? asciichart.green : asciichart.red;

    // Resample data if needed
    const chartWidth = innerWidth - 10;
    let chartData = profile.historicalPrices;
    if (chartData.length > chartWidth) {
      const resampled: number[] = [];
      const step = chartData.length / chartWidth;
      for (let i = 0; i < chartWidth; i++) {
        resampled.push(chartData[Math.floor(i * step)]);
      }
      chartData = resampled;
    }

    // Generate chart
    const chart = asciichart.plot(chartData, {
      height: 8,
      colors: [chartColor],
      format: (x: number) => x.toFixed(0).padStart(6),
    });

    // Print chart lines
    const chartLines = chart.split('\n');
    for (const line of chartLines) {
      const lineLen = stripAnsi(line).length;
      const padding = Math.max(0, innerWidth - lineLen);
      console.log(chalk.dim('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.dim('│'));
    }

    // Chart footer with date range and change
    const periodChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    const changeSign = periodChange >= 0 ? '+' : '';
    const changeColor = periodChange >= 0 ? chalk.green : chalk.red;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const chartFooter = `${dateRange}  ${changeColor(`${changeSign}${periodChange.toFixed(1)}% over period`)}`;
    const footerStripped = stripAnsi(chartFooter);
    const footerPadding = Math.max(0, innerWidth - footerStripped.length);
    console.log(chalk.dim('│') + ' ' + chartFooter + ' '.repeat(footerPadding) + ' ' + chalk.dim('│'));
  }

  // As of date footer
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
  const asOfStr = `As of ${profile.asOfDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  const asOfPadding = Math.max(0, innerWidth - asOfStr.length);
  console.log(chalk.dim('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(asOfPadding) + ' ' + chalk.dim('│'));

  // Footer
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  console.log(chalk.dim(bottom));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Stock Comparison Display
// ═══════════════════════════════════════════════════════════════════════════

function displayStockComparison(profiles: CompanyProfile[]): void {
  if (profiles.length === 0) return;

  const colWidth = 12;
  const labelWidth = 18;
  const width = labelWidth + 2 + (colWidth * profiles.length) + 4;
  const innerWidth = width - 4;

  console.log('');

  // Helper to find best value index
  const findBest = (values: (number | null)[], higherIsBetter: boolean): number => {
    let bestIdx = -1;
    let bestVal: number | null = null;
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      if (val === null) continue;
      if (bestVal === null) {
        bestVal = val;
        bestIdx = i;
      } else if (higherIsBetter && val > bestVal) {
        bestVal = val;
        bestIdx = i;
      } else if (!higherIsBetter && val < bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // Helper to format a row with ★ indicator
  const formatRow = (
    label: string,
    values: string[],
    rawValues: (number | null)[],
    higherIsBetter: boolean
  ): string => {
    const bestIdx = findBest(rawValues, higherIsBetter);
    const labelStr = chalk.dim(label.padEnd(labelWidth));
    const valStrs = values.map((v, i) => {
      const padded = v.padStart(colWidth - 1);
      if (i === bestIdx) {
        return chalk.green.bold(padded) + chalk.yellow('★');
      }
      return padded + ' ';
    });
    return labelStr + valStrs.join('');
  };

  // Helper for simple row (no ranking)
  const simpleRow = (label: string, values: string[]): string => {
    const labelStr = chalk.dim(label.padEnd(labelWidth));
    const valStrs = values.map(v => v.padStart(colWidth));
    return labelStr + valStrs.join('');
  };

  // Format helpers
  const fmtPrice = (v: number) => '$' + v.toFixed(2);
  const fmtPct = (v: number | null) => v === null ? '--' : (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  const fmtRatio = (v: number | null) => v === null ? '--' : v.toFixed(1);
  const fmtPctVal = (v: number | null) => v === null ? '--' : (v * 100).toFixed(1) + '%';
  const fmtLarge = (v: number | null) => {
    if (v === null) return '--';
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(1) + 'T';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    return '$' + v.toFixed(0);
  };

  // Header
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));
  const title = 'Stock Comparison';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));

  // Symbol header row
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const symbolRow = ' '.repeat(labelWidth) + profiles.map(p => chalk.bold.white(p.symbol.padStart(colWidth))).join('');
  const symRowPad = Math.max(0, innerWidth - stripAnsi(symbolRow).length);
  console.log(chalk.cyan('│') + ' ' + symbolRow + ' '.repeat(symRowPad) + ' ' + chalk.cyan('│'));

  // Sector row
  const sectorRow = simpleRow('Sector', profiles.map(p => p.sector.length > colWidth - 1 ? p.sector.slice(0, colWidth - 2) + '..' : p.sector));
  const secPad = Math.max(0, innerWidth - stripAnsi(sectorRow).length);
  console.log(chalk.cyan('│') + ' ' + chalk.dim(sectorRow) + ' '.repeat(secPad) + ' ' + chalk.cyan('│'));

  // Section: Price & Performance
  console.log(chalk.cyan('├─') + chalk.cyan(' Price & Performance ') + chalk.cyan('─'.repeat(Math.max(0, width - 25))) + chalk.cyan('┤'));

  const priceRow = simpleRow('Price', profiles.map(p => fmtPrice(p.price)));
  console.log(chalk.cyan('│') + ' ' + priceRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(priceRow).length)) + ' ' + chalk.cyan('│'));

  const mktCapRow = simpleRow('Market Cap', profiles.map(p => fmtLarge(p.marketCap)));
  console.log(chalk.cyan('│') + ' ' + mktCapRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(mktCapRow).length)) + ' ' + chalk.cyan('│'));

  const todayRow = formatRow('Today', profiles.map(p => fmtPct(p.changePercent)), profiles.map(p => p.changePercent), true);
  console.log(chalk.cyan('│') + ' ' + todayRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(todayRow).length)) + ' ' + chalk.cyan('│'));

  const threeMonthRow = formatRow('3 Month', profiles.map(p => fmtPct(p.threeMonthReturn)), profiles.map(p => p.threeMonthReturn), true);
  console.log(chalk.cyan('│') + ' ' + threeMonthRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(threeMonthRow).length)) + ' ' + chalk.cyan('│'));

  const ytdRow = formatRow('YTD', profiles.map(p => fmtPct(p.ytdReturn)), profiles.map(p => p.ytdReturn), true);
  console.log(chalk.cyan('│') + ' ' + ytdRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(ytdRow).length)) + ' ' + chalk.cyan('│'));

  // Section: Valuation
  console.log(chalk.cyan('├─') + chalk.cyan(' Valuation ') + chalk.cyan('─'.repeat(Math.max(0, width - 15))) + chalk.cyan('┤'));

  const peRow = formatRow('P/E Ratio', profiles.map(p => fmtRatio(p.peRatio)), profiles.map(p => p.peRatio), false);
  console.log(chalk.cyan('│') + ' ' + peRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(peRow).length)) + ' ' + chalk.cyan('│'));

  const fwdPeRow = formatRow('Forward P/E', profiles.map(p => fmtRatio(p.forwardPE)), profiles.map(p => p.forwardPE), false);
  console.log(chalk.cyan('│') + ' ' + fwdPeRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(fwdPeRow).length)) + ' ' + chalk.cyan('│'));

  const pegRow = formatRow('PEG Ratio', profiles.map(p => fmtRatio(p.pegRatio)), profiles.map(p => p.pegRatio), false);
  console.log(chalk.cyan('│') + ' ' + pegRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(pegRow).length)) + ' ' + chalk.cyan('│'));

  const psRow = formatRow('P/S Ratio', profiles.map(p => fmtRatio(p.priceToSales)), profiles.map(p => p.priceToSales), false);
  console.log(chalk.cyan('│') + ' ' + psRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(psRow).length)) + ' ' + chalk.cyan('│'));

  const pbRow = formatRow('P/B Ratio', profiles.map(p => fmtRatio(p.priceToBook)), profiles.map(p => p.priceToBook), false);
  console.log(chalk.cyan('│') + ' ' + pbRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(pbRow).length)) + ' ' + chalk.cyan('│'));

  // Section: Growth
  console.log(chalk.cyan('├─') + chalk.cyan(' Growth ') + chalk.cyan('─'.repeat(Math.max(0, width - 12))) + chalk.cyan('┤'));

  const revGrowthRow = formatRow('Revenue Growth', profiles.map(p => fmtPctVal(p.revenueGrowth)), profiles.map(p => p.revenueGrowth), true);
  console.log(chalk.cyan('│') + ' ' + revGrowthRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(revGrowthRow).length)) + ' ' + chalk.cyan('│'));

  const epsGrowthRow = formatRow('EPS Growth', profiles.map(p => fmtPctVal(p.epsGrowth)), profiles.map(p => p.epsGrowth), true);
  console.log(chalk.cyan('│') + ' ' + epsGrowthRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(epsGrowthRow).length)) + ' ' + chalk.cyan('│'));

  // Section: Profitability
  console.log(chalk.cyan('├─') + chalk.cyan(' Profitability ') + chalk.cyan('─'.repeat(Math.max(0, width - 19))) + chalk.cyan('┤'));

  const grossRow = formatRow('Gross Margin', profiles.map(p => fmtPctVal(p.grossMargin)), profiles.map(p => p.grossMargin), true);
  console.log(chalk.cyan('│') + ' ' + grossRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(grossRow).length)) + ' ' + chalk.cyan('│'));

  const opRow = formatRow('Operating Margin', profiles.map(p => fmtPctVal(p.operatingMargin)), profiles.map(p => p.operatingMargin), true);
  console.log(chalk.cyan('│') + ' ' + opRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(opRow).length)) + ' ' + chalk.cyan('│'));

  const profitRow = formatRow('Profit Margin', profiles.map(p => fmtPctVal(p.profitMargin)), profiles.map(p => p.profitMargin), true);
  console.log(chalk.cyan('│') + ' ' + profitRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(profitRow).length)) + ' ' + chalk.cyan('│'));

  // Section: Financial Health
  console.log(chalk.cyan('├─') + chalk.cyan(' Financial Health ') + chalk.cyan('─'.repeat(Math.max(0, width - 22))) + chalk.cyan('┤'));

  const deRow = formatRow('Debt/Equity', profiles.map(p => fmtRatio(p.debtToEquity)), profiles.map(p => p.debtToEquity), false);
  console.log(chalk.cyan('│') + ' ' + deRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(deRow).length)) + ' ' + chalk.cyan('│'));

  const crRow = formatRow('Current Ratio', profiles.map(p => fmtRatio(p.currentRatio)), profiles.map(p => p.currentRatio), true);
  console.log(chalk.cyan('│') + ' ' + crRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(crRow).length)) + ' ' + chalk.cyan('│'));

  const cashRow = simpleRow('Cash', profiles.map(p => fmtLarge(p.totalCash)));
  console.log(chalk.cyan('│') + ' ' + cashRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(cashRow).length)) + ' ' + chalk.cyan('│'));

  const debtRow = simpleRow('Debt', profiles.map(p => fmtLarge(p.totalDebt)));
  console.log(chalk.cyan('│') + ' ' + debtRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(debtRow).length)) + ' ' + chalk.cyan('│'));

  // Section: Analyst View (if any have analyst data)
  const hasAnalyst = profiles.some(p => p.targetPrice && p.numberOfAnalysts);
  if (hasAnalyst) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Analyst View ') + chalk.cyan('─'.repeat(Math.max(0, width - 18))) + chalk.cyan('┤'));

    const targetRow = simpleRow('Target Price', profiles.map(p => p.targetPrice ? fmtPrice(p.targetPrice) : '--'));
    console.log(chalk.cyan('│') + ' ' + targetRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(targetRow).length)) + ' ' + chalk.cyan('│'));

    // Calculate upside
    const upsides = profiles.map(p => p.targetPrice ? ((p.targetPrice - p.price) / p.price) * 100 : null);
    const upsideRow = formatRow('Upside', upsides.map(u => u === null ? '--' : fmtPct(u)), upsides, true);
    console.log(chalk.cyan('│') + ' ' + upsideRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(upsideRow).length)) + ' ' + chalk.cyan('│'));

    const ratingRow = simpleRow('Rating', profiles.map(p => {
      if (!p.recommendationKey) return '--';
      const key = p.recommendationKey.toLowerCase();
      if (key === 'strongbuy' || key === 'buy') return chalk.green(p.recommendationKey.toUpperCase());
      if (key === 'strongsell' || key === 'sell') return chalk.red(p.recommendationKey.toUpperCase());
      return chalk.yellow(p.recommendationKey.toUpperCase());
    }));
    console.log(chalk.cyan('│') + ' ' + ratingRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(ratingRow).length)) + ' ' + chalk.cyan('│'));
  }

  // Section: Dividends (if any have dividends)
  const hasDividends = profiles.some(p => p.dividendYield && p.dividendYield > 0);
  if (hasDividends) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Dividends ') + chalk.cyan('─'.repeat(Math.max(0, width - 15))) + chalk.cyan('┤'));

    const divYieldRow = formatRow('Dividend Yield', profiles.map(p => fmtPctVal(p.dividendYield)), profiles.map(p => p.dividendYield), true);
    console.log(chalk.cyan('│') + ' ' + divYieldRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(divYieldRow).length)) + ' ' + chalk.cyan('│'));

    const payoutRow = simpleRow('Payout Ratio', profiles.map(p => fmtPctVal(p.payoutRatio)));
    console.log(chalk.cyan('│') + ' ' + payoutRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(payoutRow).length)) + ' ' + chalk.cyan('│'));
  }

  // Footer with as-of date
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const latestDate = profiles.reduce((latest, p) => p.asOfDate > latest ? p.asOfDate : latest, profiles[0].asOfDate);
  const asOfStr = `As of ${latestDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(Math.max(0, innerWidth - asOfStr.length)) + ' ' + chalk.cyan('│'));

  // Legend
  const legend = chalk.yellow('★') + ' = Best in category';
  console.log(chalk.cyan('│') + ' ' + chalk.dim(legend) + ' '.repeat(Math.max(0, innerWidth - stripAnsi(legend).length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Market Overview Display
// ═══════════════════════════════════════════════════════════════════════════

function displayMarketOverview(overview: MarketOverview): void {
  const width = 72;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = 'Market Overview';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));

  // Indices section
  console.log(chalk.cyan('├─') + chalk.cyan(' Indices ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

  for (const idx of overview.indices) {
    const arrow = idx.changePercent >= 0 ? '▲' : '▼';
    const color = idx.changePercent >= 0 ? chalk.green : chalk.red;
    const priceStr = idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const changeStr = color(`${arrow} ${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%`);
    const line = `${chalk.white(idx.name.padEnd(14))} ${priceStr.padStart(12)}  ${changeStr}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // VIX
  if (overview.vix !== null) {
    const vixColor = overview.vix > 20 ? chalk.red : overview.vix > 15 ? chalk.yellow : chalk.green;
    const vixLabel = overview.vix > 25 ? '(High Fear)' : overview.vix > 20 ? '(Elevated)' : overview.vix > 15 ? '(Normal)' : '(Low)';
    const vixLine = `${chalk.white('VIX'.padEnd(14))} ${overview.vix.toFixed(2).padStart(12)}  ${vixColor(vixLabel)}`;
    const vixStripped = stripAnsi(vixLine);
    const vixPad = Math.max(0, innerWidth - vixStripped.length);
    console.log(chalk.cyan('│') + ' ' + vixLine + ' '.repeat(vixPad) + ' ' + chalk.cyan('│'));
  }

  // Sector performance
  console.log(chalk.cyan('├─') + chalk.cyan(' Sector Performance ') + chalk.cyan('─'.repeat(Math.max(0, width - 24))) + chalk.cyan('┤'));

  for (const sector of overview.sectors.slice(0, 6)) {
    const pct = sector.changePercent;
    const color = pct >= 0 ? chalk.green : chalk.red;
    const pctStr = color(`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`);

    // Create a mini bar chart
    const barWidth = 30;
    const maxPct = Math.max(...overview.sectors.map(s => Math.abs(s.changePercent)), 1);
    const barLen = Math.round((Math.abs(pct) / maxPct) * barWidth);
    const bar = pct >= 0
      ? chalk.green('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen))
      : chalk.red('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen));

    const line = `${sector.name.padEnd(16)} ${bar} ${pctStr.padStart(8)}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // Top Movers
  console.log(chalk.cyan('├─') + chalk.cyan(' Top Movers ') + chalk.cyan('─'.repeat(Math.max(0, width - 16))) + chalk.cyan('┤'));

  // Gainers row
  const gainerStrs = overview.gainers.slice(0, 4).map(g =>
    chalk.green(`${g.symbol} +${g.changePercent.toFixed(1)}%`)
  );
  const gainerLine = `${chalk.dim('▲')} ${gainerStrs.join('  ')}`;
  const gainerStripped = stripAnsi(gainerLine);
  const gainerPad = Math.max(0, innerWidth - gainerStripped.length);
  console.log(chalk.cyan('│') + ' ' + gainerLine + ' '.repeat(gainerPad) + ' ' + chalk.cyan('│'));

  // Losers row
  const loserStrs = overview.losers.slice(0, 4).map(l =>
    chalk.red(`${l.symbol} ${l.changePercent.toFixed(1)}%`)
  );
  const loserLine = `${chalk.dim('▼')} ${loserStrs.join('  ')}`;
  const loserStripped = stripAnsi(loserLine);
  const loserPad = Math.max(0, innerWidth - loserStripped.length);
  console.log(chalk.cyan('│') + ' ' + loserLine + ' '.repeat(loserPad) + ' ' + chalk.cyan('│'));

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const asOfStr = `As of ${overview.asOfDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(Math.max(0, innerWidth - asOfStr.length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Events Calendar Display
// ═══════════════════════════════════════════════════════════════════════════

function displayEventsCalendar(calendar: EventsCalendar): void {
  const width = 72;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = 'Upcoming Events (Next 30 Days)';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));

  // Earnings section
  console.log(chalk.cyan('├─') + chalk.cyan(' Earnings ') + chalk.cyan('─'.repeat(Math.max(0, width - 14))) + chalk.cyan('┤'));

  if (calendar.earnings.length === 0) {
    const noEarnings = chalk.dim('No upcoming earnings in the next 30 days');
    console.log(chalk.cyan('│') + ' ' + noEarnings + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noEarnings).length)) + ' ' + chalk.cyan('│'));
  } else {
    for (const event of calendar.earnings.slice(0, 8)) {
      const dateStr = event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const estStr = event.estimate !== null ? chalk.dim(`Est: $${event.estimate.toFixed(2)}`) : '';
      const nameTrunc = event.name.length > 25 ? event.name.slice(0, 22) + '...' : event.name;
      const line = `${chalk.yellow(dateStr.padEnd(8))} ${chalk.white(event.symbol.padEnd(6))} ${chalk.dim(nameTrunc.padEnd(26))} ${estStr}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  // Dividends section
  console.log(chalk.cyan('├─') + chalk.cyan(' Ex-Dividend Dates ') + chalk.cyan('─'.repeat(Math.max(0, width - 23))) + chalk.cyan('┤'));

  if (calendar.dividends.length === 0) {
    const noDividends = chalk.dim('No upcoming ex-dividend dates in the next 30 days');
    console.log(chalk.cyan('│') + ' ' + noDividends + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noDividends).length)) + ' ' + chalk.cyan('│'));
  } else {
    for (const event of calendar.dividends.slice(0, 8)) {
      const dateStr = event.exDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const yieldStr = event.yield !== null ? chalk.green(`${(event.yield * 100).toFixed(2)}% yield`) : '';
      const amtStr = event.amount !== null ? chalk.dim(`$${event.amount.toFixed(2)}/share`) : '';
      const line = `${chalk.yellow(dateStr.padEnd(8))} ${chalk.white(event.symbol.padEnd(6))} ${amtStr.padEnd(20)} ${yieldStr}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const asOfStr = `As of ${calendar.asOfDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(Math.max(0, innerWidth - asOfStr.length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// News Feed Display
// ═══════════════════════════════════════════════════════════════════════════

function displayNewsFeed(articles: NewsArticle[], forSymbols?: string[]): void {
  const width = 72;
  const innerWidth = width - 4;

  // Store articles for "read N" command
  lastNewsArticles = articles.slice(0, 12);

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = forSymbols && forSymbols.length > 0
    ? `News: ${forSymbols.join(', ')}`
    : 'Market News';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  if (articles.length === 0) {
    const noNews = chalk.dim('No recent news available');
    console.log(chalk.cyan('│') + ' ' + noNews + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noNews).length)) + ' ' + chalk.cyan('│'));
  } else {
    articles.slice(0, 12).forEach((article, index) => {
      // Time ago
      const now = Date.now();
      const diffMs = now - article.publishedAt.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeAgo: string;
      if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }

      // Article number
      const numStr = chalk.cyan(`[${index + 1}]`);

      // Truncate title to fit (account for number prefix)
      const maxTitleLen = innerWidth - 6;
      const truncTitle = article.title.length > maxTitleLen
        ? article.title.slice(0, maxTitleLen - 3) + '...'
        : article.title;

      // Title line with number
      const titleLine = `${numStr} ${chalk.white(truncTitle)}`;
      const titleStripped = stripAnsi(titleLine);
      const titlePadding = Math.max(0, innerWidth - titleStripped.length);
      console.log(chalk.cyan('│') + ' ' + titleLine + ' '.repeat(titlePadding) + ' ' + chalk.cyan('│'));

      // Meta line (publisher + time + symbols)
      const symbolsStr = article.symbols.slice(0, 3).join(', ');
      const metaLine = `    ${chalk.dim(article.publisher)} · ${chalk.dim(timeAgo)}${symbolsStr ? ` · ${chalk.yellow(symbolsStr)}` : ''}`;
      const metaStripped = stripAnsi(metaLine);
      const metaPadding = Math.max(0, innerWidth - metaStripped.length);
      console.log(chalk.cyan('│') + ' ' + metaLine + ' '.repeat(metaPadding) + ' ' + chalk.cyan('│'));

      // Separator between articles (except last)
      if (index < Math.min(articles.length, 12) - 1) {
        console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));
      }
    });
  }

  // Footer with hint
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const hint = chalk.dim('Type "read N" to read article');
  console.log(chalk.cyan('│') + ' ' + hint + ' '.repeat(Math.max(0, innerWidth - stripAnsi(hint).length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// SEC Filings Display
// ═══════════════════════════════════════════════════════════════════════════

function displayFilings(filings: SECFiling[], symbol: string): void {
  const width = 74;
  const innerWidth = width - 4;

  // Store filings for "filing N" command
  lastFilings = filings.slice(0, 15);
  lastFilingsSymbol = symbol.toUpperCase();

  console.log('');
  console.log(chalk.magenta('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = `SEC Filings: ${symbol.toUpperCase()}`;
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.magenta('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.magenta('│'));
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  if (filings.length === 0) {
    const noFilings = chalk.dim('No recent filings found');
    console.log(chalk.magenta('│') + ' ' + noFilings + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noFilings).length)) + ' ' + chalk.magenta('│'));
  } else {
    filings.slice(0, 15).forEach((filing, index) => {
      // Form type with color coding
      const formColor = filing.form === '10-K' ? chalk.cyan :
                        filing.form === '10-Q' ? chalk.blue :
                        filing.form === '8-K' ? chalk.yellow : chalk.white;

      // Filing number
      const numStr = chalk.magenta(`[${(index + 1).toString().padStart(2)}]`);

      // Form and date
      const formStr = formColor(filing.form.padEnd(6));
      const dateStr = chalk.dim(filing.filingDate);

      // Description (truncated)
      const maxDescLen = innerWidth - 22;
      const desc = filing.description.length > maxDescLen
        ? filing.description.slice(0, maxDescLen - 3) + '...'
        : filing.description;

      const line = `${numStr} ${formStr} ${dateStr}  ${chalk.white(desc)}`;
      const lineStripped = stripAnsi(line);
      const linePadding = Math.max(0, innerWidth - lineStripped.length);
      console.log(chalk.magenta('│') + ' ' + line + ' '.repeat(linePadding) + ' ' + chalk.magenta('│'));
    });
  }

  // Footer with hint
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
  const hint = chalk.dim('Type "filing N" to read filing (e.g., filing 1)');
  console.log(chalk.magenta('│') + ' ' + hint + ' '.repeat(Math.max(0, innerWidth - stripAnsi(hint).length)) + ' ' + chalk.magenta('│'));

  console.log(chalk.magenta('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

async function displayFiling(filing: SECFiling, symbol: string): Promise<void> {
  const width = 78;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.magenta('╭' + '─'.repeat(width - 2) + '╮'));

  // Header
  const formColor = filing.form === '10-K' ? chalk.cyan :
                    filing.form === '10-Q' ? chalk.blue :
                    filing.form === '8-K' ? chalk.yellow : chalk.white;

  const title = `${symbol.toUpperCase()} - ${filing.form}`;
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.magenta('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.magenta('│'));

  // Filing meta
  const meta = `Filed: ${filing.filingDate} | Report Date: ${filing.reportDate}`;
  console.log(chalk.magenta('│') + ' ' + chalk.dim(meta) + ' '.repeat(Math.max(0, innerWidth - meta.length)) + ' ' + chalk.magenta('│'));

  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  // Description
  const descLabel = chalk.bold.yellow('Description');
  console.log(chalk.magenta('│') + ' ' + descLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(descLabel).length)) + ' ' + chalk.magenta('│'));

  const descLines = wrapText(filing.description, innerWidth - 2);
  for (const line of descLines) {
    console.log(chalk.magenta('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.magenta('│'));
  }

  console.log(chalk.magenta('│') + ' '.repeat(innerWidth) + ' ' + chalk.magenta('│'));

  // Fetch and parse the filing content
  const text = await getFilingText(filing, 80000);

  if (!text) {
    const errorMsg = chalk.red('Could not fetch filing content');
    console.log(chalk.magenta('│') + ' ' + errorMsg + ' '.repeat(Math.max(0, innerWidth - stripAnsi(errorMsg).length)) + ' ' + chalk.magenta('│'));
  } else {
    // For 8-K filings, identify the event types
    if (filing.form === '8-K') {
      const items = identify8KItems(text);
      if (items.length > 0) {
        console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
        const eventsLabel = chalk.bold.yellow('Event Types');
        console.log(chalk.magenta('│') + ' ' + eventsLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(eventsLabel).length)) + ' ' + chalk.magenta('│'));

        for (const item of items.slice(0, 5)) {
          const itemLine = `• ${item}`;
          const truncItem = itemLine.length > innerWidth - 2 ? itemLine.slice(0, innerWidth - 5) + '...' : itemLine;
          console.log(chalk.magenta('│') + ' ' + chalk.white(truncItem) + ' '.repeat(Math.max(0, innerWidth - truncItem.length)) + ' ' + chalk.magenta('│'));
        }
      }
    }

    // Extract key sections for 10-K/10-Q
    const sections = extractKeySections(text);
    if (sections.length > 0) {
      for (const section of sections.slice(0, 3)) {
        console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
        const sectionLabel = chalk.bold.yellow(section.title);
        console.log(chalk.magenta('│') + ' ' + sectionLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(sectionLabel).length)) + ' ' + chalk.magenta('│'));
        console.log(chalk.magenta('│') + ' '.repeat(innerWidth) + ' ' + chalk.magenta('│'));

        // Clean and wrap content
        const cleanContent = section.content
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 800);

        const contentLines = wrapText(cleanContent, innerWidth - 2);
        for (const line of contentLines.slice(0, 12)) {
          console.log(chalk.magenta('│') + ' ' + chalk.dim(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.magenta('│'));
        }
        if (contentLines.length > 12) {
          console.log(chalk.magenta('│') + ' ' + chalk.dim('...') + ' '.repeat(innerWidth - 3) + ' ' + chalk.magenta('│'));
        }
      }
    } else {
      // If no sections extracted, show raw text excerpt
      console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
      const excerptLabel = chalk.bold.yellow('Filing Excerpt');
      console.log(chalk.magenta('│') + ' ' + excerptLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(excerptLabel).length)) + ' ' + chalk.magenta('│'));
      console.log(chalk.magenta('│') + ' '.repeat(innerWidth) + ' ' + chalk.magenta('│'));

      const excerpt = text.slice(0, 1500).replace(/\s+/g, ' ').trim();
      const excerptLines = wrapText(excerpt, innerWidth - 2);
      for (const line of excerptLines.slice(0, 20)) {
        console.log(chalk.magenta('│') + ' ' + chalk.dim(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.magenta('│'));
      }
      if (excerptLines.length > 20) {
        console.log(chalk.magenta('│') + ' ' + chalk.dim('...') + ' '.repeat(innerWidth - 3) + ' ' + chalk.magenta('│'));
      }
    }
  }

  // Footer with link
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
  const linkLabel = 'Full document: ';
  const maxUrlLen = innerWidth - linkLabel.length - 2;
  const truncUrl = filing.fileUrl.length > maxUrlLen
    ? filing.fileUrl.slice(0, maxUrlLen - 3) + '...'
    : filing.fileUrl;
  const linkLine = chalk.dim(linkLabel) + chalk.blue.underline(truncUrl);
  console.log(chalk.magenta('│') + ' ' + linkLine + ' '.repeat(Math.max(0, innerWidth - stripAnsi(linkLine).length)) + ' ' + chalk.magenta('│'));

  console.log(chalk.magenta('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Market Brief Display
// ═══════════════════════════════════════════════════════════════════════════

function displayMarketBrief(brief: MarketBrief): void {
  const width = 78;
  const innerWidth = width - 4;
  const { data, narrative } = brief;

  const dateStr = data.asOfDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = data.asOfDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Header
  const title = 'MARKET BRIEF';
  const dateTime = `${dateStr} ${timeStr}`;
  const headerLine = `${chalk.bold.white(title)}${' '.repeat(Math.max(0, innerWidth - title.length - dateTime.length))}${chalk.dim(dateTime)}`;
  console.log(chalk.cyan('│') + ' ' + headerLine + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim('AI-generated market intelligence') + ' '.repeat(Math.max(0, innerWidth - 33)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('╞' + '═'.repeat(width - 2) + '╡'));

  // AI Narrative (if available)
  if (narrative) {
    // Headline
    const headlineLines = wrapText(narrative.headline, innerWidth);
    for (const line of headlineLines) {
      console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
    console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));

    // Summary
    const summaryLines = wrapText(narrative.summary, innerWidth);
    for (const line of summaryLines) {
      console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
    console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));
  }

  // Market Snapshot Section
  console.log(chalk.cyan('├─') + chalk.cyan(' MARKET SNAPSHOT ') + chalk.cyan('─'.repeat(Math.max(0, width - 21))) + chalk.cyan('┤'));

  // Indices header
  const idxHeader = `${'Index'.padEnd(14)} ${'Price'.padStart(12)} ${'Day'.padStart(8)} ${'Week'.padStart(8)} ${'YTD'.padStart(8)}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(idxHeader) + ' '.repeat(Math.max(0, innerWidth - idxHeader.length)) + ' ' + chalk.cyan('│'));

  // Indices rows
  for (const idx of data.indices) {
    const dayColor = idx.changePercent >= 0 ? chalk.green : chalk.red;
    const weekColor = (idx.weekChange ?? 0) >= 0 ? chalk.green : chalk.red;
    const ytdColor = (idx.ytdChange ?? 0) >= 0 ? chalk.green : chalk.red;

    const dayStr = `${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%`;
    const weekStr = idx.weekChange !== null ? `${idx.weekChange >= 0 ? '+' : ''}${idx.weekChange.toFixed(1)}%` : 'n/a';
    const ytdStr = idx.ytdChange !== null ? `${idx.ytdChange >= 0 ? '+' : ''}${idx.ytdChange.toFixed(1)}%` : 'n/a';

    const line = `${chalk.white(idx.name.padEnd(14))} ${idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)} ${dayColor(dayStr.padStart(8))} ${weekColor(weekStr.padStart(8))} ${ytdColor(ytdStr.padStart(8))}`;
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));

  // Indicators row
  const ind = data.indicators;
  const indicatorParts: string[] = [];
  if (ind.vix) {
    const vixColor = ind.vix.value > 20 ? chalk.red : ind.vix.value > 15 ? chalk.yellow : chalk.green;
    indicatorParts.push(`VIX ${vixColor(ind.vix.value.toFixed(1))}`);
  }
  if (ind.treasury10Y) {
    const yieldChange = ind.treasury10Y.change >= 0 ? '+' : '';
    indicatorParts.push(`10Y ${ind.treasury10Y.value.toFixed(2)}% (${yieldChange}${(ind.treasury10Y.change * 100).toFixed(0)}bps)`);
  }
  if (ind.oil) {
    const oilColor = ind.oil.changePercent >= 0 ? chalk.green : chalk.red;
    indicatorParts.push(`Oil $${ind.oil.value.toFixed(0)} ${oilColor(`${ind.oil.changePercent >= 0 ? '+' : ''}${ind.oil.changePercent.toFixed(1)}%`)}`);
  }
  if (ind.bitcoin) {
    const btcColor = ind.bitcoin.changePercent >= 0 ? chalk.green : chalk.red;
    indicatorParts.push(`BTC $${(ind.bitcoin.value / 1000).toFixed(1)}k ${btcColor(`${ind.bitcoin.changePercent >= 0 ? '+' : ''}${ind.bitcoin.changePercent.toFixed(1)}%`)}`);
  }

  if (indicatorParts.length > 0) {
    const indLine = indicatorParts.join('  |  ');
    const indStripped = stripAnsi(indLine);
    console.log(chalk.cyan('│') + ' ' + indLine + ' '.repeat(Math.max(0, innerWidth - indStripped.length)) + ' ' + chalk.cyan('│'));
  }

  // Sector Performance
  console.log(chalk.cyan('├─') + chalk.cyan(' SECTOR PERFORMANCE ') + chalk.cyan('─'.repeat(Math.max(0, width - 24))) + chalk.cyan('┤'));

  const topSectors = data.sectors.slice(0, 5);
  const bottomSectors = data.sectors.slice(-3);

  for (const sec of topSectors) {
    const pct = sec.changePercent;
    const color = pct >= 0 ? chalk.green : chalk.red;
    const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;

    // Bar chart
    const barWidth = 25;
    const maxPct = Math.max(...data.sectors.map(s => Math.abs(s.changePercent)), 1);
    const barLen = Math.min(Math.round((Math.abs(pct) / maxPct) * barWidth), barWidth);
    const bar = pct >= 0
      ? chalk.green('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen))
      : chalk.red('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen));

    const weekStr = sec.weekChange !== null ? ` (${sec.weekChange >= 0 ? '+' : ''}${sec.weekChange.toFixed(1)}% wk)` : '';
    const line = `${sec.name.padEnd(16)} ${bar} ${color(pctStr.padStart(7))}${chalk.dim(weekStr)}`;
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  // Show laggards indicator
  if (bottomSectors.length > 0 && bottomSectors[0].changePercent < 0) {
    const laggardLine = chalk.dim(`Laggards: ${bottomSectors.map(s => `${s.name} ${s.changePercent.toFixed(1)}%`).join(', ')}`);
    const laggardStripped = stripAnsi(laggardLine);
    console.log(chalk.cyan('│') + ' ' + laggardLine + ' '.repeat(Math.max(0, innerWidth - laggardStripped.length)) + ' ' + chalk.cyan('│'));
  }

  // Top Movers
  console.log(chalk.cyan('├─') + chalk.cyan(' TOP MOVERS ') + chalk.cyan('─'.repeat(Math.max(0, width - 16))) + chalk.cyan('┤'));

  // Gainers
  const gainerLine = data.gainers.slice(0, 5).map(g =>
    chalk.green(`${g.symbol} +${g.changePercent.toFixed(1)}%`)
  ).join('  ');
  const gainerStripped = stripAnsi(gainerLine);
  console.log(chalk.cyan('│') + ' ' + chalk.dim('UP   ') + gainerLine + ' '.repeat(Math.max(0, innerWidth - 5 - gainerStripped.length)) + ' ' + chalk.cyan('│'));

  // Losers
  const loserLine = data.losers.slice(0, 5).map(l =>
    chalk.red(`${l.symbol} ${l.changePercent.toFixed(1)}%`)
  ).join('  ');
  const loserStripped = stripAnsi(loserLine);
  console.log(chalk.cyan('│') + ' ' + chalk.dim('DOWN ') + loserLine + ' '.repeat(Math.max(0, innerWidth - 5 - loserStripped.length)) + ' ' + chalk.cyan('│'));

  // Breadth
  const breadthRatio = (data.breadth.advancing / Math.max(data.breadth.declining, 1)).toFixed(2);
  const breadthColor = parseFloat(breadthRatio) > 1.2 ? chalk.green : parseFloat(breadthRatio) < 0.8 ? chalk.red : chalk.yellow;
  const breadthLine = `Breadth: ${data.breadth.advancing} up / ${data.breadth.declining} down (${breadthColor(breadthRatio + ':1')})`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(breadthLine) + ' '.repeat(Math.max(0, innerWidth - breadthLine.length)) + ' ' + chalk.cyan('│'));

  // News Headlines
  if (data.topNews.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' TOP STORIES ') + chalk.cyan('─'.repeat(Math.max(0, width - 17))) + chalk.cyan('┤'));

    for (const news of data.topNews.slice(0, 4)) {
      const maxLen = innerWidth - 4;
      const title = news.title.length > maxLen ? news.title.slice(0, maxLen - 3) + '...' : news.title;
      console.log(chalk.cyan('│') + ' ' + chalk.dim('> ') + chalk.white(title) + ' '.repeat(Math.max(0, innerWidth - title.length - 2)) + ' ' + chalk.cyan('│'));
    }
  }

  // Upcoming Earnings
  if (data.upcomingEarnings.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' EARNINGS THIS WEEK ') + chalk.cyan('─'.repeat(Math.max(0, width - 24))) + chalk.cyan('┤'));

    for (const earning of data.upcomingEarnings.slice(0, 4)) {
      const dateStr = earning.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const estStr = earning.estimate !== null ? `Est: $${earning.estimate.toFixed(2)}` : '';
      const line = `${chalk.yellow(dateStr.padEnd(12))} ${chalk.white(earning.symbol.padEnd(6))} ${chalk.dim(earning.name.slice(0, 25).padEnd(26))} ${chalk.dim(estStr)}`;
      const stripped = stripAnsi(line);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
    }
  }

  // AI Themes and Outlook (if available)
  if (narrative && narrative.keyThemes.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' KEY THEMES ') + chalk.cyan('─'.repeat(Math.max(0, width - 16))) + chalk.cyan('┤'));
    const themesLine = narrative.keyThemes.map((t, i) => `${i + 1}. ${t}`).join('  ');
    const themesWrapped = wrapText(themesLine, innerWidth);
    for (const line of themesWrapped) {
      console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
  }

  if (narrative && narrative.outlook) {
    console.log(chalk.cyan('├─') + chalk.cyan(' OUTLOOK ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));
    const outlookWrapped = wrapText(narrative.outlook, innerWidth);
    for (const line of outlookWrapped) {
      console.log(chalk.cyan('│') + ' ' + chalk.dim(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
  }

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const footerHint = 'Ask: "why is NVDA up?" | "news AAPL" | "s MSFT" for details';
  console.log(chalk.cyan('│') + ' ' + chalk.dim(footerHint) + ' '.repeat(Math.max(0, innerWidth - footerHint.length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Article Display
// ═══════════════════════════════════════════════════════════════════════════

function displayArticle(article: ArticleContent, source: string): void {
  const width = 76;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title (wrapped)
  const titleLines = wrapText(article.title, innerWidth);
  for (const line of titleLines) {
    const padding = Math.max(0, innerWidth - line.length);
    console.log(chalk.cyan('│') + ' ' + chalk.bold.white(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // Byline and source
  const byline = article.byline ? `By ${article.byline}` : '';
  const siteName = article.siteName || source;
  const metaLine = byline ? `${byline} · ${siteName}` : siteName;
  const metaPad = Math.max(0, innerWidth - metaLine.length);
  console.log(chalk.cyan('│') + ' ' + chalk.dim(metaLine) + ' '.repeat(metaPad) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╞' + '═'.repeat(width - 2) + '╡'));

  // Article content - clean and wrap
  const cleanText = article.textContent
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n')  // Keep paragraph breaks
    .trim();

  // Split into paragraphs and display
  const paragraphs = cleanText.split(/\n\n+/);
  let lineCount = 0;
  const maxLines = 60; // Limit to prevent overwhelming output

  for (const para of paragraphs) {
    if (lineCount >= maxLines) break;

    const lines = wrapText(para.trim(), innerWidth);
    for (const line of lines) {
      if (lineCount >= maxLines) break;

      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
      lineCount++;
    }

    // Empty line between paragraphs
    if (lineCount < maxLines) {
      console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));
      lineCount++;
    }
  }

  // If we hit the limit, show truncation message
  if (lineCount >= maxLines) {
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
    const truncMsg = chalk.dim('(Article truncated - showing first ~60 lines)');
    console.log(chalk.cyan('│') + ' ' + truncMsg + ' '.repeat(Math.max(0, innerWidth - stripAnsi(truncMsg).length)) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Research Report Display
// ═══════════════════════════════════════════════════════════════════════════

function displayResearchReport(report: ResearchReport): void {
  const width = 70;
  const innerWidth = width - 4;

  console.log('');

  // Header
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  console.log(chalk.cyan(top));

  // Title
  const title = `RESEARCH PRIMER: ${report.symbol}`;
  const titlePadding = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePadding) + ' ' + chalk.cyan('│'));

  // Subtitle
  const subtitle = `${report.companyName} | Generated ${report.generatedAt.toLocaleDateString()}`;
  const subPadding = Math.max(0, innerWidth - subtitle.length);
  console.log(chalk.cyan('│') + ' ' + chalk.dim(subtitle) + ' '.repeat(subPadding) + ' ' + chalk.cyan('│'));

  // Divider
  console.log(chalk.cyan('╞' + '═'.repeat(width - 2) + '╡'));

  // Helper to print a section
  const printSection = (title: string, content: string | string[]) => {
    // Section header
    console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow(title) + ' '.repeat(Math.max(0, innerWidth - title.length)) + ' ' + chalk.cyan('│'));
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

    // Content
    const lines = Array.isArray(content) ? content : wrapText(content, innerWidth);
    for (const line of lines) {
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }

    // Bottom divider
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  };

  // Helper for bullet lists
  const printBulletSection = (title: string, items: string[]) => {
    console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow(title) + ' '.repeat(Math.max(0, innerWidth - title.length)) + ' ' + chalk.cyan('│'));
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

    for (const item of items) {
      const wrapped = wrapText(`- ${item}`, innerWidth - 2);
      for (let i = 0; i < wrapped.length; i++) {
        const line = i === 0 ? wrapped[i] : `  ${wrapped[i]}`;
        const padding = Math.max(0, innerWidth - line.length);
        console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
      }
    }

    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  };

  // Executive Summary
  printSection('EXECUTIVE SUMMARY', report.executiveSummary);

  // Business Overview
  printSection('BUSINESS OVERVIEW', report.businessOverview);

  // Key Segments
  if (report.keySegments.length > 0) {
    printBulletSection('KEY SEGMENTS', report.keySegments);
  }

  // Competitive Position
  printSection('COMPETITIVE POSITION', report.competitivePosition);

  // Financial Highlights
  printSection('FINANCIAL HIGHLIGHTS', report.financialHighlights);

  // Catalysts
  if (report.catalysts.length > 0) {
    printBulletSection('UPCOMING CATALYSTS', report.catalysts);
  }

  // Risks
  if (report.risks.length > 0) {
    printBulletSection('KEY RISKS', report.risks);
  }

  // Bull Case
  console.log(chalk.cyan('│') + ' ' + chalk.bold.green('BULL CASE') + ' '.repeat(Math.max(0, innerWidth - 9)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const bullLines = wrapText(report.bullCase, innerWidth);
  for (const line of bullLines) {
    const padding = Math.max(0, innerWidth - line.length);
    console.log(chalk.cyan('│') + ' ' + chalk.green(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Bear Case
  console.log(chalk.cyan('│') + ' ' + chalk.bold.red('BEAR CASE') + ' '.repeat(Math.max(0, innerWidth - 9)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const bearLines = wrapText(report.bearCase, innerWidth);
  for (const line of bearLines) {
    const padding = Math.max(0, innerWidth - line.length);
    console.log(chalk.cyan('│') + ' ' + chalk.red(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Conclusion
  console.log(chalk.cyan('│') + ' ' + chalk.bold.cyan('CONCLUSION') + ' '.repeat(Math.max(0, innerWidth - 10)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('╞' + '═'.repeat(width - 2) + '╡'));
  const concLines = wrapText(report.conclusion, innerWidth);
  for (const line of concLines) {
    const padding = Math.max(0, innerWidth - line.length);
    console.log(chalk.cyan('│') + ' ' + chalk.bold.white(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // Footer
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  console.log(chalk.cyan(bottom));

  // Disclaimer
  console.log('');
  console.log(chalk.dim('  This report is AI-generated for informational purposes only.'));
  console.log(chalk.dim('  Not financial advice. Always do your own research.'));
  console.log('');
}

async function showReport(symbol: string): Promise<void> {
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

// ═══════════════════════════════════════════════════════════════════════════
// Earnings Report Display
// ═══════════════════════════════════════════════════════════════════════════

function formatMetricValue(val: number | string | null, unit: string): string {
  if (val === null) return 'N/A';
  if (typeof val === 'string') return val + unit;
  if (unit === '$B') return `$${val.toFixed(2)}B`;
  if (unit === '$M') return `$${val.toFixed(2)}M`;
  if (unit === '$') return `$${val.toFixed(2)}`;
  if (unit === '%') return `${val.toFixed(1)}%`;
  return `${val}${unit}`;
}

function displayQuarterlyResultsTable(results: QuarterlyResults[], width: number): void {
  const innerWidth = width - 4;

  // Section header
  console.log(chalk.magenta('│') + ' ' + chalk.bold.yellow('QUARTERLY RESULTS') + ' '.repeat(Math.max(0, innerWidth - 17)) + ' ' + chalk.magenta('│'));
  console.log(chalk.magenta('╞' + '═'.repeat(width - 2) + '╡'));

  if (results.length === 0) {
    const noData = 'No quarterly data available';
    const padding = Math.max(0, innerWidth - noData.length);
    console.log(chalk.magenta('│') + ' ' + chalk.dim(noData) + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
    return;
  }

  // Table header
  const header = chalk.dim('Metric'.padEnd(14) + results.slice(0, 4).map(r => r.fiscalQuarter.padStart(12)).join(''));
  const headerStripped = stripAnsi(header);
  const headerPadding = Math.max(0, innerWidth - headerStripped.length);
  console.log(chalk.magenta('│') + ' ' + header + ' '.repeat(headerPadding) + ' ' + chalk.magenta('│'));

  // Separator
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  // Revenue row
  const revRow = 'Revenue'.padEnd(14) + results.slice(0, 4).map(r => {
    const val = r.revenue.actual;
    return (val ? `$${(val / 1e9).toFixed(1)}B` : 'N/A').padStart(12);
  }).join('');
  const revPadding = Math.max(0, innerWidth - revRow.length);
  console.log(chalk.magenta('│') + ' ' + chalk.white(revRow) + ' '.repeat(revPadding) + ' ' + chalk.magenta('│'));

  // Operating Income row
  const opRow = 'Op Income'.padEnd(14) + results.slice(0, 4).map(r => {
    const val = r.operatingIncome.actual;
    return (val ? `$${(val / 1e9).toFixed(1)}B` : 'N/A').padStart(12);
  }).join('');
  const opPadding = Math.max(0, innerWidth - opRow.length);
  console.log(chalk.magenta('│') + ' ' + chalk.white(opRow) + ' '.repeat(opPadding) + ' ' + chalk.magenta('│'));

  // Operating Margin row
  const opmRow = 'Op Margin'.padEnd(14) + results.slice(0, 4).map(r => {
    const val = r.operatingMargin.actual;
    return (val ? `${val.toFixed(1)}%` : 'N/A').padStart(12);
  }).join('');
  const opmPadding = Math.max(0, innerWidth - opmRow.length);
  console.log(chalk.magenta('│') + ' ' + chalk.white(opmRow) + ' '.repeat(opmPadding) + ' ' + chalk.magenta('│'));

  // EPS row with beat/miss coloring
  const epsLabel = 'EPS'.padEnd(14);
  let epsValues = '';
  for (const r of results.slice(0, 4)) {
    const val = r.eps.actual;
    const str = (val !== null ? `$${val.toFixed(2)}` : 'N/A').padStart(12);
    if (r.eps.comment === 'Beat') {
      epsValues += chalk.green(str);
    } else if (r.eps.comment === 'Miss') {
      epsValues += chalk.red(str);
    } else {
      epsValues += str;
    }
  }
  const epsLine = epsLabel + epsValues;
  const epsStripped = stripAnsi(epsLine);
  const epsPadding = Math.max(0, innerWidth - epsStripped.length);
  console.log(chalk.magenta('│') + ' ' + epsLine + ' '.repeat(epsPadding) + ' ' + chalk.magenta('│'));

  // EPS Consensus row
  const epsConsLabel = 'EPS Cons'.padEnd(14);
  const epsConsValues = results.slice(0, 4).map(r => {
    const val = r.eps.consensus;
    return (val !== null ? `$${val.toFixed(2)}` : 'N/A').padStart(12);
  }).join('');
  const epsConsRow = epsConsLabel + epsConsValues;
  const epsConsPadding = Math.max(0, innerWidth - epsConsRow.length);
  console.log(chalk.magenta('│') + ' ' + chalk.dim(epsConsRow) + ' '.repeat(epsConsPadding) + ' ' + chalk.magenta('│'));

  // EPS Diff row with coloring
  const epsDiffLabel = 'EPS Diff'.padEnd(14);
  let epsDiffValues = '';
  for (const r of results.slice(0, 4)) {
    const diff = r.eps.diff;
    const str = (diff !== null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%` : 'N/A').padStart(12);
    if (diff !== null && diff > 0) {
      epsDiffValues += chalk.green(str);
    } else if (diff !== null && diff < 0) {
      epsDiffValues += chalk.red(str);
    } else {
      epsDiffValues += str;
    }
  }
  const epsDiffLine = epsDiffLabel + epsDiffValues;
  const epsDiffStripped = stripAnsi(epsDiffLine);
  const epsDiffPadding = Math.max(0, innerWidth - epsDiffStripped.length);
  console.log(chalk.magenta('│') + ' ' + epsDiffLine + ' '.repeat(epsDiffPadding) + ' ' + chalk.magenta('│'));

  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
}

function displayKPITable(kpis: KPIMetric[], width: number): void {
  const innerWidth = width - 4;

  // Section header
  console.log(chalk.magenta('│') + ' ' + chalk.bold.yellow('KEY PERFORMANCE INDICATORS') + ' '.repeat(Math.max(0, innerWidth - 27)) + ' ' + chalk.magenta('│'));
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  if (kpis.length === 0) {
    const noData = 'No KPI data available';
    const padding = Math.max(0, innerWidth - noData.length);
    console.log(chalk.magenta('│') + ' ' + chalk.dim(noData) + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
    return;
  }

  // Table header
  const header = chalk.dim('KPI'.padEnd(20) + 'Actual'.padStart(12) + 'Consensus'.padStart(12) + 'Diff'.padStart(10) + 'Status'.padStart(10));
  const headerStripped = stripAnsi(header);
  const headerPadding = Math.max(0, innerWidth - headerStripped.length);
  console.log(chalk.magenta('│') + ' ' + header + ' '.repeat(headerPadding) + ' ' + chalk.magenta('│'));
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  for (const kpi of kpis) {
    const name = kpi.name.padEnd(20);
    const actual = formatMetricValue(kpi.actual, kpi.unit).padStart(12);
    const consensus = formatMetricValue(kpi.consensus, kpi.unit).padStart(12);
    const diff = (kpi.diff !== null ? `${kpi.diff >= 0 ? '+' : ''}${kpi.diff.toFixed(1)}%` : 'N/A').padStart(10);
    const status = (kpi.comment ?? 'N/A').padStart(10);

    const diffColored = kpi.diff !== null && kpi.diff > 0 ? chalk.green(diff) : kpi.diff !== null && kpi.diff < 0 ? chalk.red(diff) : diff;
    const statusColored = kpi.comment === 'Beat' ? chalk.green(status) : kpi.comment === 'Miss' ? chalk.red(status) : status;

    const line = name + actual + consensus + diffColored + statusColored;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.magenta('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
  }

  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
}

function displayGuidanceTable(guidance: GuidanceMetric[], width: number): void {
  const innerWidth = width - 4;

  // Section header
  console.log(chalk.magenta('│') + ' ' + chalk.bold.yellow('FY GUIDANCE') + ' '.repeat(Math.max(0, innerWidth - 11)) + ' ' + chalk.magenta('│'));
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  if (guidance.length === 0) {
    const noData = 'No guidance data available';
    const padding = Math.max(0, innerWidth - noData.length);
    console.log(chalk.magenta('│') + ' ' + chalk.dim(noData) + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
    return;
  }

  // Table header
  const header = chalk.dim('Metric'.padEnd(18) + 'Current'.padStart(12) + 'Guidance'.padStart(12) + 'Prior'.padStart(12) + 'Change'.padStart(12));
  const headerStripped = stripAnsi(header);
  const headerPadding = Math.max(0, innerWidth - headerStripped.length);
  console.log(chalk.magenta('│') + ' ' + header + ' '.repeat(headerPadding) + ' ' + chalk.magenta('│'));
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  for (const g of guidance) {
    const metric = g.metric.padEnd(18);
    const current = formatMetricValue(g.current, g.unit).padStart(12);
    const guidanceVal = formatMetricValue(g.guidance, g.unit).padStart(12);
    const prior = formatMetricValue(g.priorGuidance, g.unit).padStart(12);
    const change = (g.change ?? 'N/A').padStart(12);

    const changeColored = g.change === 'Raised' ? chalk.green(change) : g.change === 'Lowered' ? chalk.red(change) : chalk.dim(change);

    const line = metric + current + guidanceVal + prior + changeColored;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.magenta('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
  }

  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
}

function displayEarningsReport(report: EarningsReport): void {
  const width = 70;
  const innerWidth = width - 4;

  console.log('');

  // Header
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  console.log(chalk.magenta(top));

  // Title
  const title = `EARNINGS ANALYSIS: ${report.symbol}`;
  const titlePadding = Math.max(0, innerWidth - title.length);
  console.log(chalk.magenta('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePadding) + ' ' + chalk.magenta('│'));

  // Subtitle
  const subtitle = `${report.companyName} | Generated ${report.generatedAt.toLocaleDateString()}`;
  const subPadding = Math.max(0, innerWidth - subtitle.length);
  console.log(chalk.magenta('│') + ' ' + chalk.dim(subtitle) + ' '.repeat(subPadding) + ' ' + chalk.magenta('│'));

  // Next earnings date
  if (report.nextEarningsDate) {
    const daysUntil = Math.ceil((report.nextEarningsDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const dateStr = `Next Earnings: ${report.nextEarningsDate.toLocaleDateString()} (${daysUntil > 0 ? `in ${daysUntil} days` : 'Today'})`;
    const datePadding = Math.max(0, innerWidth - dateStr.length);
    console.log(chalk.magenta('│') + ' ' + chalk.yellow(dateStr) + ' '.repeat(datePadding) + ' ' + chalk.magenta('│'));
  }

  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  // Track Record Summary
  const beatColor = report.beatRate >= 75 ? chalk.green : report.beatRate >= 50 ? chalk.yellow : chalk.red;
  const surpriseColor = report.avgSurprise >= 0 ? chalk.green : chalk.red;

  const trackRecord = `Beat Rate: ${beatColor(`${report.beatRate.toFixed(0)}%`)}  |  Avg Surprise: ${surpriseColor(`${report.avgSurprise >= 0 ? '+' : ''}${report.avgSurprise.toFixed(1)}%`)}  |  Consecutive: ${chalk.cyan(String(report.consecutiveBeats))}`;
  const trackStripped = stripAnsi(trackRecord);
  const trackPadding = Math.max(0, innerWidth - trackStripped.length);
  console.log(chalk.magenta('│') + ' ' + trackRecord + ' '.repeat(trackPadding) + ' ' + chalk.magenta('│'));

  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  // Quarterly Results Table
  displayQuarterlyResultsTable(report.quarterlyResults, width);

  // KPI Table
  displayKPITable(report.kpis, width);

  // Guidance Table
  displayGuidanceTable(report.guidance, width);

  // SEC Filings
  if (report.recentFilings.length > 0) {
    console.log(chalk.magenta('│') + ' ' + chalk.bold.yellow('SEC FILINGS') + ' '.repeat(innerWidth - 11) + ' ' + chalk.magenta('│'));
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

    for (const filing of report.recentFilings.slice(0, 5)) {
      const formColor = filing.form === '10-K' ? chalk.cyan :
                        filing.form === '10-Q' ? chalk.blue :
                        filing.form === '8-K' ? chalk.yellow : chalk.white;
      const line = `${formColor(filing.form.padEnd(6))} ${chalk.dim(filing.filingDate)} ${chalk.white(truncateText(filing.description, 40))}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.magenta('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
    }
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
  }

  // AI Analysis Section
  const printAnalysis = (title: string, content: string) => {
    console.log(chalk.magenta('│') + ' ' + chalk.bold.cyan(title) + ' '.repeat(Math.max(0, innerWidth - title.length)) + ' ' + chalk.magenta('│'));
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

    const lines = wrapText(content, innerWidth);
    for (const line of lines) {
      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.magenta('│') + ' ' + chalk.white(line) + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
    }
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
  };

  printAnalysis('SUMMARY', report.earningsSummary);
  printAnalysis('PERFORMANCE TREND', report.performanceTrend);
  printAnalysis('GUIDANCE ANALYSIS', report.guidanceAnalysis);

  // Key Takeaways
  if (report.keyTakeaways.length > 0) {
    console.log(chalk.magenta('│') + ' ' + chalk.bold.cyan('KEY TAKEAWAYS') + ' '.repeat(innerWidth - 13) + ' ' + chalk.magenta('│'));
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

    for (const takeaway of report.keyTakeaways) {
      const wrapped = wrapText(`- ${takeaway}`, innerWidth - 2);
      for (const line of wrapped) {
        const padding = Math.max(0, innerWidth - line.length);
        console.log(chalk.magenta('│') + ' ' + chalk.white(line) + ' '.repeat(padding) + ' ' + chalk.magenta('│'));
      }
    }
    console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
  }

  printAnalysis('OUTLOOK', report.outlook);

  // Footer
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  console.log(chalk.magenta(bottom));

  // Disclaimer
  console.log('');
  console.log(chalk.dim('  Data from SEC EDGAR & Yahoo Finance. AI analysis for informational purposes only.'));
  console.log('');
}

async function showEarnings(symbol: string): Promise<void> {
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

// ═══════════════════════════════════════════════════════════════════════════
// ETF Profile Display
// ═══════════════════════════════════════════════════════════════════════════

function formatPercentDisplay(num: number | null): string {
  if (num === null || num === undefined) return 'N/A';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function displayETFProfile(etf: ETFProfile): void {
  const width = 60;
  const innerWidth = width - 4;

  console.log('');

  // Header
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  console.log(chalk.cyan(top));

  // ETF name and ticker
  const isUp = etf.changePercent >= 0;
  const arrow = isUp ? '▲' : '▼';
  const priceColor = isUp ? chalk.green : chalk.red;

  const tickerLine = `${chalk.bold.white(etf.symbol)} ${chalk.dim('│')} ${chalk.white(etf.name)}`;
  const tickerStripped = stripAnsi(tickerLine);
  const tickerPadding = Math.max(0, innerWidth - tickerStripped.length);
  console.log(chalk.cyan('│') + ' ' + tickerLine + ' '.repeat(tickerPadding) + ' ' + chalk.cyan('│'));

  // Family and category
  const familyLine = `${chalk.dim(etf.family ?? 'Unknown')} ${chalk.dim('•')} ${chalk.dim(etf.category ?? 'ETF')}`;
  const familyStripped = stripAnsi(familyLine);
  const familyPadding = Math.max(0, innerWidth - familyStripped.length);
  console.log(chalk.cyan('│') + ' ' + familyLine + ' '.repeat(familyPadding) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Price & key metrics section
  const priceLine = `Price      ${chalk.bold.white(formatCurrency(etf.price))}  ${priceColor(`${arrow} ${formatCurrency(etf.change)} (${formatPercent(etf.changePercent)})`)}`;
  const priceStripped = stripAnsi(priceLine);
  const pricePadding = Math.max(0, innerWidth - priceStripped.length);
  console.log(chalk.cyan('│') + ' ' + priceLine + ' '.repeat(pricePadding) + ' ' + chalk.cyan('│'));

  const yieldLine = `Yield      ${etf.yield !== null ? chalk.green(etf.yield.toFixed(2) + '%') : chalk.dim('N/A')}`;
  const yieldStripped = stripAnsi(yieldLine);
  const yieldPadding = Math.max(0, innerWidth - yieldStripped.length);
  console.log(chalk.cyan('│') + ' ' + yieldLine + ' '.repeat(yieldPadding) + ' ' + chalk.cyan('│'));

  const expenseLine = `Expense    ${etf.expenseRatio !== null ? chalk.yellow(etf.expenseRatio.toFixed(2) + '%') : chalk.dim('N/A')}`;
  const expenseStripped = stripAnsi(expenseLine);
  const expensePadding = Math.max(0, innerWidth - expenseStripped.length);
  console.log(chalk.cyan('│') + ' ' + expenseLine + ' '.repeat(expensePadding) + ' ' + chalk.cyan('│'));

  const aumLine = `AUM        ${etf.totalAssets !== null ? formatLargeNumber(etf.totalAssets) : chalk.dim('N/A')}`;
  const aumStripped = stripAnsi(aumLine);
  const aumPadding = Math.max(0, innerWidth - aumStripped.length);
  console.log(chalk.cyan('│') + ' ' + aumLine + ' '.repeat(aumPadding) + ' ' + chalk.cyan('│'));

  if (etf.inceptionDate) {
    const inceptionLine = `Inception  ${etf.inceptionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const inceptionPadding = Math.max(0, innerWidth - inceptionLine.length);
    console.log(chalk.cyan('│') + ' ' + chalk.dim(inceptionLine) + ' '.repeat(inceptionPadding) + ' ' + chalk.cyan('│'));
  }

  // Top Holdings Section
  if (etf.topHoldings.length > 0) {
    console.log(chalk.cyan('├' + '─ Top Holdings ─'.padEnd(width - 2, '─') + '┤'));

    // Header row
    const headerLine = `${chalk.dim('Symbol'.padEnd(6))} ${chalk.dim('Weight'.padStart(6))} ${chalk.dim('Today'.padStart(7))} ${chalk.dim('3M'.padStart(7))} ${chalk.dim('YTD'.padStart(7))}`;
    const headerStripped = stripAnsi(headerLine);
    const headerPadding = Math.max(0, innerWidth - headerStripped.length);
    console.log(chalk.cyan('│') + ' ' + headerLine + ' '.repeat(headerPadding) + ' ' + chalk.cyan('│'));

    for (const holding of etf.topHoldings.slice(0, 10)) {
      const symbol = chalk.bold(holding.symbol.padEnd(6));
      const weight = chalk.yellow(holding.weight.toFixed(1) + '%').padStart(6);

      // Daily change
      const formatPerf = (val: number | undefined, padWidth: number): string => {
        if (val === undefined) return chalk.dim('--'.padStart(padWidth));
        const color = val >= 0 ? chalk.green : chalk.red;
        const sign = val >= 0 ? '+' : '';
        return color(`${sign}${val.toFixed(1)}%`.padStart(padWidth));
      };

      const todayStr = formatPerf(holding.changePercent, 7);
      const threeMonthStr = formatPerf(holding.threeMonthReturn, 7);
      const ytdStr = formatPerf(holding.ytdReturn, 7);

      const line = `${symbol} ${weight} ${todayStr} ${threeMonthStr} ${ytdStr}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }

    if (etf.holdingsCount && etf.holdingsCount > 10) {
      const moreLine = chalk.dim(`... (${etf.holdingsCount.toLocaleString()} total holdings)`);
      const moreStripped = stripAnsi(moreLine);
      const morePadding = Math.max(0, innerWidth - moreStripped.length);
      console.log(chalk.cyan('│') + ' ' + moreLine + ' '.repeat(morePadding) + ' ' + chalk.cyan('│'));
    }
  }

  // Asset Allocation Section
  if (etf.stockPosition !== null || etf.bondPosition !== null || etf.cashPosition !== null) {
    console.log(chalk.cyan('├' + '─ Asset Allocation ─'.padEnd(width - 2, '─') + '┤'));

    const barWidth = 40;

    if (etf.stockPosition !== null && etf.stockPosition > 0) {
      const stockBars = Math.round((etf.stockPosition / 100) * barWidth);
      const stockBar = chalk.blue('█'.repeat(stockBars));
      const stockLine = `${stockBar} ${chalk.white(etf.stockPosition.toFixed(0) + '% Stocks')}`;
      const stockStripped = stripAnsi(stockLine);
      const stockPadding = Math.max(0, innerWidth - stockStripped.length);
      console.log(chalk.cyan('│') + ' ' + stockLine + ' '.repeat(stockPadding) + ' ' + chalk.cyan('│'));
    }

    if (etf.bondPosition !== null && etf.bondPosition > 0) {
      const bondBars = Math.round((etf.bondPosition / 100) * barWidth);
      const bondBar = chalk.green('█'.repeat(bondBars));
      const bondLine = `${bondBar} ${chalk.white(etf.bondPosition.toFixed(0) + '% Bonds')}`;
      const bondStripped = stripAnsi(bondLine);
      const bondPadding = Math.max(0, innerWidth - bondStripped.length);
      console.log(chalk.cyan('│') + ' ' + bondLine + ' '.repeat(bondPadding) + ' ' + chalk.cyan('│'));
    }

    if (etf.cashPosition !== null && etf.cashPosition > 0) {
      const cashBars = Math.round((etf.cashPosition / 100) * barWidth);
      const cashBar = chalk.yellow('█'.repeat(Math.max(1, cashBars)));
      const cashLine = `${cashBar} ${chalk.white(etf.cashPosition.toFixed(0) + '% Cash')}`;
      const cashStripped = stripAnsi(cashLine);
      const cashPadding = Math.max(0, innerWidth - cashStripped.length);
      console.log(chalk.cyan('│') + ' ' + cashLine + ' '.repeat(cashPadding) + ' ' + chalk.cyan('│'));
    }
  }

  // Sector Breakdown Section
  const sectors = Object.entries(etf.sectorWeights).sort((a, b) => b[1] - a[1]);
  if (sectors.length > 0) {
    console.log(chalk.cyan('├' + '─ Sector Breakdown ─'.padEnd(width - 2, '─') + '┤'));

    const maxSectorWeight = Math.max(...sectors.map(([_, w]) => w));

    for (const [sector, weight] of sectors.slice(0, 6)) {
      const barWidth = 25;
      const bars = Math.round((weight / maxSectorWeight) * barWidth);
      const bar = chalk.magenta('█'.repeat(bars));
      const sectorName = sector.padEnd(20);
      const weightStr = chalk.white(weight.toFixed(1) + '%');
      const line = `${chalk.dim(sectorName)} ${weightStr}  ${bar}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }

    if (sectors.length > 6) {
      const otherWeight = sectors.slice(6).reduce((sum, [_, w]) => sum + w, 0);
      const otherLine = chalk.dim(`Other sectors: ${otherWeight.toFixed(1)}%`);
      const otherStripped = stripAnsi(otherLine);
      const otherPadding = Math.max(0, innerWidth - otherStripped.length);
      console.log(chalk.cyan('│') + ' ' + otherLine + ' '.repeat(otherPadding) + ' ' + chalk.cyan('│'));
    }
  }

  // Performance Section
  console.log(chalk.cyan('├' + '─ Performance ─'.padEnd(width - 2, '─') + '┤'));

  const perfItems: [string, number | null][] = [
    ['YTD', etf.ytdReturn],
    ['1 Year', etf.oneYearReturn],
    ['3 Year', etf.threeYearReturn],
    ['5 Year', etf.fiveYearReturn],
  ];

  for (const [label, value] of perfItems) {
    const valueStr = value !== null
      ? (value >= 0 ? chalk.green(formatPercentDisplay(value)) : chalk.red(formatPercentDisplay(value)))
      : chalk.dim('N/A');
    const line = `${chalk.dim(label.padEnd(10))} ${valueStr}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // Price Chart Section (90 days)
  if (etf.historicalPrices.length > 10) {
    console.log(chalk.cyan('├' + '─ Price Chart (90 days) ─'.padEnd(width - 2, '─') + '┤'));

    // Determine if overall trend is up or down
    const firstPrice = etf.historicalPrices[0];
    const lastPrice = etf.historicalPrices[etf.historicalPrices.length - 1];
    const isUpTrend = lastPrice >= firstPrice;
    const chartColor = isUpTrend ? asciichart.green : asciichart.red;

    // Generate the chart
    const chartHeight = 8;
    const chartWidth = innerWidth - 10; // Leave room for Y-axis labels

    // Resample data if needed to fit width
    let chartData = etf.historicalPrices;
    if (chartData.length > chartWidth) {
      const step = chartData.length / chartWidth;
      chartData = [];
      for (let i = 0; i < chartWidth; i++) {
        const idx = Math.floor(i * step);
        chartData.push(etf.historicalPrices[idx]);
      }
    }

    const chart = asciichart.plot(chartData, {
      height: chartHeight,
      colors: [chartColor],
      format: (x: number) => x.toFixed(0).padStart(6),
    });

    // Print each line of the chart inside the box
    const chartLines = chart.split('\n');
    for (const chartLine of chartLines) {
      const linePadding = Math.max(0, innerWidth - chartLine.length);
      console.log(chalk.cyan('│') + ' ' + chartLine + ' '.repeat(linePadding) + ' ' + chalk.cyan('│'));
    }

    // Chart footer with date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const changeVal = ((lastPrice - firstPrice) / firstPrice) * 100;
    const changeStr = changeVal >= 0 ? chalk.green(`+${changeVal.toFixed(1)}%`) : chalk.red(`${changeVal.toFixed(1)}%`);
    const chartFooter = `${chalk.dim(dateRange)}  ${changeStr} over period`;
    const footerStripped = stripAnsi(chartFooter);
    const footerPadding = Math.max(0, innerWidth - footerStripped.length);
    console.log(chalk.cyan('│') + ' ' + chartFooter + ' '.repeat(footerPadding) + ' ' + chalk.cyan('│'));
  }

  // As of date
  const asOfStr = `As of ${etf.asOfDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`;
  const asOfPadding = Math.max(0, innerWidth - asOfStr.length);
  console.log(chalk.cyan('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(asOfPadding) + ' ' + chalk.cyan('│'));

  // Footer
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  console.log(chalk.cyan(bottom));
  console.log('');
}

function displayETFComparison(etfs: ETFProfile[]): void {
  const width = 70;
  const innerWidth = width - 4;

  console.log('');

  // Header
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  console.log(chalk.cyan(top));

  const title = 'ETF COMPARISON';
  const titlePadding = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePadding) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╞' + '═'.repeat(width - 2) + '╡'));

  // Column widths
  const labelWidth = 16;
  const colWidth = Math.floor((innerWidth - labelWidth) / etfs.length);

  // Header row with ETF names
  const headerLabel = ''.padEnd(labelWidth);
  const headerValues = etfs.map(e => chalk.bold(e.symbol.padStart(colWidth))).join('');
  const headerLine = headerLabel + headerValues;
  const headerStripped = stripAnsi(headerLine);
  const headerPadding = Math.max(0, innerWidth - headerStripped.length);
  console.log(chalk.cyan('│') + ' ' + headerLine + ' '.repeat(headerPadding) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Comparison rows
  const rows: { label: string; values: (string | number | null)[] }[] = [
    { label: 'Price', values: etfs.map(e => formatCurrency(e.price)) },
    { label: 'Expense Ratio', values: etfs.map(e => e.expenseRatio !== null ? e.expenseRatio.toFixed(2) + '%' : 'N/A') },
    { label: 'AUM', values: etfs.map(e => e.totalAssets !== null ? formatLargeNumber(e.totalAssets) : 'N/A') },
    { label: 'Yield', values: etfs.map(e => e.yield !== null ? e.yield.toFixed(2) + '%' : 'N/A') },
    { label: 'YTD Return', values: etfs.map(e => e.ytdReturn) },
    { label: '1 Year Return', values: etfs.map(e => e.oneYearReturn) },
    { label: '3 Year Return', values: etfs.map(e => e.threeYearReturn) },
    { label: '5 Year Return', values: etfs.map(e => e.fiveYearReturn) },
    { label: 'Beta', values: etfs.map(e => e.beta !== null ? e.beta.toFixed(2) : 'N/A') },
  ];

  for (const row of rows) {
    const label = chalk.dim(row.label.padEnd(labelWidth));
    const values = row.values.map(v => {
      if (v === null) return chalk.dim('N/A'.padStart(colWidth));
      if (typeof v === 'number') {
        const str = formatPercentDisplay(v);
        return v >= 0 ? chalk.green(str.padStart(colWidth)) : chalk.red(str.padStart(colWidth));
      }
      return String(v).padStart(colWidth);
    }).join('');
    const line = label + values;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Top holdings comparison
  console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow('Top 3 Holdings') + ' '.repeat(innerWidth - 14) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  for (let i = 0; i < 3; i++) {
    const label = chalk.dim(`#${i + 1}`.padEnd(labelWidth));
    const values = etfs.map(e => {
      const holding = e.topHoldings[i];
      if (!holding) return ''.padStart(colWidth);
      return `${holding.symbol} ${holding.weight.toFixed(1)}%`.padStart(colWidth);
    }).join('');
    const line = label + values;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // As of date (use the most recent timestamp from the ETFs)
  const mostRecentDate = etfs.reduce((latest, e) =>
    e.asOfDate > latest ? e.asOfDate : latest, etfs[0].asOfDate);
  const asOfStr = `As of ${mostRecentDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`;
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const asOfPadding = Math.max(0, innerWidth - asOfStr.length);
  console.log(chalk.cyan('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(asOfPadding) + ' ' + chalk.cyan('│'));

  // Footer
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  console.log(chalk.cyan(bottom));
  console.log('');
}

async function showETF(symbol: string): Promise<void> {
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

async function showETFComparison(symbols: string[]): Promise<void> {
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

async function showStockComparison(symbols: string[]): Promise<void> {
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

async function showMarket(): Promise<void> {
  const overview = await getMarketOverview();
  displayMarketOverview(overview);
}

async function showCalendar(): Promise<void> {
  const watchlist = getWatchlist();
  const symbols = watchlist.map(w => w.symbol);
  if (symbols.length === 0) {
    console.log('');
    console.log(chalk.yellow('  Add stocks to your watchlist to see upcoming events'));
    console.log(chalk.dim('    Use: add AAPL MSFT GOOGL'));
    console.log('');
    return;
  }
  const calendar = await getEventsCalendar(symbols);
  displayEventsCalendar(calendar);
}

async function showNews(symbols?: string[]): Promise<void> {
  const articles = await getNewsFeed(symbols);
  displayNewsFeed(articles, symbols);
}

async function showBrief(): Promise<void> {
  const brief = await getMarketBrief();
  displayMarketBrief(brief);
}

// ═══════════════════════════════════════════════════════════════════════════
// Screens
// ═══════════════════════════════════════════════════════════════════════════

function showHomeScreen(): void {
  console.clear();
  const width = getTerminalWidth();

  // Logo with gradient effect
  const logoLines = LOGO.trim().split('\n');
  const gradient = [chalk.cyan, chalk.cyanBright, chalk.white, chalk.cyanBright, chalk.cyan, chalk.dim];

  console.log('');
  logoLines.forEach((line, i) => {
    const colorFn = gradient[i % gradient.length];
    console.log(centerText(colorFn(line), width));
  });

  console.log('');
  console.log(centerText(chalk.dim(TAGLINE), width));
  console.log(centerText(chalk.dim.italic(VERSION), width));
  console.log('');

  drawDivider('═');
  console.log('');

  // Quick actions box
  const commands = [
    `${chalk.yellow('w')} ${chalk.dim('/')} ${chalk.yellow('watchlist')}    ${chalk.dim('->')} View live stock quotes`,
    `${chalk.yellow('p')} ${chalk.dim('/')} ${chalk.yellow('portfolio')}    ${chalk.dim('->')} View portfolio summary`,
    `${chalk.yellow('s AAPL')}            ${chalk.dim('->')} Company profile & metrics`,
    `${chalk.yellow('r AAPL')}            ${chalk.dim('->')} AI research primer report`,
    `${chalk.yellow('e AAPL')}            ${chalk.dim('->')} Earnings + SEC filings`,
    `${chalk.yellow('etf VTI')}           ${chalk.dim('->')} ETF holdings & performance`,
    `${chalk.yellow('compare VTI SPY')}   ${chalk.dim('->')} Compare ETFs side-by-side`,
    `${chalk.yellow('?')} ${chalk.dim('/')} ${chalk.yellow('help')}         ${chalk.dim('->')} Show all commands`,
  ];

  drawBox('Quick Commands', commands, 58);

  console.log('');
  console.log(chalk.dim('  Tip: Try "e NVDA" for earnings history + SEC filings analysis'));
  console.log('');
  drawDivider('─');
  console.log('');
}

function showHelp(): void {
  console.log('');

  const commands = [
    `${chalk.yellow('w')}, ${chalk.yellow('watchlist')}       ${chalk.dim('-')} Show watchlist with live quotes`,
    `${chalk.yellow('p')}, ${chalk.yellow('portfolio')}       ${chalk.dim('-')} Show portfolio summary`,
    `${chalk.yellow('s <SYM>')}            ${chalk.dim('-')} Company profile (e.g., s AAPL)`,
    `${chalk.yellow('r <SYM>')}            ${chalk.dim('-')} AI research primer (e.g., r NVDA)`,
    `${chalk.yellow('e <SYM>')}            ${chalk.dim('-')} Earnings & SEC filings (e.g., e MSFT)`,
    `${chalk.yellow('etf <SYM>')}          ${chalk.dim('-')} ETF profile & holdings (e.g., etf VTI)`,
    `${chalk.yellow('compare <S1> <S2>')}  ${chalk.dim('-')} Compare ETFs (e.g., compare SPY VOO)`,
    `${chalk.yellow('cs <S1> <S2>...')}    ${chalk.dim('-')} Compare stocks (e.g., cs AAPL MSFT GOOGL)`,
    `${chalk.yellow('b')}, ${chalk.yellow('brief')}           ${chalk.dim('-')} AI market brief (full analysis)`,
    `${chalk.yellow('m')}, ${chalk.yellow('market')}          ${chalk.dim('-')} Market overview (indices, sectors, movers)`,
    `${chalk.yellow('cal')}, ${chalk.yellow('events')}        ${chalk.dim('-')} Upcoming earnings & dividends`,
    `${chalk.yellow('news')} ${chalk.dim('[SYM]')}         ${chalk.dim('-')} Market news or stock-specific news`,
    `${chalk.yellow('read <N>')}           ${chalk.dim('-')} Read news article N`,
    `${chalk.yellow('filings <SYM>')}      ${chalk.dim('-')} SEC filings (10-K, 10-Q, 8-K)`,
    `${chalk.yellow('filing <N>')}         ${chalk.dim('-')} Read SEC filing N`,
    `${chalk.yellow('clear')}, ${chalk.yellow('home')}        ${chalk.dim('-')} Clear screen and show home`,
    `${chalk.yellow('?')}, ${chalk.yellow('help')}            ${chalk.dim('-')} Show this help`,
    `${chalk.yellow('q')}, ${chalk.yellow('quit')}            ${chalk.dim('-')} Exit DevFolio`,
  ];

  drawBox('Commands', commands, 62);

  console.log('');
  console.log(chalk.bold.cyan('  ETF Lookup'));
  console.log(chalk.dim('  The "etf" command shows comprehensive ETF data:'));
  console.log(chalk.dim('    - Top holdings with allocation percentages'));
  console.log(chalk.dim('    - Asset allocation (stocks/bonds/cash)'));
  console.log(chalk.dim('    - Sector breakdown with visual bars'));
  console.log(chalk.dim('    - Performance: YTD, 1Y, 3Y, 5Y returns'));
  console.log(chalk.dim('    - Expense ratio, yield, AUM, inception date'));
  console.log('');
  console.log(chalk.bold.cyan('  ETF Comparison'));
  console.log(chalk.dim('  Use "compare" to see ETFs side-by-side:'));
  console.log(chalk.dim('    - Expense ratios, yields, performance'));
  console.log(chalk.dim('    - Top holdings overlap'));
  console.log(chalk.dim('    - Risk metrics comparison'));
  console.log('');
  console.log(chalk.bold.cyan('  Research Reports'));
  console.log(chalk.dim('  The "r" command generates an AI-powered research primer with:'));
  console.log(chalk.dim('    - Executive summary & business overview'));
  console.log(chalk.dim('    - Key segments & competitive position'));
  console.log(chalk.dim('    - Financial highlights & valuation'));
  console.log(chalk.dim('    - Catalysts, risks, bull/bear cases'));
  console.log('');
  console.log(chalk.bold.cyan('  Earnings Reports'));
  console.log(chalk.dim('  The "e" command pulls SEC EDGAR + Yahoo Finance data:'));
  console.log(chalk.dim('    - Quarterly results: Rev, Op Income, OPM, EPS vs consensus'));
  console.log(chalk.dim('    - Key performance indicators with beat/miss analysis'));
  console.log(chalk.dim('    - FY guidance with raised/lowered/maintained status'));
  console.log(chalk.dim('    - Recent 10-K, 10-Q, 8-K SEC filings'));
  console.log(chalk.dim('    - AI-generated earnings analysis & outlook'));
  console.log('');
  console.log(chalk.bold.cyan('  SEC Filings'));
  console.log(chalk.dim('  The "filings" command shows recent SEC filings:'));
  console.log(chalk.dim('    - 10-K: Annual reports with business overview & financials'));
  console.log(chalk.dim('    - 10-Q: Quarterly reports with interim financials'));
  console.log(chalk.dim('    - 8-K: Material events (earnings, acquisitions, changes)'));
  console.log(chalk.dim('  Use "filing N" to read key sections from any filing.'));
  console.log('');
  console.log(chalk.bold.cyan('  Natural Language'));
  console.log(chalk.dim('  You can also ask naturally:'));
  console.log(chalk.dim('    - "tell me about Apple"'));
  console.log(chalk.dim('    - "what does VTI hold?"'));
  console.log(chalk.dim('    - "compare SPY and VOO"'));
  console.log(chalk.dim('    - "add TSLA to watchlist"'));
  console.log('');
}

async function showWatchlist(): Promise<void> {
  const symbols = getWatchlist();

  if (symbols.length === 0) {
    console.log('');
    console.log(chalk.dim('  Watchlist is empty. Try "add AAPL to watchlist"'));
    console.log('');
    return;
  }

  const quotes = await getQuotes(symbols);

  if (quotes.length === 0) {
    console.log(chalk.red('  Error: Could not fetch quotes'));
    return;
  }

  console.log('');

  const lines: string[] = [];
  lines.push(chalk.dim('Symbol     Price          Change'));
  lines.push(chalk.dim('─'.repeat(46)));

  for (const q of quotes) {
    const symbol = chalk.bold.white(q.symbol.padEnd(10));
    const price = chalk.white(formatCurrency(q.price).padEnd(14));
    const isUp = q.changePercent >= 0;
    const arrow = isUp ? '▲' : '▼';
    const changeColor = isUp ? chalk.green : chalk.red;
    const change = changeColor(`${arrow} ${formatPercent(q.changePercent).padEnd(8)}`);
    lines.push(`${symbol} ${price} ${change}`);
  }

  drawBox('Watchlist', lines, 58);
  console.log('');
}

async function showPortfolio(): Promise<void> {
  const portfolio = await getPortfolio();

  if (portfolio.holdings.length === 0) {
    console.log('');
    console.log(chalk.dim('  Portfolio is empty. Try "buy 10 shares of AAPL at 150"'));
    console.log('');
    return;
  }

  console.log('');

  const isUp = portfolio.totalGain >= 0;
  const arrow = isUp ? '▲' : '▼';
  const gainColor = isUp ? chalk.green : chalk.red;

  const lines: string[] = [];
  lines.push(`${chalk.dim('Total Value:')} ${chalk.bold.white(formatCurrency(portfolio.totalValue))}`);
  lines.push(`${chalk.dim('Total Gain:')}  ${gainColor(`${arrow} ${formatCurrency(portfolio.totalGain)} (${formatPercent(portfolio.totalGainPercent)})`)}`);
  lines.push('');
  lines.push(chalk.dim('Holdings:'));

  for (const h of portfolio.holdings) {
    const gain = h.gain ?? 0;
    const price = h.currentPrice ?? 0;
    const gainPct = h.gainPercent ?? 0;
    const hUp = gain >= 0;
    const hArrow = hUp ? '▲' : '▼';
    const hColor = hUp ? chalk.green : chalk.red;
    lines.push(`  ${chalk.bold(h.symbol.padEnd(6))} ${String(h.shares).padEnd(4)} @ ${formatCurrency(price).padEnd(10)} ${hColor(`${hArrow} ${formatPercent(gainPct)}`)}`);
  }

  drawBox('Portfolio', lines, 58);
  console.log('');
}

async function showStock(symbol: string): Promise<void> {
  const profile = await getCompanyProfile(symbol.toUpperCase());

  if (!profile) {
    console.log('');
    console.log(chalk.red(`  Error: Could not find company: ${symbol.toUpperCase()}`));
    console.log(chalk.dim(`    Try a valid ticker symbol like AAPL, MSFT, or NVDA`));
    console.log('');
    return;
  }

  displayCompanyProfile(profile);
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
// Command Parser
// ═══════════════════════════════════════════════════════════════════════════

function parseStockCommand(input: string): string | null {
  // Match: "s AAPL", "stock AAPL"
  const stockMatch = input.match(/^(?:s|stock)\s+([A-Za-z]{1,5})$/i);
  if (stockMatch) return stockMatch[1].toUpperCase();

  return null;
}

function parseReportCommand(input: string): string | null {
  // Match: "r AAPL", "report AAPL", "primer AAPL", "research AAPL"
  const reportMatch = input.match(/^(?:r|report|primer|research)\s+([A-Za-z]{1,5})$/i);
  if (reportMatch) return reportMatch[1].toUpperCase();

  return null;
}

function parseEarningsCommand(input: string): string | null {
  // Match: "e AAPL", "earnings AAPL", "sec AAPL", "filings AAPL"
  const earningsMatch = input.match(/^(?:e|earnings|sec|filings)\s+([A-Za-z]{1,5})$/i);
  if (earningsMatch) return earningsMatch[1].toUpperCase();

  return null;
}

function parseETFCommand(input: string): string | null {
  // Match: "etf VTI", "fund VTI"
  const etfMatch = input.match(/^(?:etf|fund)\s+([A-Za-z]{1,5})$/i);
  if (etfMatch) return etfMatch[1].toUpperCase();

  return null;
}

function parseCompareCommand(input: string): string[] | null {
  // Match: "compare VTI SPY", "compare VTI SPY QQQ", "cmp VTI SPY"
  const compareMatch = input.match(/^(?:compare|cmp|vs)\s+([A-Za-z]{1,5})\s+([A-Za-z]{1,5})(?:\s+([A-Za-z]{1,5}))?$/i);
  if (compareMatch) {
    const symbols = [compareMatch[1].toUpperCase(), compareMatch[2].toUpperCase()];
    if (compareMatch[3]) symbols.push(compareMatch[3].toUpperCase());
    return symbols;
  }

  return null;
}

function parseStockCompareCommand(input: string): string[] | null {
  // Match: "cs AAPL MSFT", "cs AAPL MSFT GOOGL NVDA" (2-4 symbols)
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
        } else if (cmd === 'watchlist' || cmd === 'w') {
          const stop = showSpinner('Fetching quotes...');
          await showWatchlist();
          stop();
        } else if (cmd === 'portfolio' || cmd === 'p') {
          const stop = showSpinner('Loading portfolio...');
          await showPortfolio();
          stop();
        } else if (cmd === 'brief' || cmd === 'b') {
          const stop = showSpinner('Generating market brief...');
          await showBrief();
          stop();
        } else if (cmd === 'market' || cmd === 'm') {
          const stop = showSpinner('Fetching market data...');
          await showMarket();
          stop();
        } else if (cmd === 'cal' || cmd === 'calendar' || cmd === 'events') {
          const stop = showSpinner('Fetching upcoming events...');
          await showCalendar();
          stop();
        } else if (cmd === 'news' || cmd.startsWith('news ')) {
          // Parse optional symbol(s)
          const newsMatch = trimmed.match(/^news\s+(.+)$/i);
          const newsSymbols = newsMatch
            ? newsMatch[1].split(/[\s,]+/).map(s => s.toUpperCase())
            : undefined;
          const stop = showSpinner('Fetching news...');
          await showNews(newsSymbols);
          stop();
        } else if (cmd.startsWith('read ')) {
          // Read article content
          const readMatch = trimmed.match(/^read\s+(\d+)$/i);
          if (readMatch) {
            const articleNum = parseInt(readMatch[1], 10);
            if (lastNewsArticles.length === 0) {
              console.log('');
              console.log(chalk.yellow('  No articles loaded. Run "news" first to see articles.'));
              console.log('');
            } else if (articleNum >= 1 && articleNum <= lastNewsArticles.length) {
              const newsArticle = lastNewsArticles[articleNum - 1];
              const stop = showSpinner(`Fetching article...`);
              const content = await fetchArticleContent(newsArticle.link);
              stop();

              if (content) {
                displayArticle(content, newsArticle.publisher);
              } else {
                console.log('');
                console.log(chalk.yellow('  Could not fetch article content.'));
                console.log(chalk.dim(`  Some sites block content extraction.`));
                console.log(chalk.dim(`  Link: ${newsArticle.link}`));
                console.log('');
              }
            } else {
              console.log('');
              console.log(chalk.red(`  Invalid article number. Use 1-${lastNewsArticles.length}`));
              console.log('');
            }
          } else {
            console.log('');
            console.log(chalk.red('  Usage: read <number> (e.g., read 1)'));
            console.log('');
          }
        } else if (cmd.startsWith('filings ') || cmd.startsWith('sec ')) {
          // List SEC filings for a symbol
          const filingsMatch = trimmed.match(/^(?:filings|sec)\s+([A-Za-z]{1,5})$/i);
          if (filingsMatch) {
            const symbol = filingsMatch[1].toUpperCase();
            const stop = showSpinner(`Fetching SEC filings for ${symbol}...`);
            const filings = await getRecentFilings(symbol, ['10-K', '10-Q', '8-K'], 15);
            stop();

            if (filings.length === 0) {
              console.log('');
              console.log(chalk.yellow(`  No SEC filings found for ${symbol}`));
              console.log(chalk.dim('  This symbol may not be a US-listed company.'));
              console.log('');
            } else {
              displayFilings(filings, symbol);
            }
          } else {
            console.log('');
            console.log(chalk.red('  Usage: filings <symbol> (e.g., filings AAPL)'));
            console.log('');
          }
        } else if (cmd.startsWith('filing ')) {
          // Read a specific filing
          const filingMatch = trimmed.match(/^filing\s+(\d+)$/i);
          if (filingMatch) {
            const filingNum = parseInt(filingMatch[1], 10);
            if (lastFilings.length === 0) {
              console.log('');
              console.log(chalk.yellow('  No filings loaded. Run "filings <symbol>" first.'));
              console.log('');
            } else if (filingNum >= 1 && filingNum <= lastFilings.length) {
              const filing = lastFilings[filingNum - 1];
              const stop = showSpinner(`Fetching ${filing.form} filing...`);
              await displayFiling(filing, lastFilingsSymbol);
              stop();
            } else {
              console.log('');
              console.log(chalk.red(`  Invalid filing number. Use 1-${lastFilings.length}`));
              console.log('');
            }
          } else {
            console.log('');
            console.log(chalk.red('  Usage: filing <number> (e.g., filing 1)'));
            console.log('');
          }
        } else {
          // Check if it's a report command
          const reportTicker = parseReportCommand(trimmed);
          if (reportTicker) {
            const stop = showSpinner(`Generating ${reportTicker} research report...`);
            await showReport(reportTicker);
            stop();
          }
          // Check if it's an earnings command
          else {
            const earningsTicker = parseEarningsCommand(trimmed);
            if (earningsTicker) {
              const stop = showSpinner(`Generating ${earningsTicker} earnings report (SEC + Yahoo)...`);
              await showEarnings(earningsTicker);
              stop();
            }
            // Check if it's an ETF command
            else {
              const etfTicker = parseETFCommand(trimmed);
              if (etfTicker) {
                const stop = showSpinner(`Fetching ${etfTicker} ETF profile...`);
                await showETF(etfTicker);
                stop();
              }
              // Check if it's an ETF compare command
              else {
                const compareSymbols = parseCompareCommand(trimmed);
                if (compareSymbols) {
                  const stop = showSpinner(`Comparing ETFs ${compareSymbols.join(', ')}...`);
                  await showETFComparison(compareSymbols);
                  stop();
                }
                // Check if it's a stock compare command
                else {
                  const stockCompareSymbols = parseStockCompareCommand(trimmed);
                  if (stockCompareSymbols) {
                    const stop = showSpinner(`Comparing stocks ${stockCompareSymbols.join(', ')}...`);
                    await showStockComparison(stockCompareSymbols);
                    stop();
                  // Check if it's a stock command
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

                      // Handle tool results - show stock profile if requested
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
