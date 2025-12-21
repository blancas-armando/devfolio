/**
 * Divider Component
 *
 * Horizontal dividers for visual separation
 * within sections.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { chars, drawLine, drawDashedLine, stripAnsi } from '../../design/borders.js';
import { palette } from '../../design/tokens.js';
import { width as widthConstants } from '../../design/spacing.js';

export interface DividerProps {
  /** Width of the divider */
  width?: number | 'compact' | 'standard' | 'full';
  /** Style of the divider */
  style?: 'solid' | 'dashed' | 'dotted' | 'double';
  /** Color of the divider */
  color?: string;
  /** Label text in the center */
  label?: string;
  /** Label color */
  labelColor?: string;
  /** Margin top */
  marginTop?: number;
  /** Margin bottom */
  marginBottom?: number;
}

export function Divider({
  width = 'standard',
  style = 'solid',
  color = palette.border,
  label,
  labelColor = palette.textSecondary,
  marginTop = 1,
  marginBottom = 1,
}: DividerProps): React.ReactElement {
  // Resolve width
  const resolvedWidth = typeof width === 'number'
    ? width
    : widthConstants[width];

  // Get the line character based on style
  const getLineChar = (): string => {
    switch (style) {
      case 'dashed':
        return chars.horizontalDash;
      case 'dotted':
        return chars.horizontalDot;
      case 'double':
        return chars.horizontalDouble;
      case 'solid':
      default:
        return chars.horizontal;
    }
  };

  const lineChar = getLineChar();

  // Build the divider with optional label
  if (label) {
    const labelText = ` ${label} `;
    const labelLen = labelText.length;
    const sideLen = Math.floor((resolvedWidth - labelLen) / 2);
    const leftSide = lineChar.repeat(Math.max(0, sideLen));
    const rightSide = lineChar.repeat(Math.max(0, resolvedWidth - sideLen - labelLen));

    return (
      <InkBox marginTop={marginTop} marginBottom={marginBottom}>
        <Text color={color}>{leftSide}</Text>
        <Text color={labelColor}>{labelText}</Text>
        <Text color={color}>{rightSide}</Text>
      </InkBox>
    );
  }

  // Simple divider without label
  return (
    <InkBox marginTop={marginTop} marginBottom={marginBottom}>
      <Text color={color}>{lineChar.repeat(resolvedWidth)}</Text>
    </InkBox>
  );
}

// Convenience variants

export function DashedDivider(props: Omit<DividerProps, 'style'>): React.ReactElement {
  return <Divider {...props} style="dashed" />;
}

export function DottedDivider(props: Omit<DividerProps, 'style'>): React.ReactElement {
  return <Divider {...props} style="dotted" />;
}

export function DoubleDivider(props: Omit<DividerProps, 'style'>): React.ReactElement {
  return <Divider {...props} style="double" />;
}

// Spacer component (blank line)
export interface SpacerProps {
  lines?: number;
}

export function Spacer({ lines = 1 }: SpacerProps): React.ReactElement {
  return (
    <InkBox flexDirection="column">
      {Array.from({ length: lines }).map((_, i) => (
        <Text key={i}> </Text>
      ))}
    </InkBox>
  );
}
