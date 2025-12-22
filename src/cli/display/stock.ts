/**
 * Stock Display Functions
 * Company profiles and stock comparisons
 */

import chalk from 'chalk';
import asciichart from 'asciichart';
import type { CompanyProfile } from '../../services/market.js';
import type { QuickTake } from '../../services/quicktake.js';
import type { RelatedStock } from '../../services/screener.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';
import {
  stripAnsi,
  wrapText,
  truncateText,
  formatLargeNumber,
  formatRatio,
  formatPercentValue,
  drawSection,
} from '../ui.js';
import { showHint } from '../hints.js';

// ═══════════════════════════════════════════════════════════════════════════
// Company Profile Display
// ═══════════════════════════════════════════════════════════════════════════

// Map timeframe to readable label
const TIMEFRAME_LABELS: Record<string, string> = {
  '1d': '1 day',
  '5d': '5 days',
  '1m': '1 month',
  '3m': '3 months',
  '6m': '6 months',
  '1y': '1 year',
  '5y': '5 years',
  '10y': '10 years',
  'max': 'all time',
  'all': 'all time',
};

export function displayCompanyProfile(
  profile: CompanyProfile,
  quickTake?: QuickTake | null,
  relatedStocks?: RelatedStock[],
  timeframe?: string
): void {
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
  const evFcf = profile.enterpriseValue && profile.freeCashFlow && profile.freeCashFlow > 0
    ? profile.enterpriseValue / profile.freeCashFlow
    : null;
  drawSection('Valuation', [
    ['P/E Ratio', formatRatio(profile.peRatio)],
    ['Forward P/E', formatRatio(profile.forwardPE)],
    ['PEG Ratio', formatRatio(profile.pegRatio)],
    ['P/S Ratio', formatRatio(profile.priceToSales)],
    ['P/B Ratio', formatRatio(profile.priceToBook)],
    ['EV/Revenue', formatRatio(profile.evToRevenue)],
    ['EV/EBITDA', formatRatio(profile.evToEbitda)],
    ['EV/FCF', formatRatio(evFcf)],
  ], width);

  // Financials Section
  drawSection('Financials', [
    ['Revenue (TTM)', formatLargeNumber(profile.revenue)],
    ['Revenue Growth', formatPercentValue(profile.revenueGrowth)],
    ['Gross Margin', formatPercentValue(profile.grossMargin)],
    ['Operating Margin', formatPercentValue(profile.operatingMargin)],
    ['Profit Margin', formatPercentValue(profile.profitMargin)],
    ['EBITDA', formatLargeNumber(profile.ebitda)],
    ['Operating CF', formatLargeNumber(profile.operatingCashFlow)],
    ['CapEx', formatLargeNumber(profile.capitalExpenditures)],
    ['Free Cash Flow', formatLargeNumber(profile.freeCashFlow)],
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

  // AI Quick Take Section
  if (quickTake) {
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
    const sentimentIndicator = quickTake.sentiment === 'bullish' ? '▲' : quickTake.sentiment === 'bearish' ? '▼' : '-';
    const sentimentColor = quickTake.sentiment === 'bullish' ? chalk.green : quickTake.sentiment === 'bearish' ? chalk.red : chalk.yellow;
    const headerLine = `${sentimentIndicator} AI Quick Take`;
    console.log(chalk.dim('│') + ' ' + chalk.bold.magenta(headerLine.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));

    // Summary line
    const summaryLines = wrapText(quickTake.summary, innerWidth);
    for (const line of summaryLines) {
      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.dim('│') + ' ' + sentimentColor(line) + ' '.repeat(padding) + ' ' + chalk.dim('│'));
    }

    // Key point
    const keyPointLine = `Key: ${quickTake.keyPoint}`;
    const kpLines = wrapText(keyPointLine, innerWidth);
    for (const line of kpLines) {
      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.dim('│') + ' ' + chalk.dim(line) + ' '.repeat(padding) + ' ' + chalk.dim('│'));
    }
  }

  // Price Chart Section
  if (profile.historicalPrices && profile.historicalPrices.length > 10) {
    const chartLabel = `Price Chart (${TIMEFRAME_LABELS[timeframe ?? '3m'] ?? '90 days'})`;
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
    console.log(chalk.dim('│') + ' ' + chalk.bold.yellow(chartLabel.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
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

  // Related Stocks Section
  if (relatedStocks && relatedStocks.length > 0) {
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
    console.log(chalk.dim('│') + ' ' + chalk.bold.cyan('Related Stocks'.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
    console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));

    for (const stock of relatedStocks.slice(0, 4)) {
      const changeColor = stock.changePercent >= 0 ? chalk.green : chalk.red;
      const arrow = stock.changePercent >= 0 ? '▲' : '▼';

      const symbol = chalk.white(stock.symbol.padEnd(6));
      const name = chalk.dim(stock.name.substring(0, 18).padEnd(18));
      const price = chalk.white(`$${stock.price.toFixed(2)}`.padStart(9));
      const change = changeColor(`${arrow}${Math.abs(stock.changePercent).toFixed(1)}%`.padStart(7));
      const mcap = formatLargeNumber(stock.marketCap || 0).padStart(7);

      const line = `${symbol} ${name} ${price} ${change} ${chalk.dim(mcap)}`;
      const lineStripped = stripAnsi(line);
      const linePadding = Math.max(0, innerWidth - lineStripped.length);
      console.log(chalk.dim('│') + ' ' + line + ' '.repeat(linePadding) + ' ' + chalk.dim('│'));
    }
  }

  // As of date footer
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
  const asOfStr = `As of ${profile.asOfDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  const asOfPadding = Math.max(0, innerWidth - asOfStr.length);
  console.log(chalk.dim('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(asOfPadding) + ' ' + chalk.dim('│'));

  // Footer
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  console.log(chalk.dim(bottom));
  showHint('stock', profile.symbol);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Stock Comparison Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayStockComparison(profiles: CompanyProfile[]): void {
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
    // Pad based on visible length (accounting for ANSI codes)
    const valStrs = values.map(v => {
      const visibleLen = stripAnsi(v).length;
      const padding = Math.max(0, colWidth - visibleLen);
      return ' '.repeat(padding) + v;
    });
    return labelStr + valStrs.join('');
  };

  // Format helpers
  const fmtPrice = (v: number) => '$' + v.toFixed(2);
  const fmtPct = (v: number | null) => v === null ? '--' : (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  const fmtRatioVal = (v: number | null) => v === null ? '--' : v.toFixed(1);
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

  const peRow = formatRow('P/E Ratio', profiles.map(p => fmtRatioVal(p.peRatio)), profiles.map(p => p.peRatio), false);
  console.log(chalk.cyan('│') + ' ' + peRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(peRow).length)) + ' ' + chalk.cyan('│'));

  const fwdPeRow = formatRow('Forward P/E', profiles.map(p => fmtRatioVal(p.forwardPE)), profiles.map(p => p.forwardPE), false);
  console.log(chalk.cyan('│') + ' ' + fwdPeRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(fwdPeRow).length)) + ' ' + chalk.cyan('│'));

  const pegRow = formatRow('PEG Ratio', profiles.map(p => fmtRatioVal(p.pegRatio)), profiles.map(p => p.pegRatio), false);
  console.log(chalk.cyan('│') + ' ' + pegRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(pegRow).length)) + ' ' + chalk.cyan('│'));

  const psRow = formatRow('P/S Ratio', profiles.map(p => fmtRatioVal(p.priceToSales)), profiles.map(p => p.priceToSales), false);
  console.log(chalk.cyan('│') + ' ' + psRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(psRow).length)) + ' ' + chalk.cyan('│'));

  const pbRow = formatRow('P/B Ratio', profiles.map(p => fmtRatioVal(p.priceToBook)), profiles.map(p => p.priceToBook), false);
  console.log(chalk.cyan('│') + ' ' + pbRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(pbRow).length)) + ' ' + chalk.cyan('│'));

  const evRevRow = formatRow('EV/Revenue', profiles.map(p => fmtRatioVal(p.evToRevenue)), profiles.map(p => p.evToRevenue), false);
  console.log(chalk.cyan('│') + ' ' + evRevRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(evRevRow).length)) + ' ' + chalk.cyan('│'));

  const evEbitdaRow = formatRow('EV/EBITDA', profiles.map(p => fmtRatioVal(p.evToEbitda)), profiles.map(p => p.evToEbitda), false);
  console.log(chalk.cyan('│') + ' ' + evEbitdaRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(evEbitdaRow).length)) + ' ' + chalk.cyan('│'));

  // Calculate EV/FCF for each profile
  const evFcfValues = profiles.map(p => {
    if (p.enterpriseValue && p.freeCashFlow && p.freeCashFlow > 0) {
      return p.enterpriseValue / p.freeCashFlow;
    }
    return null;
  });
  const evFcfRow = formatRow('EV/FCF', evFcfValues.map(v => fmtRatioVal(v)), evFcfValues, false);
  console.log(chalk.cyan('│') + ' ' + evFcfRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(evFcfRow).length)) + ' ' + chalk.cyan('│'));

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

  const deRow = formatRow('Debt/Equity', profiles.map(p => fmtRatioVal(p.debtToEquity)), profiles.map(p => p.debtToEquity), false);
  console.log(chalk.cyan('│') + ' ' + deRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(deRow).length)) + ' ' + chalk.cyan('│'));

  const crRow = formatRow('Current Ratio', profiles.map(p => fmtRatioVal(p.currentRatio)), profiles.map(p => p.currentRatio), true);
  console.log(chalk.cyan('│') + ' ' + crRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(crRow).length)) + ' ' + chalk.cyan('│'));

  const cashRow = simpleRow('Cash', profiles.map(p => fmtLarge(p.totalCash)));
  console.log(chalk.cyan('│') + ' ' + cashRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(cashRow).length)) + ' ' + chalk.cyan('│'));

  const debtRow = simpleRow('Debt', profiles.map(p => fmtLarge(p.totalDebt)));
  console.log(chalk.cyan('│') + ' ' + debtRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(debtRow).length)) + ' ' + chalk.cyan('│'));

  const ocfRow = formatRow('Operating CF', profiles.map(p => fmtLarge(p.operatingCashFlow)), profiles.map(p => p.operatingCashFlow), true);
  console.log(chalk.cyan('│') + ' ' + ocfRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(ocfRow).length)) + ' ' + chalk.cyan('│'));

  // For CapEx, lower is generally better (less capital intensive)
  const capexRow = formatRow('CapEx', profiles.map(p => fmtLarge(p.capitalExpenditures)), profiles.map(p => p.capitalExpenditures), false);
  console.log(chalk.cyan('│') + ' ' + capexRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(capexRow).length)) + ' ' + chalk.cyan('│'));

  const fcfRow = formatRow('Free Cash Flow', profiles.map(p => fmtLarge(p.freeCashFlow)), profiles.map(p => p.freeCashFlow), true);
  console.log(chalk.cyan('│') + ' ' + fcfRow + ' '.repeat(Math.max(0, innerWidth - stripAnsi(fcfRow).length)) + ' ' + chalk.cyan('│'));

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
