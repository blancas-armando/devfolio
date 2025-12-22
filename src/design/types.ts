/**
 * Shared Design System Types
 *
 * Common type definitions used across components
 * to ensure API consistency.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Border & Visual Styles
// ═══════════════════════════════════════════════════════════════════════════

/** Border style variants for box-like components */
export type BorderVariant = 'rounded' | 'square' | 'heavy' | 'double' | 'none';

/** Line style variants for dividers and separators */
export type LineVariant = 'solid' | 'dashed' | 'dotted' | 'double';

/** Combined border and line variants */
export type BorderOrLineVariant = BorderVariant | LineVariant;

// ═══════════════════════════════════════════════════════════════════════════
// Size & Width Presets
// ═══════════════════════════════════════════════════════════════════════════

/** Width presets for components */
export type WidthPreset = 'compact' | 'standard' | 'full' | 'terminal';

/** Generic size presets */
export type SizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Spacing size options */
export type SpacingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ═══════════════════════════════════════════════════════════════════════════
// Status & State
// ═══════════════════════════════════════════════════════════════════════════

/** Component status variants */
export type StatusVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

/** Loading states */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Step/progress status */
export type StepStatus = 'pending' | 'active' | 'complete' | 'error' | 'skipped';

// ═══════════════════════════════════════════════════════════════════════════
// Common Props Interfaces
// ═══════════════════════════════════════════════════════════════════════════

/** Common layout props for spacing and margins */
export interface CommonLayoutProps {
  width?: number | WidthPreset;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

/** Common padding props */
export interface CommonPaddingProps {
  padding?: number;
  paddingX?: number;
  paddingY?: number;
}

/** Combined spacing props */
export interface CommonSpacingProps extends CommonLayoutProps, CommonPaddingProps {}

/** Common visual props */
export interface CommonVisualProps {
  border?: BorderVariant;
  color?: string;
  dimmed?: boolean;
}

/** Common interactive props */
export interface CommonInteractiveProps {
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Display Types
// ═══════════════════════════════════════════════════════════════════════════

/** Alignment options */
export type Alignment = 'left' | 'center' | 'right';

/** Vertical alignment options */
export type VerticalAlignment = 'top' | 'middle' | 'bottom';

/** Text truncation options */
export type TruncationType = 'none' | 'end' | 'middle' | 'start';

// ═══════════════════════════════════════════════════════════════════════════
// Icon Types
// ═══════════════════════════════════════════════════════════════════════════

/** Built-in icon names for EmptyState and other components */
export type IconName =
  | 'empty'
  | 'search'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'folder'
  | 'chart'
  | 'list'
  | 'settings'
  | 'none';

// ═══════════════════════════════════════════════════════════════════════════
// Action Types
// ═══════════════════════════════════════════════════════════════════════════

/** Action button definition for interactive components */
export interface ActionItem {
  label: string;
  command?: string;
  description?: string;
  primary?: boolean;
  disabled?: boolean;
}

/** Recovery action for error states */
export interface RecoveryAction extends ActionItem {
  type?: 'retry' | 'alternative' | 'help';
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Types
// ═══════════════════════════════════════════════════════════════════════════

/** Field validation error */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
  suggestion?: string;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Animation Types
// ═══════════════════════════════════════════════════════════════════════════

/** Animation variant names */
export type AnimationVariant = 'none' | 'fade' | 'slide' | 'pulse' | 'shimmer';

/** Animation direction */
export type AnimationDirection = 'in' | 'out' | 'both';
