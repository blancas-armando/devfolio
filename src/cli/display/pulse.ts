/**
 * Market Pulse Display
 * Real-time market alerts and AI analysis
 */

import chalk from 'chalk';
import type { MarketPulse, PulseAlert, AlertSeverity } from '../../services/pulse.js';
import type { PulseConfig } from '../../db/config.js';
import { stripAnsi, wrapText } from '../ui.js';

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

  // Title with timestamp
  const title = 'MARKET PULSE';
  const time = pulse.asOfDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const titleLine = `${chalk.bold.white(title)}${' '.repeat(innerWidth - title.length - time.length)}${chalk.dim(time)}`;
  console.log(chalk.cyan('│') + ' ' + titleLine + ' ' + chalk.cyan('│'));

  // Alerts Section
  if (pulse.alerts.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Alerts ') + chalk.cyan('─'.repeat(Math.max(0, width - 12))) + chalk.cyan('┤'));

    for (const alert of pulse.alerts.slice(0, 6)) {
      const lines = formatAlert(alert, innerWidth);
      for (const line of lines) {
        const stripped = stripAnsi(line);
        const padding = Math.max(0, innerWidth - stripped.length);
        console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
      }
    }

    if (pulse.alerts.length > 6) {
      const moreText = chalk.dim(`... and ${pulse.alerts.length - 6} more alerts`);
      const stripped = stripAnsi(moreText);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + moreText + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  } else {
    console.log(chalk.cyan('├─') + chalk.cyan(' Status ') + chalk.cyan('─'.repeat(Math.max(0, width - 12))) + chalk.cyan('┤'));
    const noAlerts = chalk.green('✓ No significant alerts based on your thresholds');
    const stripped = stripAnsi(noAlerts);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + noAlerts + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // Indices Section
  console.log(chalk.cyan('├─') + chalk.cyan(' Indices ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

  for (const idx of pulse.indices) {
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
  if (pulse.vix !== null) {
    const vixAboveThreshold = pulse.vix >= pulse.config.vixThreshold;
    const vixColor = pulse.vix > 25 ? chalk.red : pulse.vix > 20 ? chalk.yellow : chalk.green;
    const vixLabel = pulse.vix > 25 ? '(High Fear)' : pulse.vix > 20 ? '(Elevated)' : pulse.vix > 15 ? '(Normal)' : '(Low)';
    const threshold = vixAboveThreshold ? chalk.dim(` [threshold: ${pulse.config.vixThreshold}]`) : '';
    const vixLine = `${chalk.white('VIX'.padEnd(14))} ${pulse.vix.toFixed(2).padStart(12)}  ${vixColor(vixLabel)}${threshold}`;
    const vixStripped = stripAnsi(vixLine);
    const vixPad = Math.max(0, innerWidth - vixStripped.length);
    console.log(chalk.cyan('│') + ' ' + vixLine + ' '.repeat(vixPad) + ' ' + chalk.cyan('│'));
  }

  // Sectors Section
  if (pulse.config.showSectors && (pulse.topSectors.length > 0 || pulse.bottomSectors.length > 0)) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Sectors ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

    // Top sectors
    const topLine = pulse.topSectors.map(s => {
      const pct = s.changePercent >= 0 ? `+${s.changePercent.toFixed(1)}%` : `${s.changePercent.toFixed(1)}%`;
      return chalk.green(`${s.name} ${pct}`);
    }).join('  ');
    const topLabel = `${chalk.dim('▲')} ${topLine}`;
    const topStripped = stripAnsi(topLabel);
    const topPad = Math.max(0, innerWidth - topStripped.length);
    console.log(chalk.cyan('│') + ' ' + topLabel + ' '.repeat(topPad) + ' ' + chalk.cyan('│'));

    // Bottom sectors
    const bottomLine = pulse.bottomSectors.map(s => {
      const pct = s.changePercent >= 0 ? `+${s.changePercent.toFixed(1)}%` : `${s.changePercent.toFixed(1)}%`;
      return chalk.red(`${s.name} ${pct}`);
    }).join('  ');
    const bottomLabel = `${chalk.dim('▼')} ${bottomLine}`;
    const bottomStripped = stripAnsi(bottomLabel);
    const bottomPad = Math.max(0, innerWidth - bottomStripped.length);
    console.log(chalk.cyan('│') + ' ' + bottomLabel + ' '.repeat(bottomPad) + ' ' + chalk.cyan('│'));
  }

  // Big Movers Section
  if (pulse.bigMovers.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' Notable Movers ') + chalk.cyan('─'.repeat(Math.max(0, width - 20))) + chalk.cyan('┤'));

    for (const mover of pulse.bigMovers.slice(0, 5)) {
      const color = mover.changePercent >= 0 ? chalk.green : chalk.red;
      const arrow = mover.changePercent >= 0 ? '▲' : '▼';
      const pctStr = `${mover.changePercent >= 0 ? '+' : ''}${mover.changePercent.toFixed(1)}%`;
      const line = `${color(arrow)} ${chalk.white(mover.symbol.padEnd(6))} ${color(pctStr.padStart(7))}  ${chalk.dim(mover.name.substring(0, 40))}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  // AI Take Section
  if (pulse.aiTake) {
    console.log(chalk.cyan('├─') + chalk.cyan(' AI Take ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

    const wrapped = wrapText(pulse.aiTake, innerWidth - 2);
    for (const line of wrapped) {
      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.cyan('│') + ' ' + chalk.italic(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
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
