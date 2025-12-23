/**
 * Layout Utilities
 *
 * Centralized width calculations and layout constants
 * to ensure consistent sizing across all components.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Width Definitions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard width presets with pre-calculated inner widths
 *
 * - outer: Total component width including borders
 * - inner: Width inside borders (outer - 2 for single-char borders)
 * - content: Width for actual content (inner - padding on each side)
 */
export const widths = {
  compact: { outer: 60, inner: 58, content: 56 },
  standard: { outer: 72, inner: 70, content: 68 },
  full: { outer: 78, inner: 76, content: 74 },
  terminal: { outer: 100, inner: 98, content: 96 },
} as const;

export type WidthPreset = keyof typeof widths;

// ═══════════════════════════════════════════════════════════════════════════
// Width Calculation Utilities
// ═══════════════════════════════════════════════════════════════════════════

export interface WidthOptions {
  /** Include border characters (default: true) */
  border?: boolean;
  /** Padding on each side (default: 1) */
  padding?: number;
  /** Border width on each side (default: 1 if border is true) */
  borderWidth?: number;
}

/**
 * Calculate content width from total width
 *
 * @param totalWidth - The outer width of the component
 * @param options - Width calculation options
 * @returns The width available for content
 */
export function contentWidth(totalWidth: number, options: WidthOptions = {}): number {
  const { border = true, padding = 1, borderWidth = 1 } = options;
  const borders = border ? borderWidth * 2 : 0;
  const paddings = padding * 2;
  return totalWidth - borders - paddings;
}

/**
 * Calculate inner width (inside borders, before padding)
 */
export function innerWidth(totalWidth: number, options: Pick<WidthOptions, 'border' | 'borderWidth'> = {}): number {
  const { border = true, borderWidth = 1 } = options;
  const borders = border ? borderWidth * 2 : 0;
  return totalWidth - borders;
}

/**
 * Get width value from preset or number
 */
export function resolveWidth(
  width: number | WidthPreset,
  context: 'outer' | 'inner' | 'content' = 'outer'
): number {
  if (typeof width === 'number') {
    if (context === 'outer') return width;
    if (context === 'inner') return width - 2;
    return width - 4; // content
  }
  return widths[width][context];
}

/**
 * Get all width values for a preset
 */
export function getWidthSet(preset: WidthPreset): { outer: number; inner: number; content: number } {
  return { ...widths[preset] };
}

// ═══════════════════════════════════════════════════════════════════════════
// Layout Presets
// ═══════════════════════════════════════════════════════════════════════════

export const layout = {
  /** Component width utilities */
  contentWidth,
  innerWidth,
  resolveWidth,
  getWidthSet,

  /** Pre-defined width sets */
  widths,

  /** Standard margins */
  margin: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
  },

  /** Standard padding */
  padding: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
  },

  /** Standard gaps between elements */
  gap: {
    none: 0,
    tight: 1,
    normal: 2,
    loose: 3,
  },

  /** Column configurations */
  columns: {
    single: 1,
    double: 2,
    triple: 3,
    quad: 4,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Grid Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate column width for a grid layout
 */
export function columnWidth(
  totalWidth: number,
  columns: number,
  gap: number = 2
): number {
  const totalGaps = gap * (columns - 1);
  return Math.floor((totalWidth - totalGaps) / columns);
}

/**
 * Calculate indent width
 */
export function indentWidth(level: number, indentSize: number = 2): number {
  return level * indentSize;
}

// ═══════════════════════════════════════════════════════════════════════════
// Text Fitting Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate if text fits within width, accounting for ellipsis
 */
export function textFits(text: string, maxWidth: number, ellipsis: string = '...'): boolean {
  return text.length <= maxWidth;
}

/**
 * Get truncation point for text
 */
export function getTruncationPoint(text: string, maxWidth: number, ellipsis: string = '...'): number {
  if (text.length <= maxWidth) return text.length;
  return maxWidth - ellipsis.length;
}
