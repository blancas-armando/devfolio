/**
 * CLI UI Primitives
 * Core display utilities for terminal rendering
 */

import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

export const LOGO = `
  ╔════════════════════════════════════════════════════════════════╗
  ║  ██████╗ ███████╗██╗   ██╗███████╗ ██████╗ ██╗     ██╗ ██████╗  ║
  ║  ██╔══██╗██╔════╝██║   ██║██╔════╝██╔═══██╗██║     ██║██╔═══██╗ ║
  ║  ██║  ██║█████╗  ██║   ██║█████╗  ██║   ██║██║     ██║██║   ██║ ║
  ║  ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║   ██║██║     ██║██║   ██║ ║
  ║  ██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗██║╚██████╔╝ ║
  ║  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝  ║
  ╚════════════════════════════════════════════════════════════════╝
`;

export const TAGLINE = 'AI-Powered Portfolio Intelligence';
export const VERSION = 'v0.2.0';

// Standardized display widths
export const WIDTH = {
  COMPACT: 60,    // Watchlist, portfolio, simple displays
  STANDARD: 72,   // Most content (news, market, stock profiles)
  FULL: 78,       // Wide content (comparisons, detailed reports)
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Text Utilities
// ═══════════════════════════════════════════════════════════════════════════

export function stripAnsi(str: string): string {
  // Strip both color codes and OSC 8 hyperlinks
  return str
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\x1b\]8;;[^\x07]*\x07([^\x1b]*)\x1b\]8;;\x07/g, '$1');
}

/**
 * Create a clickable terminal hyperlink (OSC 8)
 * Works in iTerm2, Windows Terminal, Hyper, and other modern terminals
 * Falls back to plain text in unsupported terminals
 */
export function hyperlink(url: string, text?: string): string {
  const displayText = text ?? url;
  // OSC 8 hyperlink format: \x1b]8;;URL\x07TEXT\x1b]8;;\x07
  return `\x1b]8;;${url}\x07${chalk.blue.underline(displayText)}\x1b]8;;\x07`;
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

// ═══════════════════════════════════════════════════════════════════════════
// Multi-Stage Progress
// ═══════════════════════════════════════════════════════════════════════════

export interface ProgressStage {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

const progressFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Show multi-stage progress indicator
 * Returns an object with methods to update stages and complete
 */
export function showProgress(stages: string[]): {
  update: (index: number, status: ProgressStage['status']) => void;
  next: () => void;
  complete: () => void;
  error: (message?: string) => void;
} {
  const state: ProgressStage[] = stages.map((label, i) => ({
    label,
    status: i === 0 ? 'active' : 'pending',
  }));

  let currentIndex = 0;
  let frameIndex = 0;
  let interval: NodeJS.Timeout | null = null;

  const render = () => {
    // Move cursor up to rewrite all lines
    if (currentIndex > 0 || state.some(s => s.status !== 'pending')) {
      process.stdout.write(`\x1b[${state.length}A`);
    }

    for (const stage of state) {
      let icon: string;
      let color: typeof chalk;

      switch (stage.status) {
        case 'done':
          icon = chalk.green('✓');
          color = chalk.dim;
          break;
        case 'active':
          icon = chalk.cyan(progressFrames[frameIndex]);
          color = chalk.white;
          break;
        case 'error':
          icon = chalk.red('✗');
          color = chalk.red;
          break;
        default:
          icon = chalk.dim('○');
          color = chalk.dim;
      }

      process.stdout.write(`\r${icon} ${color(stage.label)}\x1b[K\n`);
    }
  };

  // Start animation
  interval = setInterval(() => {
    frameIndex = (frameIndex + 1) % progressFrames.length;
    render();
  }, 80);

  render();

  return {
    update(index: number, status: ProgressStage['status']) {
      if (index >= 0 && index < state.length) {
        state[index].status = status;
        render();
      }
    },

    next() {
      if (currentIndex < state.length) {
        state[currentIndex].status = 'done';
        currentIndex++;
        if (currentIndex < state.length) {
          state[currentIndex].status = 'active';
        }
        render();
      }
    },

    complete() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      // Mark all remaining as done
      for (const stage of state) {
        if (stage.status === 'active' || stage.status === 'pending') {
          stage.status = 'done';
        }
      }
      render();
    },

    error(message?: string) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      // Mark current as error
      if (currentIndex < state.length) {
        state[currentIndex].status = 'error';
      }
      render();
      if (message) {
        console.log(chalk.red(`  ${message}`));
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Simple Progress Bar
// ═══════════════════════════════════════════════════════════════════════════

export function renderProgressBar(
  current: number,
  total: number,
  width: number = 20
): string {
  const ratio = Math.min(current / total, 1);
  const filled = Math.round(ratio * width);
  const empty = width - filled;

  return chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

// ═══════════════════════════════════════════════════════════════════════════
// Actionable Errors
// ═══════════════════════════════════════════════════════════════════════════

export interface ActionableError {
  message: string;
  suggestions?: string[];
  tryCommands?: string[];
}

export function displayActionableError(error: ActionableError): void {
  console.log('');
  console.log(chalk.red(`  Error: ${error.message}`));

  if (error.suggestions && error.suggestions.length > 0) {
    console.log('');
    console.log(chalk.dim('  Suggestions:'));
    for (const suggestion of error.suggestions) {
      console.log(chalk.dim(`  - ${suggestion}`));
    }
  }

  if (error.tryCommands && error.tryCommands.length > 0) {
    console.log('');
    console.log(chalk.dim('  Try:'));
    for (const cmd of error.tryCommands) {
      console.log(chalk.yellow(`    ${cmd}`));
    }
  }

  console.log('');
}
