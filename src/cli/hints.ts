/**
 * Contextual Hints System
 * Shows "Try next" suggestions after commands to guide users
 * Uses usage-based fading to reduce hint frequency over time
 */

import chalk from 'chalk';
import { getDisplayConfig, incrementHintUsage } from '../db/config.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Hint {
  text: string;
  command: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hint Definitions
// ═══════════════════════════════════════════════════════════════════════════

const HINTS: Record<string, Hint[]> = {
  stock: [
    { text: 'for AI research report', command: 'r {symbol}' },
    { text: 'to check earnings history', command: 'e {symbol}' },
    { text: 'to see why it\'s moving', command: 'why {symbol}' },
    { text: 'to compare with peers', command: 'cs {symbol} ...' },
    { text: 'to add to watchlist', command: 'add {symbol}' },
  ],
  watchlist: [
    { text: 'to view a stock profile', command: 's <SYMBOL>' },
    { text: 'for market pulse alerts', command: 'pulse' },
    { text: 'for AI market brief', command: 'b' },
    { text: 'to find trending stocks', command: 'screen gainers' },
  ],
  portfolio: [
    { text: 'to check your watchlist', command: 'w' },
    { text: 'for AI market brief', command: 'b' },
    { text: 'to research a holding', command: 'r <SYMBOL>' },
  ],
  earnings: [
    { text: 'to read SEC filings', command: 'filings {symbol}' },
    { text: 'for AI research report', command: 'r {symbol}' },
    { text: 'to check recent news', command: 'news {symbol}' },
  ],
  research: [
    { text: 'to check earnings data', command: 'e {symbol}' },
    { text: 'to see SEC filings', command: 'filings {symbol}' },
    { text: 'to add to watchlist', command: 'add {symbol}' },
  ],
  screener: [
    { text: 'to view stock details', command: 's <SYMBOL>' },
    { text: 'to try other presets', command: 'screen' },
  ],
  etf: [
    { text: 'to compare ETFs', command: 'compare {symbol} <OTHER>' },
    { text: 'for market brief', command: 'b' },
  ],
  brief: [
    { text: 'to check pulse alerts', command: 'pulse' },
    { text: 'to view your watchlist', command: 'w' },
    { text: 'to find top movers', command: 'screen gainers' },
  ],
  pulse: [
    { text: 'for full market brief', command: 'b' },
    { text: 'to configure thresholds', command: 'pulse config' },
    { text: 'to screen for movers', command: 'screen gainers' },
  ],
  filings: [
    { text: 'to read a filing', command: 'filing <N>' },
    { text: 'to check earnings', command: 'e {symbol}' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// State for Hint Fatigue Prevention
// ═══════════════════════════════════════════════════════════════════════════

const recentHints: string[] = [];
const MAX_RECENT = 5;

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine if we should show a hint based on usage count
 * Hints fade out over time: always show first 10 uses, then gradually reduce
 */
function shouldShowHint(): boolean {
  const config = getDisplayConfig();

  // Check if hints are disabled
  if (!config.hintsEnabled) return false;

  const usageCount = config.hintUsageCount;

  // Always show hints for first 10 commands
  if (usageCount < 10) return true;

  // 80% chance for commands 10-25
  if (usageCount < 25) return Math.random() < 0.8;

  // 50% chance for commands 25-50
  if (usageCount < 50) return Math.random() < 0.5;

  // 25% chance for commands 50-100
  if (usageCount < 100) return Math.random() < 0.25;

  // 10% chance after 100 commands
  return Math.random() < 0.1;
}

/**
 * Show a contextual hint after a command
 * @param context - The command context (e.g., 'stock', 'watchlist')
 * @param symbol - Optional symbol to substitute in hint command
 */
export function showHint(context: string, symbol?: string): void {
  // Track usage and check if we should show
  incrementHintUsage();

  if (!shouldShowHint()) return;

  const contextHints = HINTS[context];
  if (!contextHints || contextHints.length === 0) return;

  // Filter out recently shown hints
  const available = contextHints.filter((h) => !recentHints.includes(h.text));
  if (available.length === 0) {
    // Reset if all hints shown recently
    recentHints.length = 0;
    return;
  }

  // Pick random hint from available
  const hint = available[Math.floor(Math.random() * available.length)];

  // Format command with symbol if applicable
  const command = symbol
    ? hint.command.replace('{symbol}', symbol)
    : hint.command;

  // Track this hint
  recentHints.push(hint.text);
  if (recentHints.length > MAX_RECENT) {
    recentHints.shift();
  }

  // Display the hint
  console.log(chalk.dim(`  Tip: Try "${command}" ${hint.text}`));
}

/**
 * Reset hint tracking (useful for testing)
 */
export function resetHints(): void {
  recentHints.length = 0;
}
