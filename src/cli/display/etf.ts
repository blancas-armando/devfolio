/**
 * ETF Display Functions
 * ETF profiles and comparisons
 */

import chalk from 'chalk';
import asciichart from 'asciichart';
import type { ETFProfile } from '../../types/index.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';
import { stripAnsi, formatLargeNumber } from '../ui.js';
import { showHint } from '../hints.js';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function formatPercentDisplay(num: number | null): string {
  if (num === null || num === undefined) return 'N/A';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ETF Profile Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayETFProfile(etf: ETFProfile): void {
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
      const sectorBarWidth = 25;
      const bars = Math.round((weight / maxSectorWeight) * sectorBarWidth);
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
  showHint('etf', etf.symbol);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// ETF Comparison Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayETFComparison(etfs: ETFProfile[]): void {
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
