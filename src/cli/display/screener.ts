/**
 * Stock Screener Display
 * Shows filtered stock results
 */

import chalk from 'chalk';
import type { ScreenerResponse, ScreenerPreset } from '../../services/screener.js';
import { stripAnsi } from '../ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Screener Results Display
// ═══════════════════════════════════════════════════════════════════════════

function formatMarketCap(cap: number | null): string {
  if (cap === null) return '-';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(vol: number | null): string {
  if (vol === null) return '-';
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
  return vol.toLocaleString();
}

export function displayScreenerResults(response: ScreenerResponse): void {
  const width = 78;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title and description
  const titleLine = chalk.bold.white(response.title);
  const titleStripped = stripAnsi(titleLine);
  const countStr = chalk.dim(`(${response.total} results)`);
  const countStripped = stripAnsi(countStr);
  const titlePad = Math.max(0, innerWidth - titleStripped.length - countStripped.length);
  console.log(chalk.cyan('│') + ' ' + titleLine + ' '.repeat(titlePad) + countStr + ' ' + chalk.cyan('│'));

  const desc = chalk.dim(response.description);
  const descStripped = stripAnsi(desc);
  const descPad = Math.max(0, innerWidth - descStripped.length);
  console.log(chalk.cyan('│') + ' ' + desc + ' '.repeat(descPad) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Header row
  const header = `${chalk.dim('SYMBOL'.padEnd(8))} ${chalk.dim('NAME'.padEnd(24))} ${chalk.dim('PRICE'.padStart(10))} ${chalk.dim('CHG %'.padStart(8))} ${chalk.dim('MCAP'.padStart(8))} ${chalk.dim('P/E'.padStart(6))}`;
  const headerStripped = stripAnsi(header);
  const headerPad = Math.max(0, innerWidth - headerStripped.length);
  console.log(chalk.cyan('│') + ' ' + header + ' '.repeat(headerPad) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // Results
  for (const stock of response.results) {
    const changeColor = stock.changePercent >= 0 ? chalk.green : chalk.red;
    const arrow = stock.changePercent >= 0 ? '▲' : '▼';

    const symbol = chalk.white(stock.symbol.padEnd(8));
    const name = chalk.dim(stock.name.substring(0, 24).padEnd(24));
    const price = chalk.white(`$${stock.price.toFixed(2)}`.padStart(10));
    const change = changeColor(`${arrow}${Math.abs(stock.changePercent).toFixed(1)}%`.padStart(8));
    const mcap = chalk.dim(formatMarketCap(stock.marketCap).padStart(8));
    const pe = stock.peRatio ? chalk.dim(stock.peRatio.toFixed(1).padStart(6)) : chalk.dim('-'.padStart(6));

    const line = `${symbol} ${name} ${price} ${change} ${mcap} ${pe}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));

  // Hint
  console.log('');
  console.log(chalk.dim('  Use "s <SYMBOL>" for detailed stock profile'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Preset List Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayScreenerPresets(presets: { id: ScreenerPreset; title: string; description: string }[]): void {
  const width = 60;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  const title = 'Stock Screener';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  for (const preset of presets) {
    const cmd = chalk.yellow(`screen ${preset.id}`.padEnd(18));
    const desc = chalk.dim(preset.description);
    const line = `${cmd} ${desc}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));

  console.log('');
  console.log(chalk.dim('  Example: screen gainers'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Related Stocks Display (for stock profile)
// ═══════════════════════════════════════════════════════════════════════════

import type { RelatedStock } from '../../services/screener.js';

export function formatRelatedStocksSection(related: RelatedStock[], width: number): string[] {
  if (related.length === 0) return [];

  const lines: string[] = [];
  const innerWidth = width - 4;

  lines.push(chalk.cyan('├─') + chalk.cyan(' Related Stocks ') + chalk.cyan('─'.repeat(Math.max(0, width - 20))) + chalk.cyan('┤'));

  // Show top 4 related stocks
  for (const stock of related.slice(0, 4)) {
    const changeColor = stock.changePercent >= 0 ? chalk.green : chalk.red;
    const arrow = stock.changePercent >= 0 ? '▲' : '▼';

    const symbol = chalk.white(stock.symbol.padEnd(6));
    const name = chalk.dim(stock.name.substring(0, 20).padEnd(20));
    const price = chalk.white(`$${stock.price.toFixed(2)}`.padStart(9));
    const change = changeColor(`${arrow}${Math.abs(stock.changePercent).toFixed(1)}%`.padStart(7));
    const mcap = chalk.dim(formatMarketCap(stock.marketCap).padStart(8));
    const pe = stock.peRatio ? chalk.dim(`P/E ${stock.peRatio.toFixed(1)}`) : '';

    const line = `${symbol} ${name} ${price} ${change} ${mcap}  ${pe}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    lines.push(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  return lines;
}
