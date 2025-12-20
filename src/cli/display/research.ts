/**
 * Research Report Display
 * AI-generated research primers
 */

import chalk from 'chalk';
import type { ResearchReport } from '../../services/research.js';
import { stripAnsi, wrapText } from '../ui.js';
import { showHint } from '../hints.js';

// ═══════════════════════════════════════════════════════════════════════════
// Research Report Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayResearchReport(report: ResearchReport): void {
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
  const printSection = (sectionTitle: string, content: string | string[]) => {
    // Section header
    console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow(sectionTitle) + ' '.repeat(Math.max(0, innerWidth - sectionTitle.length)) + ' ' + chalk.cyan('│'));
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
  const printBulletSection = (sectionTitle: string, items: string[]) => {
    console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow(sectionTitle) + ' '.repeat(Math.max(0, innerWidth - sectionTitle.length)) + ' ' + chalk.cyan('│'));
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
  showHint('research', report.symbol);
  console.log('');
}
