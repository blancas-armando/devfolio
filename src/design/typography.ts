/**
 * DevFolio Design System - Typography
 *
 * Text style configurations for consistent hierarchy
 * throughout the terminal interface.
 */

import { palette, semantic } from './tokens.js';

// Typography style definitions
export const typography = {
  // Headers
  header: {
    bold: true,
    color: palette.text,
  },

  headerAccent: {
    bold: true,
    color: palette.accent,
  },

  // Subheaders
  subheader: {
    bold: true,
    color: palette.textSecondary,
  },

  // Body text
  body: {
    color: palette.text,
  },

  bodySecondary: {
    color: palette.textSecondary,
  },

  // Labels and captions
  label: {
    color: palette.textSecondary,
  },

  caption: {
    color: palette.textTertiary,
    dimColor: true,
  },

  // Data display
  value: {
    color: palette.text,
  },

  valuePositive: {
    color: palette.positive,
  },

  valueNegative: {
    color: palette.negative,
  },

  // Interactive elements
  command: {
    color: palette.accent,
  },

  symbol: {
    bold: true,
    color: palette.text,
  },

  // Hints and placeholders
  hint: {
    color: palette.textTertiary,
  },

  placeholder: {
    color: palette.textTertiary,
  },

  // Messages
  error: {
    color: palette.negative,
  },

  success: {
    color: palette.positive,
  },

  warning: {
    color: palette.warning,
  },

  info: {
    color: palette.info,
  },

  // Code/monospace (terminal is already monospace)
  mono: {
    color: palette.text,
  },

  // Dim/muted
  muted: {
    color: palette.textMuted,
    dimColor: true,
  },
} as const;

export type TypographyStyle = keyof typeof typography;

/**
 * Get typography style props for Ink Text component
 */
export function getTextStyle(style: TypographyStyle): {
  color?: string;
  bold?: boolean;
  dimColor?: boolean;
} {
  return typography[style];
}
