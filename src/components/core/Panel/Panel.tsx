/**
 * Panel Component
 *
 * A bordered container that renders top/bottom borders and provides
 * context for child components. Use with PanelRow for content that
 * needs side borders, and Section for dividers.
 *
 * Visual:
 * ╭─ Title ──────────────────────────────────────────────────────╮
 * │ Content row 1                                                 │
 * │ Content row 2                                                 │
 * ├─ Section ────────────────────────────────────────────────────┤
 * │ More content                                                  │
 * ╰───────────────────────────────────────────────────────────────╯
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { PanelContext, type PanelContextValue } from './context.js';
import { borders, visibleLength } from '../../../design/borders.js';
import { palette } from '../../../design/tokens.js';
import { width as widthConstants } from '../../../design/spacing.js';

export type PanelWidth = 'compact' | 'standard' | 'full' | number;

export interface PanelProps {
  children: React.ReactNode;
  /** Panel width - preset name or number */
  width?: PanelWidth;
  /** Optional title in top border */
  title?: string;
  /** Border color */
  borderColor?: string;
  /** Title color */
  titleColor?: string;
  /** Vertical margin */
  marginY?: number;
}

function resolveWidth(w: PanelWidth): number {
  if (typeof w === 'number') return w;
  return widthConstants[w] ?? widthConstants.full;
}

export function Panel({
  children,
  width = 'full',
  title,
  borderColor = palette.border,
  titleColor = palette.accent,
  marginY = 1,
}: PanelProps): React.ReactElement {
  const resolvedWidth = resolveWidth(width);
  const innerWidth = resolvedWidth - 2; // Account for left/right border chars
  const contentWidth = innerWidth - 2; // Account for padding

  const contextValue: PanelContextValue = {
    width: resolvedWidth,
    innerWidth,
    contentWidth,
    borderColor,
  };

  // Build top border
  const topBorder = title
    ? buildTitleBorder(resolvedWidth, title, borderColor, titleColor)
    : <Text color={borderColor}>{borders.topLeft}{borders.horizontal.repeat(resolvedWidth - 2)}{borders.topRight}</Text>;

  // Build bottom border
  const bottomBorder = (
    <Text color={borderColor}>
      {borders.bottomLeft}{borders.horizontal.repeat(resolvedWidth - 2)}{borders.bottomRight}
    </Text>
  );

  return (
    <PanelContext.Provider value={contextValue}>
      <InkBox flexDirection="column" marginTop={marginY} marginBottom={marginY}>
        {topBorder}
        {children}
        {bottomBorder}
      </InkBox>
    </PanelContext.Provider>
  );
}

/**
 * PanelRow - A row of content with side borders
 * Use this for all content inside a Panel to get │ content │ rendering
 */
export interface PanelRowProps {
  children: React.ReactNode;
  /** Padding inside the row (default: 1) */
  padding?: number;
}

export function PanelRow({ children, padding = 1 }: PanelRowProps): React.ReactElement {
  const { innerWidth, borderColor } = React.useContext(PanelContext);

  return (
    <InkBox flexDirection="row">
      <Text color={borderColor}>{borders.vertical}</Text>
      <InkBox width={innerWidth} paddingLeft={padding} paddingRight={padding}>
        {children}
      </InkBox>
      <Text color={borderColor}>{borders.vertical}</Text>
    </InkBox>
  );
}

/**
 * Build top border with title: ╭─ Title ─────────────────────╮
 */
function buildTitleBorder(
  width: number,
  title: string,
  borderColor: string,
  titleColor: string,
): React.ReactElement {
  const titleLen = visibleLength(title);
  // Format: ╭─ Title ─────────╮
  // Chars:  1 1 1 titleLen 1 N 1 = width
  // So N = width - 5 - titleLen
  const rightPad = Math.max(1, width - 5 - titleLen);

  return (
    <InkBox>
      <Text color={borderColor}>{borders.topLeft}{borders.horizontal} </Text>
      <Text color={titleColor} bold>{title}</Text>
      <Text color={borderColor}> {borders.horizontal.repeat(rightPad)}{borders.topRight}</Text>
    </InkBox>
  );
}

export default Panel;
