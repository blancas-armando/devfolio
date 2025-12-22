/**
 * Section Component
 *
 * Creates a section divider within a Panel that connects to the
 * side borders with T-junctions. Children are rendered after the divider.
 *
 * Visual:
 * ├─ Section Title ──────────────────────────────────────────────┤
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { usePanelContext } from './context.js';
import { borders, visibleLength } from '../../../design/borders.js';
import { palette } from '../../../design/tokens.js';

export interface SectionProps {
  children?: React.ReactNode;
  /** Section title displayed in divider */
  title?: string;
  /** Title color */
  titleColor?: string;
}

export function Section({
  children,
  title,
  titleColor = palette.accent,
}: SectionProps): React.ReactElement {
  const { width, borderColor } = usePanelContext();

  // Build section divider: ├─ Title ─────────┤
  const divider = title
    ? buildTitleDivider(width, title, borderColor, titleColor)
    : <Text color={borderColor}>{borders.leftTee}{borders.horizontal.repeat(width - 2)}{borders.rightTee}</Text>;

  return (
    <>
      {divider}
      {children}
    </>
  );
}

/**
 * Build section divider with title: ├─ Title ─────────────────┤
 */
function buildTitleDivider(
  width: number,
  title: string,
  borderColor: string,
  titleColor: string,
): React.ReactElement {
  const titleLen = visibleLength(title);
  // Format: ├─ Title ─────────┤
  // Chars:  1 1 1 titleLen 1 N 1 = width
  // So N = width - 5 - titleLen
  const rightPad = Math.max(1, width - 5 - titleLen);

  return (
    <InkBox>
      <Text color={borderColor}>{borders.leftTee}{borders.horizontal} </Text>
      <Text color={titleColor}>{title}</Text>
      <Text color={borderColor}> {borders.horizontal.repeat(rightPad)}{borders.rightTee}</Text>
    </InkBox>
  );
}

export default Section;
