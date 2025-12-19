// Terminal color utilities for consistent theming

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

export const symbols = {
  up: '▲',
  down: '▼',
  bullet: '•',
  check: '✓',
  cross: '✗',
  arrow: '→',
  sparkBlocks: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
} as const;
