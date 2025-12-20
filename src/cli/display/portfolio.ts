/**
 * Portfolio Display Functions
 * Watchlist and portfolio views
 */

import chalk from 'chalk';
import { formatCurrency, formatPercent } from '../../utils/format.js';
import { drawBox, stripAnsi } from '../ui.js';
import { getWatchlist } from '../../db/watchlist.js';
import { getPortfolio } from '../../db/portfolio.js';
import { getQuotes, getEventsCalendar } from '../../services/market.js';

// ═══════════════════════════════════════════════════════════════════════════
// Watchlist Display
// ═══════════════════════════════════════════════════════════════════════════

export async function showWatchlist(): Promise<void> {
  const symbols = getWatchlist();

  if (symbols.length === 0) {
    console.log('');
    console.log(chalk.dim('  Watchlist is empty. Try "add AAPL" to add stocks.'));
    console.log('');
    return;
  }

  // Fetch quotes and events in parallel
  const [quotes, calendar] = await Promise.all([
    getQuotes(symbols),
    getEventsCalendar(symbols),
  ]);

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

  // Add upcoming events summary if any
  const upcomingEarnings = calendar.earnings.slice(0, 3);
  const upcomingDividends = calendar.dividends.slice(0, 2);

  if (upcomingEarnings.length > 0 || upcomingDividends.length > 0) {
    lines.push('');
    lines.push(chalk.dim('─'.repeat(46)));
    lines.push(chalk.bold.yellow('Upcoming Events'));

    for (const e of upcomingEarnings) {
      const dateStr = e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      lines.push(`  ${chalk.cyan('E')} ${chalk.white(e.symbol.padEnd(6))} ${chalk.dim('Earnings')} ${chalk.yellow(dateStr)}`);
    }
    for (const d of upcomingDividends) {
      const dateStr = d.exDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      lines.push(`  ${chalk.green('D')} ${chalk.white(d.symbol.padEnd(6))} ${chalk.dim('Ex-Div')}   ${chalk.yellow(dateStr)}`);
    }
  }

  drawBox('Watchlist', lines, 58);
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Portfolio Display
// ═══════════════════════════════════════════════════════════════════════════

export async function showPortfolio(): Promise<void> {
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
