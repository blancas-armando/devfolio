// Terminal color utilities for consistent theming

import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════
// Color Hex Values (for reference)
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  // Core palette
  primary: '#7C3AED',      // Purple accent
  success: '#10B981',      // Green for gains
  danger: '#EF4444',       // Red for losses
  warning: '#F59E0B',      // Yellow for alerts
  muted: '#6B7280',        // Gray for secondary text

  // Text
  text: '#F9FAFB',         // Primary text
  textSecondary: '#9CA3AF', // Secondary text
  textTertiary: '#6B7280',  // Tertiary text

  // Borders
  border: '#374151',
  borderLight: '#4B5563',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Unified Theme (chalk functions for direct use)
// ═══════════════════════════════════════════════════════════════════════════

export const theme = {
  // Box and structure
  border: chalk.cyan,              // All box borders
  borderDim: chalk.dim,            // Dimmed borders

  // Text hierarchy
  header: chalk.bold.white,        // Box titles and main headers
  subheader: chalk.bold.yellow,    // Section headers within boxes
  text: chalk.white,               // Primary text
  muted: chalk.dim,                // Secondary/dimmed text
  accent: chalk.magenta,           // AI/special content

  // Semantic colors
  success: chalk.green,            // Positive values, gains, success
  danger: chalk.red,               // Negative values, losses, errors
  warning: chalk.yellow,           // Alerts, warnings
  info: chalk.cyan,                // Information, links

  // Value formatting
  positive: chalk.green,           // Positive numbers
  negative: chalk.red,             // Negative numbers
  neutral: chalk.yellow,           // Neutral/unchanged

  // Interactive elements
  command: chalk.yellow,           // Command examples
  symbol: chalk.bold.white,        // Stock symbols
  label: chalk.dim,                // Field labels

  // Status indicators
  statusGood: chalk.green,
  statusBad: chalk.red,
  statusWarn: chalk.yellow,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Symbols
// ═══════════════════════════════════════════════════════════════════════════

export const symbols = {
  up: '▲',
  down: '▼',
  bullet: '•',
  check: '✓',
  cross: '✗',
  arrow: '→',
  arrowRight: '→',
  arrowLeft: '←',
  arrowUp: '↑',
  arrowDown: '↓',
  dot: '·',
  dash: '─',
  doubleDash: '═',
  pipe: '│',
  sparkBlocks: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
  progressFull: '█',
  progressEmpty: '░',
  progressHalf: '▒',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get color based on value (positive/negative/neutral)
 */
export function getValueColor(value: number): typeof chalk {
  if (value > 0) return theme.positive;
  if (value < 0) return theme.negative;
  return theme.neutral;
}

/**
 * Format a value with appropriate color
 */
export function colorValue(value: number, format: (n: number) => string = String): string {
  return getValueColor(value)(format(value));
}

/**
 * Get RSI color based on overbought/oversold levels
 */
export function getRSIColor(rsi: number): typeof chalk {
  if (rsi >= 70) return theme.danger;  // Overbought
  if (rsi <= 30) return theme.success; // Oversold
  return theme.neutral;
}

/**
 * Get VIX color based on fear levels
 */
export function getVIXColor(vix: number): typeof chalk {
  if (vix > 25) return theme.danger;   // High fear
  if (vix > 20) return theme.warning;  // Elevated
  if (vix > 15) return theme.neutral;  // Normal
  return theme.success;                // Low
}
