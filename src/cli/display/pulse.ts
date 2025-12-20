/**
 * Market Pulse Display
 * Real-time market snapshot - what's moving right now
 * Designed to be run frequently throughout the day
 */

import chalk from 'chalk';
import type { MarketPulse, PulseAlert, AlertSeverity, MarketStatus } from '../../services/pulse.js';
import type { PulseConfig } from '../../db/config.js';
import { stripAnsi, wrapText } from '../ui.js';

function getStatusLabel(status: MarketStatus): string {
  switch (status) {
    case 'pre-market': return chalk.yellow('PRE-MARKET');
    case 'open': return chalk.green('OPEN');
    case 'after-hours': return chalk.yellow('AFTER-HOURS');
    case 'closed': return chalk.dim('CLOSED');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Formatting
// ═══════════════════════════════════════════════════════════════════════════

function getAlertIcon(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return chalk.red('●');
    case 'warning': return chalk.yellow('●');
    case 'info': return chalk.blue('●');
    case 'positive': return chalk.green('●');
  }
}

function getAlertColor(severity: AlertSeverity): (text: string) => string {
  switch (severity) {
    case 'critical': return chalk.red;
    case 'warning': return chalk.yellow;
    case 'info': return chalk.blue;
    case 'positive': return chalk.green;
  }
}

function formatAlert(alert: PulseAlert, innerWidth: number): string[] {
  const icon = getAlertIcon(alert.severity);
  const color = getAlertColor(alert.severity);
  const title = color(alert.title);
  const detail = chalk.dim(alert.detail);

  const line = `${icon} ${title}  ${detail}`;
  const stripped = stripAnsi(line);

  if (stripped.length <= innerWidth) {
    return [line];
  }

  // Split into two lines if too long
  return [
    `${icon} ${title}`,
    `  ${detail}`,
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Pulse Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayMarketPulse(pulse: MarketPulse): void {
  const width = 72;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title with market status and timestamp
  const title = 'MARKET PULSE';
  const statusLabel = getStatusLabel(pulse.marketStatus);
  const time = pulse.asOfDate.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const rightSide = `${statusLabel} ${chalk.dim(time)}`;
  const rightLen = stripAnsi(rightSide).length;
  const titleLine = `${chalk.bold.white(title)}${' '.repeat(Math.max(0, innerWidth - title.length - rightLen))}${rightSide}`;
  console.log(chalk.cyan('│') + ' ' + titleLine + ' ' + chalk.cyan('│'));

  // FUTURES (Pre-market only)
  if (pulse.futures && pulse.futures.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Futures ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));
    const futuresLine = pulse.futures.map(f => {
      const color = f.changePercent >= 0 ? chalk.green : chalk.red;
      const arrow = f.changePercent >= 0 ? '▲' : '▼';
      return `${chalk.white(f.symbol)} ${color(`${arrow} ${f.changePercent >= 0 ? '+' : ''}${f.changePercent.toFixed(2)}%`)}`;
    }).join('    ');
    const futuresStripped = stripAnsi(futuresLine);
    const futuresPad = Math.max(0, innerWidth - futuresStripped.length);
    console.log(chalk.cyan('│') + ' ' + futuresLine + ' '.repeat(futuresPad) + ' ' + chalk.cyan('│'));
  }

  // INDICES
  console.log(chalk.cyan('├─') + chalk.cyan(' Indices ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

  for (const idx of pulse.indices) {
    const arrow = idx.changePercent >= 0 ? '▲' : '▼';
    const color = idx.changePercent >= 0 ? chalk.green : chalk.red;
    const priceStr = idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const changeStr = color(`${arrow} ${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%`);

    // Intraday range indicator
    let rangeIndicator = '';
    if (idx.dayHigh && idx.dayLow && idx.dayHigh !== idx.dayLow) {
      const range = idx.dayHigh - idx.dayLow;
      const position = (idx.price - idx.dayLow) / range;
      if (position >= 0.8) rangeIndicator = chalk.dim(' [near high]');
      else if (position <= 0.2) rangeIndicator = chalk.dim(' [near low]');
    }

    const line = `${chalk.white(idx.name.padEnd(14))} ${priceStr.padStart(12)}  ${changeStr}${rangeIndicator}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // INDICATORS ROW (VIX, DXY, Breadth)
  const indicators: string[] = [];

  if (pulse.vix !== null) {
    const vixColor = pulse.vix > 25 ? chalk.red : pulse.vix > 20 ? chalk.yellow : chalk.green;
    indicators.push(`VIX ${vixColor(pulse.vix.toFixed(1))}`);
  }

  if (pulse.dxy) {
    const dxyColor = pulse.dxy.changePercent >= 0 ? chalk.green : chalk.red;
    const dxyArrow = pulse.dxy.changePercent >= 0 ? '▲' : '▼';
    indicators.push(`DXY ${dxyColor(`${dxyArrow}${Math.abs(pulse.dxy.changePercent).toFixed(1)}%`)}`);
  }

  const breadthRatio = pulse.breadth.declining > 0
    ? (pulse.breadth.advancing / pulse.breadth.declining).toFixed(1)
    : pulse.breadth.advancing > 0 ? '>' : '0';
  const breadthColor = parseFloat(breadthRatio) > 1.5 ? chalk.green
    : parseFloat(breadthRatio) < 0.7 ? chalk.red : chalk.yellow;
  indicators.push(`${pulse.breadth.advancing}/${pulse.breadth.declining} ${breadthColor(`(${breadthRatio}:1)`)}`);

  if (indicators.length > 0) {
    const indicatorLine = indicators.join('  |  ');
    const indicatorStripped = stripAnsi(indicatorLine);
    const indicatorPad = Math.max(0, innerWidth - indicatorStripped.length);
    console.log(chalk.cyan('│') + ' ' + indicatorLine + ' '.repeat(indicatorPad) + ' ' + chalk.cyan('│'));
  }

  // SECTORS
  if (pulse.topSectors.length > 0 || pulse.bottomSectors.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Sectors ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

    if (pulse.topSectors.length > 0) {
      const topLine = pulse.topSectors.map(s => {
        const pct = s.changePercent >= 0 ? `+${s.changePercent.toFixed(1)}%` : `${s.changePercent.toFixed(1)}%`;
        const color = s.changePercent >= 0 ? chalk.green : chalk.red;
        return color(`${s.name} ${pct}`);
      }).join('  ');
      const topLabel = `${chalk.dim('▲')} ${topLine}`;
      const topStripped = stripAnsi(topLabel);
      const topPad = Math.max(0, innerWidth - topStripped.length);
      console.log(chalk.cyan('│') + ' ' + topLabel + ' '.repeat(topPad) + ' ' + chalk.cyan('│'));
    }

    if (pulse.bottomSectors.length > 0) {
      const bottomLine = pulse.bottomSectors.map(s => {
        const pct = s.changePercent >= 0 ? `+${s.changePercent.toFixed(1)}%` : `${s.changePercent.toFixed(1)}%`;
        const color = s.changePercent >= 0 ? chalk.green : chalk.red;
        return color(`${s.name} ${pct}`);
      }).join('  ');
      const bottomLabel = `${chalk.dim('▼')} ${bottomLine}`;
      const bottomStripped = stripAnsi(bottomLabel);
      const bottomPad = Math.max(0, innerWidth - bottomStripped.length);
      console.log(chalk.cyan('│') + ' ' + bottomLabel + ' '.repeat(bottomPad) + ' ' + chalk.cyan('│'));
    }
  }

  // TOP MOVERS
  if (pulse.topMovers.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Top Movers ') + chalk.cyan('─'.repeat(Math.max(0, width - 16))) + chalk.cyan('┤'));

    for (const mover of pulse.topMovers.slice(0, 5)) {
      const color = mover.changePercent >= 0 ? chalk.green : chalk.red;
      const arrow = mover.changePercent >= 0 ? '▲' : '▼';
      const pctStr = `${mover.changePercent >= 0 ? '+' : ''}${mover.changePercent.toFixed(1)}%`;
      const line = `${color(arrow)} ${chalk.white(mover.symbol.padEnd(6))} ${color(pctStr.padStart(7))}  ${chalk.dim(mover.name.substring(0, 40))}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  // TOP HEADLINE
  if (pulse.topHeadline) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Headline ') + chalk.cyan('─'.repeat(Math.max(0, width - 14))) + chalk.cyan('┤'));
    const headline = pulse.topHeadline.length > innerWidth - 2
      ? pulse.topHeadline.substring(0, innerWidth - 5) + '...'
      : pulse.topHeadline;
    const headlinePad = Math.max(0, innerWidth - headline.length);
    console.log(chalk.cyan('│') + ' ' + chalk.white(headline) + ' '.repeat(headlinePad) + ' ' + chalk.cyan('│'));
  }

  // AI TAKE
  if (pulse.aiTake) {
    console.log(chalk.cyan('├─') + chalk.cyan(' AI Take ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

    const wrapped = wrapText(pulse.aiTake, innerWidth - 2);
    for (const line of wrapped) {
      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.cyan('│') + ' ' + chalk.italic(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  // WATCHLIST SNAPSHOT (if user has items)
  if (pulse.watchlistSnapshot.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Your Watchlist ') + chalk.cyan('─'.repeat(Math.max(0, width - 20))) + chalk.cyan('┤'));
    const watchLine = pulse.watchlistSnapshot.map(w => {
      const color = w.changePercent >= 0 ? chalk.green : chalk.red;
      const arrow = w.changePercent >= 0 ? '▲' : '▼';
      return `${chalk.white(w.symbol)} ${color(`${arrow}${Math.abs(w.changePercent).toFixed(1)}%`)}`;
    }).join('   ');
    const watchStripped = stripAnsi(watchLine);
    const watchPad = Math.max(0, innerWidth - watchStripped.length);
    console.log(chalk.cyan('│') + ' ' + watchLine + ' '.repeat(watchPad) + ' ' + chalk.cyan('│'));
  }

  // ALERTS (enrichment for power users)
  if (pulse.alerts.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Your Alerts ') + chalk.cyan('─'.repeat(Math.max(0, width - 17))) + chalk.cyan('┤'));

    for (const alert of pulse.alerts.slice(0, 4)) {
      const lines = formatAlert(alert, innerWidth);
      for (const line of lines) {
        const stripped = stripAnsi(line);
        const padding = Math.max(0, innerWidth - stripped.length);
        console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
      }
    }

    if (pulse.alerts.length > 4) {
      const moreText = chalk.dim(`+ ${pulse.alerts.length - 4} more (pulse config to adjust)`);
      const stripped = stripAnsi(moreText);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + moreText + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Config Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayPulseConfig(config: PulseConfig): void {
  const width = 60;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  const title = 'Pulse Configuration';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  const settings = [
    { label: 'Index drop alert', value: `${config.indexDropThreshold}%`, key: 'indexDropThreshold' },
    { label: 'Index rise alert', value: `${config.indexRiseThreshold}%`, key: 'indexRiseThreshold' },
    { label: 'VIX threshold', value: `${config.vixThreshold}`, key: 'vixThreshold' },
    { label: 'Mover threshold', value: `${config.moverThreshold}%`, key: 'moverThreshold' },
    { label: 'Show sectors', value: config.showSectors ? 'Yes' : 'No', key: 'showSectors' },
    { label: 'Show indicators', value: config.showIndicators ? 'Yes' : 'No', key: 'showIndicators' },
    { label: 'Top movers count', value: `${config.topMoversCount}`, key: 'topMoversCount' },
  ];

  for (const setting of settings) {
    const line = `${chalk.white(setting.label.padEnd(20))} ${chalk.yellow(setting.value.padStart(10))}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  const hint = 'Use: pulse set <key> <value>';
  const hintPad = Math.max(0, innerWidth - hint.length);
  console.log(chalk.cyan('│') + ' ' + chalk.dim(hint) + ' '.repeat(hintPad) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}
