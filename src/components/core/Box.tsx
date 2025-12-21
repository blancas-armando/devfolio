/**
 * Box Component
 *
 * A container component with optional borders
 * using DevFolio's rounded box drawing style.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import {
  borderStyle,
  drawTop,
  drawBottom,
  drawDivider as drawDividerLine,
  stripAnsi,
  type BorderStyle,
} from '../../design/borders.js';
import { palette, semantic } from '../../design/tokens.js';
import { width as widthConstants, spacing } from '../../design/spacing.js';

export interface BoxProps {
  children: React.ReactNode;
  /** Title displayed in the top border */
  title?: string;
  /** Width of the box (default: standard 72) */
  width?: number | 'compact' | 'standard' | 'full';
  /** Border style (default: rounded) */
  border?: BorderStyle | 'none';
  /** Border color */
  borderColor?: string;
  /** Title color */
  titleColor?: string;
  /** Padding inside the box */
  padding?: number;
  /** Margin around the box */
  margin?: number;
  /** Margin top */
  marginTop?: number;
  /** Margin bottom */
  marginBottom?: number;
}

export function Box({
  children,
  title,
  width = 'standard',
  border = 'rounded',
  borderColor = palette.border,
  titleColor = palette.accent,
  padding = 1,
  margin,
  marginTop,
  marginBottom,
}: BoxProps): React.ReactElement {
  // Resolve width
  const resolvedWidth = typeof width === 'number'
    ? width
    : widthConstants[width];

  // No border case
  if (border === 'none') {
    return (
      <InkBox
        flexDirection="column"
        width={resolvedWidth}
        marginTop={marginTop ?? margin}
        marginBottom={marginBottom ?? margin}
        paddingLeft={padding}
        paddingRight={padding}
      >
        {children}
      </InkBox>
    );
  }

  const style = borderStyle[border];
  const innerWidth = resolvedWidth - 2; // Account for side borders

  // Build top border with optional title
  let topBorder: string;
  if (title) {
    const titleText = ` ${title} `;
    const titleLen = stripAnsi(titleText).length;
    const leftBorder = style.horizontal.repeat(1);
    const rightLen = Math.max(0, resolvedWidth - 2 - 1 - titleLen);
    const rightBorder = style.horizontal.repeat(rightLen);
    topBorder = style.topLeft + leftBorder + titleText + rightBorder + style.topRight;
  } else {
    topBorder = drawTop(resolvedWidth, border);
  }

  const bottomBorder = drawBottom(resolvedWidth, border);

  return (
    <InkBox
      flexDirection="column"
      marginTop={marginTop ?? margin}
      marginBottom={marginBottom ?? margin}
    >
      {/* Top border */}
      <Text color={borderColor}>
        {title ? (
          <>
            <Text color={borderColor}>{style.topLeft + style.horizontal}</Text>
            <Text color={titleColor}>{title}</Text>
            <Text color={borderColor}>
              {style.horizontal.repeat(Math.max(0, resolvedWidth - 4 - stripAnsi(title).length))}
              {style.topRight}
            </Text>
          </>
        ) : (
          topBorder
        )}
      </Text>

      {/* Content with side borders */}
      <InkBox flexDirection="row" width={resolvedWidth}>
        <Text color={borderColor}>{style.vertical}</Text>
        <InkBox
          flexDirection="column"
          width={innerWidth - 2}
          paddingLeft={padding}
          paddingRight={padding}
        >
          {children}
        </InkBox>
        <Text color={borderColor}>{style.vertical}</Text>
      </InkBox>

      {/* Bottom border */}
      <Text color={borderColor}>{bottomBorder}</Text>
    </InkBox>
  );
}

// Convenience wrapper for full-width boxes
export function FullWidthBox(props: Omit<BoxProps, 'width'>): React.ReactElement {
  return <Box {...props} width="full" />;
}

// Convenience wrapper for compact boxes
export function CompactBox(props: Omit<BoxProps, 'width'>): React.ReactElement {
  return <Box {...props} width="compact" />;
}

// Simple container without border (just spacing)
export interface ContainerProps {
  children: React.ReactNode;
  padding?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export function Container({
  children,
  padding,
  margin,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
}: ContainerProps): React.ReactElement {
  return (
    <InkBox
      flexDirection="column"
      paddingLeft={padding}
      paddingRight={padding}
      marginTop={marginTop ?? margin}
      marginBottom={marginBottom ?? margin}
      marginLeft={marginLeft ?? margin}
      marginRight={marginRight ?? margin}
    >
      {children}
    </InkBox>
  );
}

// Row container for horizontal layout
export interface RowProps {
  children: React.ReactNode;
  gap?: number;
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  align?: 'flex-start' | 'flex-end' | 'center';
}

export function Row({
  children,
  gap = 1,
  justify = 'flex-start',
  align = 'flex-start',
}: RowProps): React.ReactElement {
  return (
    <InkBox
      flexDirection="row"
      justifyContent={justify}
      alignItems={align}
      columnGap={gap}
    >
      {children}
    </InkBox>
  );
}

// Column container for vertical layout
export interface ColumnProps {
  children: React.ReactNode;
  gap?: number;
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
}

export function Column({
  children,
  gap = 0,
  align = 'flex-start',
}: ColumnProps): React.ReactElement {
  return (
    <InkBox
      flexDirection="column"
      alignItems={align}
      rowGap={gap}
    >
      {children}
    </InkBox>
  );
}
