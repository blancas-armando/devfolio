/**
 * Text Component
 *
 * A styled text component that applies typography
 * from the design system. Wraps Ink's Text component.
 */

import React from 'react';
import { Text as InkText } from 'ink';
import { getTextStyle, type TypographyStyle } from '../../design/index.js';
import { palette, semantic } from '../../design/tokens.js';

export interface TextProps {
  children: React.ReactNode;
  /** Typography style variant */
  variant?: TypographyStyle;
  /** Override color */
  color?: string;
  /** Make text bold */
  bold?: boolean;
  /** Dim the text */
  dim?: boolean;
  /** Italic text */
  italic?: boolean;
  /** Underline text */
  underline?: boolean;
  /** Strikethrough text */
  strikethrough?: boolean;
  /** Inverse colors */
  inverse?: boolean;
  /** Wrap text (default: wrap) */
  wrap?: 'wrap' | 'truncate' | 'truncate-start' | 'truncate-middle' | 'truncate-end';
}

export function Text({
  children,
  variant,
  color,
  bold,
  dim,
  italic,
  underline,
  strikethrough,
  inverse,
  wrap = 'wrap',
}: TextProps): React.ReactElement {
  // Get base styles from typography variant
  const baseStyles = variant ? getTextStyle(variant) : { color: undefined, bold: undefined, dimColor: undefined };

  return (
    <InkText
      color={color ?? baseStyles.color}
      bold={bold ?? baseStyles.bold}
      dimColor={dim ?? baseStyles.dimColor}
      italic={italic}
      underline={underline}
      strikethrough={strikethrough}
      inverse={inverse}
      wrap={wrap}
    >
      {children}
    </InkText>
  );
}

// Convenience components for common variants

export function Header({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="header" {...props}>{children}</Text>;
}

export function Subheader({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="subheader" {...props}>{children}</Text>;
}

export function Label({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="label" {...props}>{children}</Text>;
}

export function Caption({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="caption" {...props}>{children}</Text>;
}

export function Value({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="value" {...props}>{children}</Text>;
}

export function Command({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="command" {...props}>{children}</Text>;
}

export function Symbol({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="symbol" {...props}>{children}</Text>;
}

export function Hint({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="hint" {...props}>{children}</Text>;
}

export function Muted({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="muted" {...props}>{children}</Text>;
}

export function Error({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="error" {...props}>{children}</Text>;
}

export function Success({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="success" {...props}>{children}</Text>;
}

export function Warning({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="warning" {...props}>{children}</Text>;
}

export function Info({ children, ...props }: Omit<TextProps, 'variant'>): React.ReactElement {
  return <Text variant="info" {...props}>{children}</Text>;
}

// Price-specific text components

interface PriceTextProps extends Omit<TextProps, 'variant' | 'color'> {
  value: number;
}

export function PriceText({ value, children, ...props }: PriceTextProps): React.ReactElement {
  const color = value > 0 ? semantic.gain : value < 0 ? semantic.loss : semantic.unchanged;
  return <Text color={color} {...props}>{children}</Text>;
}
