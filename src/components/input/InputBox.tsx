/**
 * InputBox Component
 *
 * A bordered input container similar to Gemini CLI.
 * Wraps the input field with visual chrome.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { chars, borderStyle } from '../../design/borders.js';
import { palette } from '../../design/tokens.js';
import { width as widthConstants } from '../../design/spacing.js';

export interface InputBoxProps {
  children: React.ReactNode;
  /** Width of the box */
  width?: number | 'compact' | 'standard' | 'full';
  /** Border color */
  borderColor?: string;
  /** Whether input is focused */
  focused?: boolean;
  /** Prompt character */
  prompt?: string;
  /** Prompt color */
  promptColor?: string;
}

export function InputBox({
  children,
  width = 'standard',
  borderColor = palette.border,
  focused = true,
  prompt = '>',
  promptColor = palette.accent,
}: InputBoxProps): React.ReactElement {
  // Resolve width
  const resolvedWidth = typeof width === 'number'
    ? width
    : widthConstants[width];

  const style = borderStyle.rounded;
  const focusColor = focused ? palette.borderFocus : borderColor;

  return (
    <InkBox flexDirection="column" width={resolvedWidth}>
      {/* Top border */}
      <Text color={focusColor}>
        {style.topLeft}
        {style.horizontal.repeat(resolvedWidth - 2)}
        {style.topRight}
      </Text>

      {/* Content row with prompt */}
      <InkBox flexDirection="row">
        <Text color={focusColor}>{style.vertical}</Text>
        <InkBox flexGrow={1} paddingLeft={1}>
          <Text color={promptColor} bold>{prompt}</Text>
          <Text> </Text>
          {children}
        </InkBox>
        <Text color={focusColor}>{style.vertical}</Text>
      </InkBox>

      {/* Bottom border */}
      <Text color={focusColor}>
        {style.bottomLeft}
        {style.horizontal.repeat(resolvedWidth - 2)}
        {style.bottomRight}
      </Text>
    </InkBox>
  );
}

// Minimal input container (no full box, just underline)
export interface MinimalInputProps {
  children: React.ReactNode;
  prompt?: string;
  promptColor?: string;
}

export function MinimalInput({
  children,
  prompt = '>',
  promptColor = palette.accent,
}: MinimalInputProps): React.ReactElement {
  return (
    <InkBox>
      <Text color={promptColor} bold>{prompt}</Text>
      <Text> </Text>
      {children}
    </InkBox>
  );
}

// Input area with status line below
export interface InputAreaProps {
  children: React.ReactNode;
  /** Width of the area */
  width?: number | 'compact' | 'standard' | 'full';
  /** Status line content (left side) */
  statusLeft?: React.ReactNode;
  /** Status line content (right side) */
  statusRight?: React.ReactNode;
  /** Show the box border */
  showBorder?: boolean;
}

export function InputArea({
  children,
  width = 'standard',
  statusLeft,
  statusRight,
  showBorder = true,
}: InputAreaProps): React.ReactElement {
  // Resolve width
  const resolvedWidth = typeof width === 'number'
    ? width
    : widthConstants[width];

  return (
    <InkBox flexDirection="column" width={resolvedWidth}>
      {/* Input box or minimal input */}
      {showBorder ? (
        <InputBox width={resolvedWidth}>{children}</InputBox>
      ) : (
        <MinimalInput>{children}</MinimalInput>
      )}

      {/* Status line */}
      {(statusLeft || statusRight) && (
        <InkBox
          flexDirection="row"
          justifyContent="space-between"
          paddingLeft={1}
          paddingRight={1}
        >
          <InkBox>{statusLeft}</InkBox>
          <InkBox>{statusRight}</InkBox>
        </InkBox>
      )}
    </InkBox>
  );
}
