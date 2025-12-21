/**
 * Badge Component
 *
 * Status badges and labels for visual categorization.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { brackets } from '../../design/symbols.js';

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'accent';

export interface BadgeProps {
  children: React.ReactNode;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Custom background color */
  bgColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Use inverse colors (filled background) */
  inverse?: boolean;
  /** Bracket style */
  bracket?: 'square' | 'paren' | 'none';
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: palette.border, text: palette.text },
  success: { bg: semantic.success, text: palette.text },
  error: { bg: semantic.error, text: palette.text },
  warning: { bg: semantic.warning, text: palette.text },
  info: { bg: semantic.info, text: palette.text },
  accent: { bg: palette.accent, text: palette.text },
};

export function Badge({
  children,
  variant = 'default',
  bgColor,
  textColor,
  inverse = false,
  bracket = 'square',
}: BadgeProps): React.ReactElement {
  const colors = variantColors[variant];
  const finalBgColor = bgColor ?? colors.bg;
  const finalTextColor = textColor ?? colors.text;

  // Get bracket characters
  const [leftBracket, rightBracket] = bracket === 'none'
    ? ['', '']
    : bracket === 'paren'
    ? brackets.paren
    : brackets.square;

  if (inverse) {
    // Filled background style
    return (
      <Text backgroundColor={finalBgColor} color={finalTextColor}>
        {' '}{children}{' '}
      </Text>
    );
  }

  // Outlined style with brackets
  return (
    <Text color={finalBgColor}>
      {leftBracket}
      <Text color={finalTextColor}>{children}</Text>
      {rightBracket}
    </Text>
  );
}

// Convenience badge variants

export function SuccessBadge({ children, ...props }: Omit<BadgeProps, 'variant'>): React.ReactElement {
  return <Badge variant="success" {...props}>{children}</Badge>;
}

export function ErrorBadge({ children, ...props }: Omit<BadgeProps, 'variant'>): React.ReactElement {
  return <Badge variant="error" {...props}>{children}</Badge>;
}

export function WarningBadge({ children, ...props }: Omit<BadgeProps, 'variant'>): React.ReactElement {
  return <Badge variant="warning" {...props}>{children}</Badge>;
}

export function InfoBadge({ children, ...props }: Omit<BadgeProps, 'variant'>): React.ReactElement {
  return <Badge variant="info" {...props}>{children}</Badge>;
}

export function AccentBadge({ children, ...props }: Omit<BadgeProps, 'variant'>): React.ReactElement {
  return <Badge variant="accent" {...props}>{children}</Badge>;
}

// Status badge with icon
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'processing';
}

const statusConfig: Record<StatusBadgeProps['status'], { variant: BadgeVariant; icon: string }> = {
  success: { variant: 'success', icon: '✓' },
  error: { variant: 'error', icon: '✗' },
  warning: { variant: 'warning', icon: '⚠' },
  info: { variant: 'info', icon: 'ℹ' },
  pending: { variant: 'default', icon: '○' },
  processing: { variant: 'accent', icon: '◐' },
};

export function StatusBadge({ status, children, ...props }: StatusBadgeProps): React.ReactElement {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} {...props}>
      {config.icon} {children}
    </Badge>
  );
}

// Tag component (minimal badge)
export interface TagProps {
  children: React.ReactNode;
  color?: string;
}

export function Tag({ children, color = palette.textSecondary }: TagProps): React.ReactElement {
  return (
    <Text color={color}>
      {'#'}{children}
    </Text>
  );
}

// Pill component (rounded style with dots)
export interface PillProps {
  children: React.ReactNode;
  color?: string;
  dotColor?: string;
}

export function Pill({
  children,
  color = palette.text,
  dotColor = palette.accent,
}: PillProps): React.ReactElement {
  return (
    <InkBox>
      <Text color={dotColor}>{'●'}</Text>
      <Text color={color}>{' '}{children}</Text>
    </InkBox>
  );
}
