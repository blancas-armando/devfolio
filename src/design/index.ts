/**
 * DevFolio Design System
 *
 * A comprehensive design system for terminal UI,
 * providing consistent colors, typography, spacing,
 * borders, and symbols throughout the application.
 */

// Color tokens and semantic colors
export {
  palette,
  semantic,
  colors,
  type PaletteColor,
  type SemanticColor,
  type Color,
} from './tokens.js';

// Typography styles
export {
  typography,
  getTextStyle,
  type TypographyStyle,
} from './typography.js';

// Spacing and width constants
export {
  spacing,
  width,
  innerWidth,
  section,
  indent,
  type SpacingSize,
  type WidthSize,
} from './spacing.js';

// Border drawing utilities
export {
  chars,
  borderStyle,
  drawTop,
  drawBottom,
  drawDivider,
  drawRow,
  drawRowLR,
  drawLine,
  drawDashedLine,
  stripAnsi,
  visibleLength,
  padEnd,
  padStart,
  center,
  truncate,
  type BorderStyle,
} from './borders.js';

// Symbols and icons
export {
  arrows,
  bullets,
  status,
  progress,
  sparkline,
  spinnerFrames,
  spinnerDots,
  brackets,
  separators,
  financial,
  getPriceArrow,
  getSparklineChar,
  generateSparkline,
  getProgressBar,
} from './symbols.js';

// ASCII logo and branding
export {
  logoBlock,
  logoCompact,
  logoMinimal,
  tagline,
  getVersionString,
  logoLines,
  logoCompactLines,
  logoDimensions,
  decorative,
} from './ascii-logo.js';
