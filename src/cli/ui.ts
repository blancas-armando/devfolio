/**
 * CLI UI Primitives
 * Core display utilities for terminal rendering
 */

import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

export const LOGO = `
   ╔═══════════════════════════════════════════════════════════╗
   ║  ██████╗ ███████╗██╗   ██╗███████╗ ██████╗ ██╗     ██╗ ██████╗  ║
   ║  ██╔══██╗██╔════╝██║   ██║██╔════╝██╔═══██╗██║     ██║██╔═══██╗ ║
   ║  ██║  ██║█████╗  ██║   ██║█████╗  ██║   ██║██║     ██║██║   ██║ ║
   ║  ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║   ██║██║     ██║██║   ██║ ║
   ║  ██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗██║╚██████╔╝ ║
   ║  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝  ║
   ╚═══════════════════════════════════════════════════════════╝
`;

export const TAGLINE = 'AI-Powered Portfolio Intelligence';
export const VERSION = 'v0.1.0';

// Display widths
export const WIDTH = {
  FULL: 78,
  STANDARD: 72,
  MEDIUM: 66,
  COMPACT: 58,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Text Utilities
// ═══════════════════════════════════════════════════════════════════════════

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

export function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

// ═══════════════════════════════════════════════════════════════════════════
// Formatting
// ═══════════════════════════════════════════════════════════════════════════

export function formatLargeNumber(num: number | null, decimals: number = 2): string {
  if (num === null || num === undefined) return 'N/A';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e12) return `${sign}$${(absNum / 1e12).toFixed(decimals)}T`;
  if (absNum >= 1e9) return `${sign}$${(absNum / 1e9).toFixed(decimals)}B`;
  if (absNum >= 1e6) return `${sign}$${(absNum / 1e6).toFixed(decimals)}M`;
  if (absNum >= 1e3) return `${sign}$${(absNum / 1e3).toFixed(decimals)}K`;
  return `${sign}$${absNum.toFixed(decimals)}`;
}

export function formatRatio(num: number | null, decimals: number = 2): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toFixed(decimals);
}

export function formatPercentValue(num: number | null): string {
  if (num === null || num === undefined) return 'N/A';
  return `${(num * 100).toFixed(2)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Box Drawing
// ═══════════════════════════════════════════════════════════════════════════

export function drawBox(title: string, content: string[], width: number = 60): void {
  const innerWidth = width - 4;
  const top = '╭' + '─'.repeat(width - 2) + '╮';
  const bottom = '╰' + '─'.repeat(width - 2) + '╯';
  const divider = '├' + '─'.repeat(width - 2) + '┤';

  console.log(chalk.dim(top));
  console.log(chalk.dim('│') + ' ' + chalk.bold.cyan(title.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
  console.log(chalk.dim(divider));

  for (const line of content) {
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.dim('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.dim('│'));
  }

  console.log(chalk.dim(bottom));
}

export function drawSection(title: string, items: [string, string][], width: number = 56): void {
  const innerWidth = width - 4;
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));
  console.log(chalk.dim('│') + ' ' + chalk.bold.yellow(title.padEnd(innerWidth)) + ' ' + chalk.dim('│'));
  console.log(chalk.dim('├' + '─'.repeat(width - 2) + '┤'));

  for (const [label, value] of items) {
    const labelStr = chalk.dim(label.padEnd(20));
    const valueStr = value;
    const line = `${labelStr} ${valueStr}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.dim('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.dim('│'));
  }
}

export function drawDivider(char: string = '─'): void {
  const width = Math.min(getTerminalWidth(), 70);
  console.log(chalk.dim(char.repeat(width)));
}

// ═══════════════════════════════════════════════════════════════════════════
// Spinner
// ═══════════════════════════════════════════════════════════════════════════

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function showSpinner(message: string): () => void {
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(spinnerFrames[i])} ${chalk.dim(message)}`);
    i = (i + 1) % spinnerFrames.length;
  }, 80);

  return () => {
    clearInterval(interval);
    process.stdout.write('\r' + ' '.repeat(message.length + 4) + '\r');
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayError(message: string, hint?: string): void {
  console.log('');
  console.log(chalk.red(`  Error: ${message}`));
  if (hint) console.log(chalk.dim(`  ${hint}`));
  console.log('');
}

export function displayWarning(message: string): void {
  console.log('');
  console.log(chalk.yellow(`  ${message}`));
  console.log('');
}

export function displaySuccess(message: string): void {
  console.log('');
  console.log(chalk.green(`  ${message}`));
  console.log('');
}
