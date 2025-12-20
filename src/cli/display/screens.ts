/**
 * Screen Display Functions
 * Home screen and help display
 */

import chalk from 'chalk';
import { LOGO, TAGLINE, VERSION, drawBox, drawDivider, getTerminalWidth, centerText, stripAnsi } from '../ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Home Screen
// ═══════════════════════════════════════════════════════════════════════════

export function showHomeScreen(): void {
  console.clear();
  const width = getTerminalWidth();

  // Logo with gradient effect
  const logoLines = LOGO.trim().split('\n');
  const gradient = [chalk.cyan, chalk.cyanBright, chalk.white, chalk.cyanBright, chalk.cyan, chalk.dim];

  console.log('');
  logoLines.forEach((line, i) => {
    const colorFn = gradient[i % gradient.length];
    console.log(centerText(colorFn(line), width));
  });

  console.log('');
  console.log(centerText(chalk.dim(TAGLINE), width));
  console.log(centerText(chalk.dim.italic(VERSION), width));
  console.log('');

  drawDivider('═');
  console.log('');

  // Quick actions box
  const commands = [
    `${chalk.yellow('w')} ${chalk.dim('/')} ${chalk.yellow('watchlist')}    ${chalk.dim('->')} View live stock quotes`,
    `${chalk.yellow('p')} ${chalk.dim('/')} ${chalk.yellow('portfolio')}    ${chalk.dim('->')} View portfolio summary`,
    `${chalk.yellow('s AAPL')}            ${chalk.dim('->')} Company profile & metrics`,
    `${chalk.yellow('r AAPL')}            ${chalk.dim('->')} AI research primer report`,
    `${chalk.yellow('e AAPL')}            ${chalk.dim('->')} Earnings + SEC filings`,
    `${chalk.yellow('etf VTI')}           ${chalk.dim('->')} ETF holdings & performance`,
    `${chalk.yellow('compare VTI SPY')}   ${chalk.dim('->')} Compare ETFs side-by-side`,
    `${chalk.yellow('?')} ${chalk.dim('/')} ${chalk.yellow('help')}         ${chalk.dim('->')} Show all commands`,
  ];

  drawBox('Quick Commands', commands, 58);

  console.log('');
  console.log(chalk.dim('  Tip: Try "e NVDA" for earnings history + SEC filings analysis'));
  console.log('');
  drawDivider('─');
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Help Screen
// ═══════════════════════════════════════════════════════════════════════════

export function showHelp(): void {
  const width = 66;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white('DevFolio Commands') + ' '.repeat(innerWidth - 17) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  // MARKET section
  console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow('MARKET') + ' '.repeat(innerWidth - 6) + ' ' + chalk.cyan('│'));
  const marketCmds = [
    `  ${chalk.yellow('b')}, ${chalk.yellow('brief')}          ${chalk.dim('AI market analysis')}`,
    `  ${chalk.yellow('news')} ${chalk.dim('[SYM]')}        ${chalk.dim('Market or stock news')}`,
    `  ${chalk.yellow('read <N>')}          ${chalk.dim('Read article N')}`,
  ];
  for (const line of marketCmds) {
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  // STOCKS section
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow('STOCKS') + ' '.repeat(innerWidth - 6) + ' ' + chalk.cyan('│'));
  const stockCmds = [
    `  ${chalk.yellow('s <SYM>')}           ${chalk.dim('Stock profile (s AAPL)')}`,
    `  ${chalk.yellow('r <SYM>')}           ${chalk.dim('AI research report')}`,
    `  ${chalk.yellow('e <SYM>')}           ${chalk.dim('Earnings report')}`,
    `  ${chalk.yellow('why <SYM>')}         ${chalk.dim('Explain stock movement')}`,
    `  ${chalk.yellow('cs <S1> <S2>...')}   ${chalk.dim('Compare stocks')}`,
  ];
  for (const line of stockCmds) {
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  // ETFs section
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow('ETFs') + ' '.repeat(innerWidth - 4) + ' ' + chalk.cyan('│'));
  const etfCmds = [
    `  ${chalk.yellow('etf <SYM>')}         ${chalk.dim('ETF profile (etf VTI)')}`,
    `  ${chalk.yellow('compare <S1> <S2>')} ${chalk.dim('Compare ETFs')}`,
  ];
  for (const line of etfCmds) {
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  // SEC FILINGS section
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow('SEC FILINGS') + ' '.repeat(innerWidth - 11) + ' ' + chalk.cyan('│'));
  const secCmds = [
    `  ${chalk.yellow('filings <SYM>')}     ${chalk.dim('List 10-K, 10-Q, 8-K')}`,
    `  ${chalk.yellow('filing <N>')}        ${chalk.dim('Read filing N')}`,
  ];
  for (const line of secCmds) {
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  // PORTFOLIO section
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow('PORTFOLIO') + ' '.repeat(innerWidth - 9) + ' ' + chalk.cyan('│'));
  const portfolioCmds = [
    `  ${chalk.yellow('w')}, ${chalk.yellow('watchlist')}      ${chalk.dim('View watchlist + events')}`,
    `  ${chalk.yellow('p')}, ${chalk.yellow('portfolio')}      ${chalk.dim('View portfolio')}`,
    `  ${chalk.yellow('add <SYM>')}         ${chalk.dim('Add to watchlist')}`,
    `  ${chalk.yellow('rm <SYM>')}          ${chalk.dim('Remove from watchlist')}`,
  ];
  for (const line of portfolioCmds) {
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  // OTHER section
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow('OTHER') + ' '.repeat(innerWidth - 5) + ' ' + chalk.cyan('│'));
  const otherCmds = [
    `  ${chalk.yellow('clear')}, ${chalk.yellow('home')}       ${chalk.dim('Clear screen')}`,
    `  ${chalk.yellow('?')}, ${chalk.yellow('help')}           ${chalk.dim('Show this help')}`,
    `  ${chalk.yellow('q')}, ${chalk.yellow('quit')}           ${chalk.dim('Exit')}`,
  ];
  for (const line of otherCmds) {
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));

  // Tips
  console.log('');
  console.log(chalk.bold.cyan('  Tips'));
  console.log(chalk.dim('  - Press Tab for command/symbol completion'));
  console.log(chalk.dim('  - Press Ctrl+C to cancel long operations'));
  console.log(chalk.dim('  - Use natural language: "tell me about Apple"'));
  console.log(chalk.dim('  - AI commands (b, r, e, why) provide deeper analysis'));
  console.log('');
}
