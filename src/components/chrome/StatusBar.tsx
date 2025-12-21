/**
 * StatusBar Component
 *
 * Persistent footer showing keyboard hints,
 * model info, and context indicators.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { KeyHintGroup, keyHintPresets } from '../core/KeyHint.js';
import { palette } from '../../design/tokens.js';
import { width as widthConstants } from '../../design/spacing.js';

export interface StatusBarProps {
  /** Model name */
  modelName?: string;
  /** Current context (e.g., last viewed symbol) */
  context?: string;
  /** Whether processing is in progress */
  isProcessing?: boolean;
  /** Custom left content */
  leftContent?: React.ReactNode;
  /** Custom right content */
  rightContent?: React.ReactNode;
  /** Width */
  width?: number | 'compact' | 'standard' | 'full';
}

export function StatusBar({
  modelName = 'llama-3.3-70b',
  context,
  isProcessing = false,
  leftContent,
  rightContent,
  width = 'standard',
}: StatusBarProps): React.ReactElement {
  // Resolve width
  const resolvedWidth = typeof width === 'number'
    ? width
    : widthConstants[width];

  // Default left content: keyboard hints
  const defaultLeftContent = isProcessing ? (
    <KeyHintGroup hints={[keyHintPresets.cancel]} />
  ) : (
    <KeyHintGroup
      hints={[
        keyHintPresets.submit,
        keyHintPresets.tab,
      ]}
    />
  );

  // Default right content: model name and context
  const defaultRightContent = (
    <InkBox>
      {context && (
        <>
          <Text color={palette.textTertiary}>{context}</Text>
          <Text color={palette.textMuted}>  </Text>
        </>
      )}
      <Text color={palette.textTertiary}>{modelName}</Text>
    </InkBox>
  );

  return (
    <InkBox
      flexDirection="row"
      justifyContent="space-between"
      width={resolvedWidth}
      paddingLeft={1}
      paddingRight={1}
    >
      <InkBox>{leftContent ?? defaultLeftContent}</InkBox>
      <InkBox>{rightContent ?? defaultRightContent}</InkBox>
    </InkBox>
  );
}

// Minimal status bar (just hints)
export function MinimalStatusBar(): React.ReactElement {
  return (
    <InkBox marginTop={1}>
      <KeyHintGroup
        hints={[
          keyHintPresets.submit,
          keyHintPresets.tab,
          keyHintPresets.help,
        ]}
      />
    </InkBox>
  );
}

// Processing status bar
export interface ProcessingStatusBarProps {
  operation: string;
}

export function ProcessingStatusBar({
  operation,
}: ProcessingStatusBarProps): React.ReactElement {
  return (
    <InkBox
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
    >
      <InkBox>
        <Text color={palette.textTertiary}>Processing: </Text>
        <Text color={palette.textSecondary}>{operation}</Text>
      </InkBox>
      <KeyHintGroup hints={[keyHintPresets.cancel]} />
    </InkBox>
  );
}

// Full app footer with version
export interface AppFooterProps {
  version?: string;
  modelName?: string;
  isProcessing?: boolean;
  processingOperation?: string;
}

export function AppFooter({
  version = '0.2.0',
  modelName = 'llama-3.3-70b',
  isProcessing = false,
  processingOperation,
}: AppFooterProps): React.ReactElement {
  return (
    <InkBox
      flexDirection="row"
      justifyContent="space-between"
      marginTop={1}
    >
      {/* Left: version and status */}
      <InkBox>
        <Text color={palette.textMuted}>devfolio v{version}</Text>
        {isProcessing && processingOperation && (
          <>
            <Text color={palette.textMuted}>  </Text>
            <Text color={palette.accent}>{processingOperation}</Text>
          </>
        )}
      </InkBox>

      {/* Center: hints */}
      <InkBox>
        {isProcessing ? (
          <KeyHintGroup hints={[keyHintPresets.cancel]} />
        ) : (
          <KeyHintGroup
            hints={[
              keyHintPresets.tab,
              keyHintPresets.help,
            ]}
          />
        )}
      </InkBox>

      {/* Right: model */}
      <Text color={palette.textTertiary}>{modelName}</Text>
    </InkBox>
  );
}
