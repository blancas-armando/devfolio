/**
 * DevFolio Design System - Borders
 *
 * Box drawing characters and utilities for
 * creating consistent bordered containers.
 */

// Unicode box drawing characters
export const chars = {
  // Rounded corners (DevFolio signature style)
  topLeft: '\u256D',      // ╭
  topRight: '\u256E',     // ╮
  bottomLeft: '\u2570',   // ╰
  bottomRight: '\u256F',  // ╯

  // Lines
  horizontal: '\u2500',   // ─
  vertical: '\u2502',     // │

  // T-intersections
  leftT: '\u251C',        // ├
  rightT: '\u2524',       // ┤
  topT: '\u252C',         // ┬
  bottomT: '\u2534',      // ┴

  // Cross
  cross: '\u253C',        // ┼

  // Heavy/double (for emphasis)
  horizontalHeavy: '\u2501',  // ━
  verticalHeavy: '\u2503',    // ┃

  // Double line
  horizontalDouble: '\u2550', // ═
  verticalDouble: '\u2551',   // ║

  // Dashed (for subtle dividers)
  horizontalDash: '\u2504',   // ┄
  horizontalDash2: '\u254C',  // ╌

  // Dotted
  horizontalDot: '\u2508',    // ┈
} as const;

// Border style presets
export const borderStyle = {
  // Default rounded style
  rounded: {
    topLeft: chars.topLeft,
    topRight: chars.topRight,
    bottomLeft: chars.bottomLeft,
    bottomRight: chars.bottomRight,
    horizontal: chars.horizontal,
    vertical: chars.vertical,
  },

  // Square corners
  square: {
    topLeft: '\u250C',    // ┌
    topRight: '\u2510',   // ┐
    bottomLeft: '\u2514', // └
    bottomRight: '\u2518',// ┘
    horizontal: chars.horizontal,
    vertical: chars.vertical,
  },

  // Heavy borders
  heavy: {
    topLeft: '\u250F',    // ┏
    topRight: '\u2513',   // ┓
    bottomLeft: '\u2517', // ┗
    bottomRight: '\u251B',// ┛
    horizontal: chars.horizontalHeavy,
    vertical: chars.verticalHeavy,
  },

  // Double line
  double: {
    topLeft: '\u2554',    // ╔
    topRight: '\u2557',   // ╗
    bottomLeft: '\u255A', // ╚
    bottomRight: '\u255D',// ╝
    horizontal: chars.horizontalDouble,
    vertical: chars.verticalDouble,
  },
} as const;

export type BorderStyle = keyof typeof borderStyle;

// Convenient alias for common border characters
export const borders = {
  // Corners
  topLeft: chars.topLeft,
  topRight: chars.topRight,
  bottomLeft: chars.bottomLeft,
  bottomRight: chars.bottomRight,

  // Lines
  horizontal: chars.horizontal,
  vertical: chars.vertical,

  // T-junctions
  leftTee: chars.leftT,
  rightTee: chars.rightT,
  topTee: chars.topT,
  bottomTee: chars.bottomT,

  // Cross
  cross: chars.cross,
} as const;

/**
 * Draw the top border of a box
 */
export function drawTop(width: number, style: BorderStyle = 'rounded'): string {
  const s = borderStyle[style];
  return s.topLeft + s.horizontal.repeat(width - 2) + s.topRight;
}

/**
 * Draw the bottom border of a box
 */
export function drawBottom(width: number, style: BorderStyle = 'rounded'): string {
  const s = borderStyle[style];
  return s.bottomLeft + s.horizontal.repeat(width - 2) + s.bottomRight;
}

/**
 * Draw a horizontal divider within a box
 */
export function drawDivider(width: number, style: BorderStyle = 'rounded'): string {
  const s = borderStyle[style];
  return chars.leftT + s.horizontal.repeat(width - 2) + chars.rightT;
}

/**
 * Draw a row of content within a box
 */
export function drawRow(
  content: string,
  width: number,
  style: BorderStyle = 'rounded'
): string {
  const s = borderStyle[style];
  const contentWidth = stripAnsi(content).length;
  const padding = Math.max(0, width - 4 - contentWidth);
  return `${s.vertical} ${content}${' '.repeat(padding)} ${s.vertical}`;
}

/**
 * Draw a row with left and right content
 */
export function drawRowLR(
  left: string,
  right: string,
  width: number,
  style: BorderStyle = 'rounded'
): string {
  const s = borderStyle[style];
  const leftLen = stripAnsi(left).length;
  const rightLen = stripAnsi(right).length;
  const padding = Math.max(1, width - 4 - leftLen - rightLen);
  return `${s.vertical} ${left}${' '.repeat(padding)}${right} ${s.vertical}`;
}

/**
 * Draw a simple horizontal line (no box connection)
 */
export function drawLine(width: number, char: string = chars.horizontal): string {
  return char.repeat(width);
}

/**
 * Draw a dashed divider
 */
export function drawDashedLine(width: number): string {
  return chars.horizontalDash.repeat(width);
}

/**
 * Strip ANSI escape codes from string for length calculation
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Get visible length of string (excluding ANSI codes)
 */
export function visibleLength(str: string): string['length'] {
  return stripAnsi(str).length;
}

/**
 * Pad string to width (accounting for ANSI codes)
 */
export function padEnd(str: string, width: number, char: string = ' '): string {
  const visible = visibleLength(str);
  const padding = Math.max(0, width - visible);
  return str + char.repeat(padding);
}

/**
 * Pad string at start (accounting for ANSI codes)
 */
export function padStart(str: string, width: number, char: string = ' '): string {
  const visible = visibleLength(str);
  const padding = Math.max(0, width - visible);
  return char.repeat(padding) + str;
}

/**
 * Center string within width (accounting for ANSI codes)
 */
export function center(str: string, width: number, char: string = ' '): string {
  const visible = visibleLength(str);
  const totalPadding = Math.max(0, width - visible);
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  return char.repeat(leftPadding) + str + char.repeat(rightPadding);
}

/**
 * Truncate string to max width with ellipsis
 */
export function truncate(str: string, maxWidth: number, ellipsis: string = '...'): string {
  const visible = visibleLength(str);
  if (visible <= maxWidth) return str;

  // For ANSI strings, this is approximate
  const ellipsisLen = ellipsis.length;
  return str.slice(0, maxWidth - ellipsisLen) + ellipsis;
}
