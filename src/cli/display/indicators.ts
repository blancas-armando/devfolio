/**
 * Technical Indicators Display
 * Renders RSI, MACD, Moving Averages, Bollinger Bands
 */

import chalk from 'chalk';
import type { IndicatorData, TechnicalSummary } from '../../services/indicators.js';
import { getTechnicalSummary } from '../../services/indicators.js';
import { stripAnsi } from '../ui.js';
import { theme, symbols, getRSIColor } from '../../utils/colors.js';

// ═══════════════════════════════════════════════════════════════════════════
// Display Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Display technical indicators section within a stock profile
 */
export function displayIndicators(
  indicators: IndicatorData,
  currentPrice: number,
  width: number = 60
): void {
  const innerWidth = width - 4;
  const summary = getTechnicalSummary(indicators);

  // Section header
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.dim('│') + ' ' + chalk.bold.yellow('Technical Indicators'.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));

  // Overall signal
  const overallColor = summary.overall === 'bullish' ? theme.success :
                       summary.overall === 'bearish' ? theme.danger : theme.warning;
  const overallIcon = summary.overall === 'bullish' ? '↑' :
                      summary.overall === 'bearish' ? '↓' : '→';

  const overallLine = `${chalk.dim('Signal')}          ${overallColor(`${overallIcon} ${summary.overall.toUpperCase()}`)}`;
  const overallStripped = stripAnsi(overallLine);
  console.log(chalk.dim('│') + ' ' + overallLine + ' '.repeat(Math.max(0, innerWidth - overallStripped.length)) + ' ' + chalk.dim('│'));

  // RSI
  if (indicators.latestRSI !== null) {
    const rsiValue = indicators.latestRSI.toFixed(1);
    const rsiColor = getRSIColor(indicators.latestRSI);
    const rsiLabel = indicators.latestRSI >= 70 ? 'Overbought' :
                     indicators.latestRSI <= 30 ? 'Oversold' : '';

    const rsiLine = `${chalk.dim('RSI (14)')}        ${rsiColor(rsiValue)}${rsiLabel ? ` ${chalk.dim(rsiLabel)}` : ''}`;
    const rsiStripped = stripAnsi(rsiLine);
    console.log(chalk.dim('│') + ' ' + rsiLine + ' '.repeat(Math.max(0, innerWidth - rsiStripped.length)) + ' ' + chalk.dim('│'));
  }

  // MACD
  if (indicators.latestMACD) {
    const { macd, signal, histogram } = indicators.latestMACD;
    const macdColor = histogram >= 0 ? theme.success : theme.danger;
    const macdTrend = histogram >= 0 ? '↑' : '↓';

    const macdLine = `${chalk.dim('MACD')}            ${macdColor(`${macdTrend} ${histogram.toFixed(2)}`)} ${chalk.dim(`(${macd.toFixed(2)}/${signal.toFixed(2)})`)}`;
    const macdStripped = stripAnsi(macdLine);
    console.log(chalk.dim('│') + ' ' + macdLine + ' '.repeat(Math.max(0, innerWidth - macdStripped.length)) + ' ' + chalk.dim('│'));
  }

  // Moving Averages
  const mas: { label: string; values: number[]; period: number }[] = [
    { label: 'SMA 20', values: indicators.sma20, period: 20 },
    { label: 'SMA 50', values: indicators.sma50, period: 50 },
    { label: 'SMA 200', values: indicators.sma200, period: 200 },
  ];

  for (const ma of mas) {
    if (ma.values.length > 0) {
      const maValue = ma.values[ma.values.length - 1];
      const aboveBelow = currentPrice >= maValue ? 'above' : 'below';
      const maColor = currentPrice >= maValue ? theme.success : theme.danger;
      const pctDiff = ((currentPrice - maValue) / maValue * 100).toFixed(1);

      const maLine = `${chalk.dim(ma.label)}          ${chalk.white('$' + maValue.toFixed(2))} ${maColor(`${pctDiff}% ${aboveBelow}`)}`;
      const maStripped = stripAnsi(maLine);
      console.log(chalk.dim('│') + ' ' + maLine + ' '.repeat(Math.max(0, innerWidth - maStripped.length)) + ' ' + chalk.dim('│'));
    }
  }

  // Bollinger Bands
  if (indicators.latestBB) {
    const { upper, middle, lower, price } = indicators.latestBB;
    const range = upper - lower;
    const position = ((price - lower) / range * 100).toFixed(0);
    const bbColor = parseInt(position) >= 80 ? theme.danger :
                    parseInt(position) <= 20 ? theme.success : theme.warning;

    // Visual band representation
    const bandWidth = 20;
    const pricePos = Math.round((parseInt(position) / 100) * bandWidth);
    const bandVisual =
      chalk.dim('L[') +
      chalk.dim('─'.repeat(Math.max(0, pricePos - 1))) +
      bbColor('●') +
      chalk.dim('─'.repeat(Math.max(0, bandWidth - pricePos))) +
      chalk.dim(']U');

    const bbLine = `${chalk.dim('Bollinger')}       ${bandVisual} ${bbColor(`${position}%`)}`;
    const bbStripped = stripAnsi(bbLine);
    console.log(chalk.dim('│') + ' ' + bbLine + ' '.repeat(Math.max(0, innerWidth - bbStripped.length)) + ' ' + chalk.dim('│'));
  }

  // Volume analysis
  if (indicators.volumeSpikes.length > 0) {
    const recentSpikes = indicators.volumeSpikes.slice(-5);
    const spikeCount = recentSpikes.filter(s => s).length;
    const volumeLabel = spikeCount > 2 ? 'High activity' :
                        spikeCount > 0 ? 'Normal' : 'Low';
    const volumeColor = spikeCount > 2 ? theme.warning : theme.muted;

    const volLine = `${chalk.dim('Volume')}          ${volumeColor(volumeLabel)} ${chalk.dim(`(${spikeCount}/5 spikes)`)}`;
    const volStripped = stripAnsi(volLine);
    console.log(chalk.dim('│') + ' ' + volLine + ' '.repeat(Math.max(0, innerWidth - volStripped.length)) + ' ' + chalk.dim('│'));
  }
}

/**
 * Compact one-line indicator summary
 */
export function getIndicatorSummaryLine(indicators: IndicatorData): string {
  const parts: string[] = [];

  // RSI
  if (indicators.latestRSI !== null) {
    const rsiColor = getRSIColor(indicators.latestRSI);
    parts.push(`RSI: ${rsiColor(indicators.latestRSI.toFixed(0))}`);
  }

  // MACD
  if (indicators.latestMACD) {
    const macdColor = indicators.latestMACD.histogram >= 0 ? theme.success : theme.danger;
    const arrow = indicators.latestMACD.histogram >= 0 ? '↑' : '↓';
    parts.push(`MACD: ${macdColor(arrow)}`);
  }

  // BB Position
  if (indicators.latestBB) {
    const { upper, lower, price } = indicators.latestBB;
    const position = Math.round((price - lower) / (upper - lower) * 100);
    const bbColor = position >= 80 ? theme.danger :
                    position <= 20 ? theme.success : theme.muted;
    parts.push(`BB: ${bbColor(`${position}%`)}`);
  }

  return parts.join(chalk.dim(' │ '));
}

/**
 * Display mini RSI gauge
 */
export function renderRSIGauge(rsi: number, width: number = 20): string {
  // RSI ranges from 0-100
  // 0-30 = oversold (green), 30-70 = neutral, 70-100 = overbought (red)

  const position = Math.round((rsi / 100) * width);
  const oversoldZone = Math.round((30 / 100) * width);
  const overboughtZone = Math.round((70 / 100) * width);

  let gauge = '';
  for (let i = 0; i < width; i++) {
    if (i === position) {
      // Current RSI position
      gauge += chalk.bold.white('●');
    } else if (i < oversoldZone) {
      // Oversold zone
      gauge += chalk.green('─');
    } else if (i >= overboughtZone) {
      // Overbought zone
      gauge += chalk.red('─');
    } else {
      // Neutral zone
      gauge += chalk.dim('─');
    }
  }

  return `${chalk.dim('0')}${gauge}${chalk.dim('100')}`;
}
