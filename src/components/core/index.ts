/**
 * Core Components
 *
 * Foundational UI primitives for building
 * the DevFolio terminal interface.
 */

// Text components
export {
  Text,
  Header,
  Subheader,
  Label,
  Caption,
  Value,
  Command,
  Symbol,
  Hint,
  Muted,
  Error,
  Success,
  Warning,
  Info,
  PriceText,
  type TextProps,
} from './Text.js';

// Box and layout components
export {
  Box,
  FullWidthBox,
  CompactBox,
  Container,
  Row,
  Column,
  type BoxProps,
  type ContainerProps,
  type RowProps,
  type ColumnProps,
} from './Box.js';

// Divider components
export {
  Divider,
  DashedDivider,
  DottedDivider,
  DoubleDivider,
  Spacer,
  type DividerProps,
  type SpacerProps,
} from './Divider.js';

// Badge components
export {
  Badge,
  SuccessBadge,
  ErrorBadge,
  WarningBadge,
  InfoBadge,
  AccentBadge,
  StatusBadge,
  Tag,
  Pill,
  type BadgeProps,
  type BadgeVariant,
  type StatusBadgeProps,
  type TagProps,
  type PillProps,
} from './Badge.js';

// Keyboard hint components
export {
  KeyHint,
  KeyHintGroup,
  InputHints,
  ExtendedInputHints,
  ProcessingHint,
  keyHintPresets,
  type KeyHintProps,
  type KeyHintGroupProps,
} from './KeyHint.js';
