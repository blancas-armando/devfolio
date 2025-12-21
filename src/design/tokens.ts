/**
 * DevFolio Design System - Color Tokens
 *
 * A muted, sophisticated palette that creates a premium,
 * terminal-native aesthetic. No harsh colors, no gradients.
 */

// Primary palette - muted, sophisticated
export const palette = {
  // Accent - soft lavender for commands and emphasis
  accent: '#8B7EC8',
  accentDim: '#6B5EA8',
  accentBright: '#A99ED8',

  // Semantic colors - desaturated for terminal harmony
  positive: '#5FA87F',      // Sage green
  negative: '#C47070',      // Dusty rose
  warning: '#C4A050',       // Ochre
  info: '#6B9FC4',          // Steel blue

  // Neutrals - warm gray spectrum
  text: '#E8E6E3',          // Warm white (primary text)
  textSecondary: '#9A9590', // Warm gray (secondary text)
  textTertiary: '#6B6560',  // Darker warm gray (tertiary/muted)
  textMuted: '#4A4540',     // Very muted

  // Borders - subtle
  border: '#3D3835',        // Warm dark gray
  borderLight: '#4A4540',   // Slightly lighter
  borderFocus: '#5A5550',   // Focus state

  // Background hints (for reference in terminal themes)
  bgSubtle: '#1A1816',      // Very dark warm
  bgElevated: '#252220',    // Slightly elevated
} as const;

// Semantic color mappings for financial data
export const semantic = {
  // Direct access to positive/negative for convenience
  positive: palette.positive,
  negative: palette.negative,

  // Financial
  gain: palette.positive,
  loss: palette.negative,
  unchanged: palette.textSecondary,

  // Price movement
  priceUp: palette.positive,
  priceDown: palette.negative,
  priceFlat: palette.textSecondary,

  // UI elements
  command: palette.accent,
  symbol: palette.text,
  label: palette.textSecondary,
  value: palette.text,

  // Emphasis
  emphasis: palette.text,
  muted: palette.textTertiary,
  placeholder: palette.textTertiary,

  // Status
  processing: palette.accentDim,
  error: palette.negative,
  success: palette.positive,
  warning: palette.warning,
  info: palette.info,

  // Interactive
  cursor: palette.accent,
  selection: palette.accentDim,
  hint: palette.textTertiary,
} as const;

// Chalk-compatible color names for Ink Text components
export const colors = {
  // Primary
  primary: palette.text,
  secondary: palette.textSecondary,
  tertiary: palette.textTertiary,

  // Accent
  accent: palette.accent,

  // Semantic
  green: palette.positive,
  red: palette.negative,
  yellow: palette.warning,
  blue: palette.info,

  // Special
  dim: palette.textMuted,
  white: palette.text,
  gray: palette.textSecondary,
} as const;

export type PaletteColor = keyof typeof palette;
export type SemanticColor = keyof typeof semantic;
export type Color = keyof typeof colors;
