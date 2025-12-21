/**
 * KeyHint Component
 *
 * Displays keyboard shortcut hints like "enter send"
 * or "tab complete" in a subtle, consistent style.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette } from '../../design/tokens.js';

export interface KeyHintProps {
  /** The key or key combination */
  keyName: string;
  /** The action description */
  action: string;
  /** Color of the key */
  keyColor?: string;
  /** Color of the action */
  actionColor?: string;
}

export function KeyHint({
  keyName,
  action,
  keyColor = palette.textSecondary,
  actionColor = palette.textTertiary,
}: KeyHintProps): React.ReactElement {
  return (
    <InkBox>
      <Text color={keyColor}>{keyName}</Text>
      <Text color={actionColor}>{' '}{action}</Text>
    </InkBox>
  );
}

// Multiple key hints in a row
export interface KeyHintGroupProps {
  hints: Array<{ key: string; action: string }>;
  separator?: string;
  keyColor?: string;
  actionColor?: string;
}

export function KeyHintGroup({
  hints,
  separator = '   ',
  keyColor = palette.textSecondary,
  actionColor = palette.textTertiary,
}: KeyHintGroupProps): React.ReactElement {
  return (
    <InkBox>
      {hints.map((hint, index) => (
        <React.Fragment key={hint.key}>
          {index > 0 && <Text color={palette.textMuted}>{separator}</Text>}
          <KeyHint
            keyName={hint.key}
            action={hint.action}
            keyColor={keyColor}
            actionColor={actionColor}
          />
        </React.Fragment>
      ))}
    </InkBox>
  );
}

// Common key hint presets
export const keyHintPresets = {
  submit: { key: 'enter', action: 'send' },
  tab: { key: 'tab', action: 'complete' },
  history: { key: '↑↓', action: 'history' },
  cancel: { key: 'ctrl+c', action: 'cancel' },
  clear: { key: 'ctrl+l', action: 'clear' },
  escape: { key: 'esc', action: 'dismiss' },
  help: { key: '?', action: 'help' },
  quit: { key: 'q', action: 'quit' },
} as const;

// Default input hints
export function InputHints(): React.ReactElement {
  return (
    <KeyHintGroup
      hints={[
        keyHintPresets.submit,
        keyHintPresets.tab,
      ]}
    />
  );
}

// Extended input hints with more options
export function ExtendedInputHints(): React.ReactElement {
  return (
    <KeyHintGroup
      hints={[
        keyHintPresets.submit,
        keyHintPresets.tab,
        keyHintPresets.history,
        keyHintPresets.cancel,
      ]}
    />
  );
}

// Processing state hint
export function ProcessingHint(): React.ReactElement {
  return (
    <KeyHintGroup
      hints={[keyHintPresets.cancel]}
    />
  );
}
