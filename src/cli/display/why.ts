/**
 * Why Display Function
 * Shows AI explanation for stock movements
 */

import chalk from 'chalk';
import type { WhyExplanation } from '../../services/why.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';
import { stripAnsi, wrapText } from '../ui.js';

export function displayWhyExplanation(why: WhyExplanation): void {
  const width = 60;
  const innerWidth = width - 4;

  console.log('');

  // Header
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  console.log(chalk.cyan(top));

  // Symbol and price
  const isUp = why.changePercent >= 0;
  const arrow = isUp ? '▲' : '▼';
  const priceColor = isUp ? chalk.green : chalk.red;

  const headerLine = `Why is ${chalk.bold.white(why.symbol)} ${isUp ? 'up' : 'down'}?`;
  const headerStripped = stripAnsi(headerLine);
  const headerPad = Math.max(0, innerWidth - headerStripped.length);
  console.log(chalk.cyan('│') + ' ' + headerLine + ' '.repeat(headerPad) + ' ' + chalk.cyan('│'));

  const priceLine = `${chalk.bold.white(formatCurrency(why.price))} ${priceColor(`${arrow} ${formatPercent(why.changePercent)}`)}`;
  const priceStripped = stripAnsi(priceLine);
  const pricePad = Math.max(0, innerWidth - priceStripped.length);
  console.log(chalk.cyan('│') + ' ' + priceLine + ' '.repeat(pricePad) + ' ' + chalk.cyan('│'));

  // Headline
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const headlineLines = wrapText(why.headline, innerWidth);
  for (const line of headlineLines) {
    const pad = Math.max(0, innerWidth - line.length);
    console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow(line) + ' '.repeat(pad) + ' ' + chalk.cyan('│'));
  }

  // Explanation
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const explainLines = wrapText(why.explanation, innerWidth);
  for (const line of explainLines) {
    const pad = Math.max(0, innerWidth - line.length);
    console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(pad) + ' ' + chalk.cyan('│'));
  }

  // Key factors
  if (why.factors.length > 0) {
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
    const factorsLabel = 'Key Factors:';
    const flPad = Math.max(0, innerWidth - factorsLabel.length);
    console.log(chalk.cyan('│') + ' ' + chalk.dim(factorsLabel) + ' '.repeat(flPad) + ' ' + chalk.cyan('│'));

    for (const factor of why.factors) {
      const factorLine = `  • ${factor}`;
      const factorLines = wrapText(factorLine, innerWidth);
      for (const fl of factorLines) {
        const pad = Math.max(0, innerWidth - fl.length);
        console.log(chalk.cyan('│') + ' ' + chalk.white(fl) + ' '.repeat(pad) + ' ' + chalk.cyan('│'));
      }
    }
  }

  // News context
  if (why.newsContext.length > 0) {
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
    const newsLabel = 'Related News:';
    const nlPad = Math.max(0, innerWidth - newsLabel.length);
    console.log(chalk.cyan('│') + ' ' + chalk.dim(newsLabel) + ' '.repeat(nlPad) + ' ' + chalk.cyan('│'));

    for (const news of why.newsContext) {
      const newsLine = `  ${news}`;
      const newsLines = wrapText(newsLine, innerWidth);
      for (const nl of newsLines) {
        const pad = Math.max(0, innerWidth - nl.length);
        console.log(chalk.cyan('│') + ' ' + chalk.dim(nl) + ' '.repeat(pad) + ' ' + chalk.cyan('│'));
      }
    }
  }

  // Footer
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  console.log(chalk.cyan(bottom));
  console.log('');
}
