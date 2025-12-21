/**
 * TabCompleter Component
 *
 * Displays completion suggestions in a horizontal list.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette } from '../../design/tokens.js';

export interface TabCompleterProps {
  /** Available completions */
  completions: string[];
  /** Currently selected index (-1 for none) */
  selectedIndex: number;
  /** Maximum completions to display */
  maxDisplay?: number;
  /** Whether completions are visible */
  visible?: boolean;
}

export function TabCompleter({
  completions,
  selectedIndex,
  maxDisplay = 8,
  visible = true,
}: TabCompleterProps): React.ReactElement | null {
  if (!visible || completions.length === 0) {
    return null;
  }

  // Show subset of completions
  const displayCompletions = completions.slice(0, maxDisplay);
  const hasMore = completions.length > maxDisplay;

  return (
    <InkBox marginLeft={2} marginBottom={1} flexWrap="wrap">
      {displayCompletions.map((completion, index) => {
        const isSelected = index === selectedIndex;
        return (
          <InkBox key={completion} marginRight={1}>
            <Text
              inverse={isSelected}
              color={isSelected ? palette.text : palette.textTertiary}
            >
              {isSelected ? ` ${completion} ` : completion}
            </Text>
          </InkBox>
        );
      })}
      {hasMore && (
        <Text color={palette.textMuted}>
          +{completions.length - maxDisplay} more
        </Text>
      )}
    </InkBox>
  );
}

// Vertical list style (alternative)
export interface VerticalCompleterProps extends TabCompleterProps {
  /** Width of the completion list */
  width?: number;
}

export function VerticalCompleter({
  completions,
  selectedIndex,
  maxDisplay = 5,
  visible = true,
  width = 40,
}: VerticalCompleterProps): React.ReactElement | null {
  if (!visible || completions.length === 0) {
    return null;
  }

  // Calculate which completions to show (scrolling window)
  let startIndex = 0;
  if (selectedIndex >= maxDisplay) {
    startIndex = selectedIndex - maxDisplay + 1;
  }
  const displayCompletions = completions.slice(startIndex, startIndex + maxDisplay);

  return (
    <InkBox
      flexDirection="column"
      marginLeft={2}
      marginBottom={1}
      borderStyle="single"
      borderColor={palette.border}
      width={width}
    >
      {displayCompletions.map((completion, displayIndex) => {
        const actualIndex = startIndex + displayIndex;
        const isSelected = actualIndex === selectedIndex;
        return (
          <InkBox key={completion} paddingLeft={1} paddingRight={1}>
            <Text
              inverse={isSelected}
              color={isSelected ? palette.text : palette.textSecondary}
            >
              {isSelected ? '> ' : '  '}
              {completion}
            </Text>
          </InkBox>
        );
      })}
      {completions.length > maxDisplay && (
        <InkBox paddingLeft={1}>
          <Text color={palette.textMuted}>
            {startIndex > 0 ? '...' : '   '}
            {' '}
            {selectedIndex + 1}/{completions.length}
            {' '}
            {startIndex + maxDisplay < completions.length ? '...' : '   '}
          </Text>
        </InkBox>
      )}
    </InkBox>
  );
}

// Inline completion hint (ghost text)
export interface InlineCompletionProps {
  /** Current input value */
  input: string;
  /** Top completion suggestion */
  suggestion: string | null;
}

export function InlineCompletion({
  input,
  suggestion,
}: InlineCompletionProps): React.ReactElement | null {
  if (!suggestion || !suggestion.toLowerCase().startsWith(input.toLowerCase())) {
    return null;
  }

  // Show the remaining part of the suggestion as ghost text
  const remaining = suggestion.slice(input.length);

  return (
    <Text color={palette.textMuted}>{remaining}</Text>
  );
}
