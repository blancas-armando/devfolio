/**
 * Earnings Display Functions
 * Earnings reports with quarterly data, KPIs, and guidance
 */

import chalk from 'chalk';
import type { EarningsReport, QuarterlyResults, KPIMetric, GuidanceMetric } from '../../services/earnings.js';
import { stripAnsi, wrapText, truncateText } from '../ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
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

// ═══════════════════════════════════════════════════════════════════════════
// Quarterly Results Table
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// KPI Table
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Guidance Table
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Earnings Report Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayEarningsReport(report: EarningsReport): void {
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
  const printAnalysis = (analysisTitle: string, content: string) => {
    console.log(chalk.magenta('│') + ' ' + chalk.bold.cyan(analysisTitle) + ' '.repeat(Math.max(0, innerWidth - analysisTitle.length)) + ' ' + chalk.magenta('│'));
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
