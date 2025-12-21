/**
 * DevFolio Design System - Symbols
 *
 * Icons, indicators, and special characters
 * for visual feedback and data display.
 */

// Arrows for price movement
export const arrows = {
  up: '\u25B2',           // ▲ Filled up triangle
  down: '\u25BC',         // ▼ Filled down triangle
  upSmall: '\u25B4',      // ▴ Small up triangle
  downSmall: '\u25BE',    // ▾ Small down triangle
  right: '\u2192',        // → Right arrow
  left: '\u2190',         // ← Left arrow
  upRight: '\u2197',      // ↗ Up-right arrow
  downRight: '\u2198',    // ↘ Down-right arrow
} as const;

// Bullets and markers
export const bullets = {
  bullet: '\u2022',       // • Bullet
  diamond: '\u25C6',      // ◆ Filled diamond
  diamondEmpty: '\u25C7', // ◇ Empty diamond
  circle: '\u25CF',       // ● Filled circle
  circleEmpty: '\u25CB',  // ○ Empty circle
  square: '\u25A0',       // ■ Filled square
  squareEmpty: '\u25A1',  // □ Empty square
  dash: '\u2013',         // – En dash
  star: '\u2605',         // ★ Filled star
  starEmpty: '\u2606',    // ☆ Empty star
} as const;

// Status indicators
export const status = {
  check: '\u2713',        // ✓ Checkmark
  checkBold: '\u2714',    // ✔ Bold checkmark
  cross: '\u2717',        // ✗ Cross
  crossBold: '\u2718',    // ✘ Bold cross
  warning: '\u26A0',      // ⚠ Warning
  info: '\u2139',         // ℹ Info
  question: '\u2753',     // ❓ Question
  lightning: '\u26A1',    // ⚡ Lightning
} as const;

// Progress and loading
export const progress = {
  full: '\u2588',         // █ Full block
  high: '\u2587',         // ▇ 7/8 block
  medHigh: '\u2586',      // ▆ 6/8 block
  med: '\u2585',          // ▅ 5/8 block
  medLow: '\u2584',       // ▄ 4/8 block
  low: '\u2583',          // ▃ 3/8 block
  veryLow: '\u2582',      // ▂ 2/8 block
  empty: '\u2581',        // ▁ 1/8 block
} as const;

// Sparkline characters (for mini charts)
export const sparkline = [
  '\u2581', // ▁ 1/8
  '\u2582', // ▂ 2/8
  '\u2583', // ▃ 3/8
  '\u2584', // ▄ 4/8
  '\u2585', // ▅ 5/8
  '\u2586', // ▆ 6/8
  '\u2587', // ▇ 7/8
  '\u2588', // █ 8/8
] as const;

// Spinner frames (braille pattern animation)
export const spinnerFrames = [
  '\u280B', // ⠋
  '\u2819', // ⠙
  '\u2839', // ⠹
  '\u2838', // ⠸
  '\u283C', // ⠼
  '\u2834', // ⠴
  '\u2826', // ⠦
  '\u2827', // ⠧
  '\u2807', // ⠇
  '\u280F', // ⠏
] as const;

// Alternative spinner (dots)
export const spinnerDots = [
  '\u2804', // ⠄
  '\u2806', // ⠆
  '\u2807', // ⠇
  '\u280F', // ⠏
  '\u281F', // ⠟
  '\u283F', // ⠿
  '\u287F', // ⡿
  '\u28FF', // ⣿
  '\u28FE', // ⣾
  '\u28FC', // ⣼
  '\u28F8', // ⣸
  '\u28F0', // ⣰
  '\u28E0', // ⣠
  '\u28C0', // ⣀
] as const;

// Brackets and wrappers
export const brackets = {
  paren: ['(', ')'],
  square: ['[', ']'],
  curly: ['{', '}'],
  angle: ['\u27E8', '\u27E9'],  // ⟨⟩
  guillemet: ['\u00AB', '\u00BB'], // «»
} as const;

// Separators
export const separators = {
  pipe: '\u2502',         // │ Vertical line
  slash: '/',
  backslash: '\\',
  dot: '\u00B7',          // · Middle dot
  bullet: '\u2022',       // • Bullet
  colon: ':',
  doubleColon: '\u2237',  // ∷
  arrow: '\u203A',        // › Single arrow
  doubleArrow: '\u00BB',  // » Double arrow
} as const;

// Currency and financial
export const financial = {
  dollar: '$',
  euro: '\u20AC',         // €
  pound: '\u00A3',        // £
  yen: '\u00A5',          // ¥
  percent: '%',
  plusMinus: '\u00B1',    // ±
  infinity: '\u221E',     // ∞
  approximately: '\u2248', // ≈
} as const;

/**
 * Get price direction arrow based on change
 */
export function getPriceArrow(change: number): string {
  if (change > 0) return arrows.up;
  if (change < 0) return arrows.down;
  return '';
}

/**
 * Get sparkline character for a normalized value (0-1)
 */
export function getSparklineChar(normalizedValue: number): string {
  const index = Math.min(
    Math.floor(normalizedValue * sparkline.length),
    sparkline.length - 1
  );
  return sparkline[Math.max(0, index)];
}

/**
 * Generate sparkline string from array of values
 */
export function generateSparkline(values: number[]): string {
  if (values.length === 0) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map(v => getSparklineChar((v - min) / range))
    .join('');
}

/**
 * Get progress bar string
 */
export function getProgressBar(
  value: number,
  max: number,
  width: number = 10
): string {
  const ratio = Math.min(1, Math.max(0, value / max));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return progress.full.repeat(filled) + progress.empty.repeat(empty);
}

/**
 * Convenience export for common symbols used in views
 */
export const symbols = {
  // Arrows
  arrowUp: arrows.up,
  arrowDown: arrows.down,
  arrowRight: arrows.right,
  arrowLeft: arrows.left,

  // Bullets
  bullet: bullets.bullet,
  circle: bullets.circle,
  circleEmpty: bullets.circleEmpty,
  diamond: bullets.diamond,
  star: bullets.star,

  // Status
  check: status.check,
  cross: status.cross,
  warning: status.warning,
  info: status.info,

  // Progress
  blockFull: progress.full,
  blockEmpty: progress.empty,
  blockLight: progress.veryLow,

  // Separators
  pipe: separators.pipe,
  dot: separators.dot,

  // Financial
  dollar: financial.dollar,
  percent: financial.percent,
} as const;
