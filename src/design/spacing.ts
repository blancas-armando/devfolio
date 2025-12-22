/**
 * DevFolio Design System - Spacing
 *
 * Consistent spacing units and width constants
 * for terminal layout.
 */

// Spacing units (in terminal columns/rows)
export const spacing = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
  xxl: 8,
} as const;

// Content widths (terminal columns)
export const width = {
  // Compact - for sidebar content, watchlist
  compact: 60,

  // Standard - most content
  standard: 72,

  // Full - wide content, comparisons
  full: 78,

  // Maximum - edge-to-edge
  max: 100,
} as const;

// Get actual terminal width (dynamic)
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

// Inner width (accounting for box borders and padding)
export const innerWidth = {
  compact: width.compact - 4,     // 56
  standard: width.standard - 4,   // 68
  full: width.full - 4,           // 74
} as const;

// Section spacing (blank lines)
export const section = {
  // Gap between major sections
  gap: 1,

  // Gap between components within a section
  componentGap: 1,

  // Padding inside boxes
  boxPadding: 1,

  // Margin around boxes
  boxMargin: 1,
} as const;

// Indentation levels
export const indent = {
  none: 0,
  small: 2,
  medium: 4,
  large: 6,
} as const;

export type SpacingSize = keyof typeof spacing;
export type WidthSize = keyof typeof width;
