/**
 * AsciiLogo Component
 *
 * Displays an ASCII art logo for a company
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette } from '../../design/tokens.js';
import type { AsciiLogo as AsciiLogoType } from '../../services/logo.js';

export interface AsciiLogoProps {
  logo: AsciiLogoType;
  color?: string;
}

export function AsciiLogo({
  logo,
  color = palette.textSecondary,
}: AsciiLogoProps): React.ReactElement {
  return (
    <InkBox flexDirection="column">
      {logo.lines.map((line, index) => (
        <Text key={index} color={color}>{line}</Text>
      ))}
    </InkBox>
  );
}

export default AsciiLogo;
