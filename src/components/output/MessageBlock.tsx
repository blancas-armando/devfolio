/**
 * MessageBlock Component
 *
 * Displays a message in a bordered container
 * with role indicator and consistent styling.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { borderStyle, stripAnsi } from '../../design/borders.js';
import { palette } from '../../design/tokens.js';
import { width as widthConstants } from '../../design/spacing.js';

export type MessageRole = 'user' | 'assistant' | 'system' | 'error' | 'info';

export interface MessageBlockProps {
  children: React.ReactNode;
  /** Message role for styling */
  role?: MessageRole;
  /** Custom title (overrides role) */
  title?: string;
  /** Width of the block */
  width?: number | 'compact' | 'standard' | 'full';
  /** Show the border */
  showBorder?: boolean;
  /** Timestamp */
  timestamp?: Date;
}

const roleConfig: Record<MessageRole, { color: string; label: string }> = {
  user: { color: palette.textSecondary, label: 'you' },
  assistant: { color: palette.accent, label: 'assistant' },
  system: { color: palette.info, label: 'system' },
  error: { color: palette.negative, label: 'error' },
  info: { color: palette.info, label: 'info' },
};

export function MessageBlock({
  children,
  role = 'assistant',
  title,
  width = 'standard',
  showBorder = true,
  timestamp,
}: MessageBlockProps): React.ReactElement {
  // Resolve width
  const resolvedWidth = typeof width === 'number'
    ? width
    : widthConstants[width];

  const config = roleConfig[role];
  const displayTitle = title || config.label;

  // Format timestamp if provided
  const timeStr = timestamp
    ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  if (!showBorder) {
    // Simple indented message without border
    return (
      <InkBox flexDirection="column" marginTop={1} marginBottom={1}>
        <InkBox marginLeft={2} marginBottom={1}>
          <Text color={config.color} dimColor>{displayTitle}</Text>
          {timeStr && (
            <>
              <Text color={palette.textMuted}> </Text>
              <Text color={palette.textMuted} dimColor>{timeStr}</Text>
            </>
          )}
        </InkBox>
        <InkBox marginLeft={2} flexDirection="column">
          {children}
        </InkBox>
      </InkBox>
    );
  }

  const style = borderStyle.rounded;

  // Build title line
  const titleText = ` ${displayTitle} `;
  const titleLen = titleText.length;
  const rightSpace = timeStr ? ` ${timeStr} ` : '';
  const rightLen = rightSpace.length;
  const lineLen = Math.max(0, resolvedWidth - 2 - 1 - titleLen - rightLen);

  return (
    <InkBox flexDirection="column" marginTop={1} marginBottom={1}>
      {/* Top border with title */}
      <Text>
        <Text color={palette.border}>{style.topLeft}</Text>
        <Text color={palette.border}>{style.horizontal}</Text>
        <Text color={config.color}>{displayTitle}</Text>
        <Text color={palette.border}>
          {style.horizontal.repeat(lineLen)}
        </Text>
        {timeStr && <Text color={palette.textMuted}>{timeStr}</Text>}
        <Text color={palette.border}>{style.topRight}</Text>
      </Text>

      {/* Content with side borders */}
      <InkBox flexDirection="row" width={resolvedWidth}>
        <Text color={palette.border}>{style.vertical}</Text>
        <InkBox
          flexDirection="column"
          width={resolvedWidth - 4}
          paddingLeft={1}
          paddingRight={1}
        >
          {children}
        </InkBox>
        <Text color={palette.border}>{style.vertical}</Text>
      </InkBox>

      {/* Bottom border */}
      <Text color={palette.border}>
        {style.bottomLeft}
        {style.horizontal.repeat(resolvedWidth - 2)}
        {style.bottomRight}
      </Text>
    </InkBox>
  );
}

// User message (simpler styling)
export interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps): React.ReactElement {
  return (
    <InkBox marginTop={1} marginLeft={2}>
      <Text color={palette.accent} bold>{'> '}</Text>
      <Text color={palette.text}>{content}</Text>
    </InkBox>
  );
}

// Command echo (shows what command was run)
export interface CommandEchoProps {
  command: string;
}

export function CommandEcho({ command }: CommandEchoProps): React.ReactElement {
  return (
    <InkBox marginTop={1}>
      <Text color={palette.textMuted}>{'> '}</Text>
      <Text color={palette.textSecondary}>{command}</Text>
    </InkBox>
  );
}

// Error message block
export interface ErrorMessageProps {
  message: string;
  suggestions?: string[];
  tryCommands?: string[];
}

export function ErrorMessage({
  message,
  suggestions,
  tryCommands,
}: ErrorMessageProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginTop={1} marginBottom={1} marginLeft={2}>
      <Text color={palette.negative}>Error: {message}</Text>

      {suggestions && suggestions.length > 0 && (
        <InkBox flexDirection="column" marginTop={1}>
          <Text color={palette.textTertiary}>Suggestions:</Text>
          {suggestions.map((s, i) => (
            <InkBox key={i} marginLeft={2}>
              <Text color={palette.textTertiary}>- {s}</Text>
            </InkBox>
          ))}
        </InkBox>
      )}

      {tryCommands && tryCommands.length > 0 && (
        <InkBox flexDirection="column" marginTop={1}>
          <Text color={palette.textTertiary}>Try:</Text>
          {tryCommands.map((cmd, i) => (
            <InkBox key={i} marginLeft={2}>
              <Text color={palette.accent}>{cmd}</Text>
            </InkBox>
          ))}
        </InkBox>
      )}
    </InkBox>
  );
}

// Success message
export interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps): React.ReactElement {
  return (
    <InkBox marginTop={1} marginLeft={2}>
      <Text color={palette.positive}>{'\u2713'} {message}</Text>
    </InkBox>
  );
}

// Warning message
export interface WarningMessageProps {
  message: string;
}

export function WarningMessage({ message }: WarningMessageProps): React.ReactElement {
  return (
    <InkBox marginTop={1} marginLeft={2}>
      <Text color={palette.warning}>{'\u26A0'} {message}</Text>
    </InkBox>
  );
}

// Common error factories for consistent error handling
export const CommonErrors = {
  symbolNotFound: (symbol: string): ErrorMessageProps => ({
    message: `Symbol '${symbol}' not found`,
    suggestions: [
      'Check the symbol spelling',
      'Make sure it\'s a valid stock or ETF ticker',
    ],
    tryCommands: [
      `search ${symbol}`,
      'screen tech',
    ],
  }),

  networkError: (detail?: string): ErrorMessageProps => ({
    message: detail || 'Network request failed',
    suggestions: [
      'Check your internet connection',
      'The data provider may be temporarily unavailable',
    ],
    tryCommands: ['pulse'],
  }),

  apiKeyMissing: (): ErrorMessageProps => ({
    message: 'GROQ_API_KEY environment variable not set',
    suggestions: [
      'AI features require a Groq API key',
      'Get one free at https://console.groq.com',
    ],
    tryCommands: [
      'export GROQ_API_KEY=your_key_here',
      's AAPL',
    ],
  }),

  rateLimited: (): ErrorMessageProps => ({
    message: 'Rate limit exceeded',
    suggestions: [
      'Too many requests in a short time',
      'Wait a moment before trying again',
    ],
  }),

  invalidCommand: (input: string): ErrorMessageProps => ({
    message: `Unknown command: '${input}'`,
    suggestions: ['Check command spelling'],
    tryCommands: [
      'help',
      `s ${input}`,
    ],
  }),

  noData: (context: string): ErrorMessageProps => ({
    message: `No data available for ${context}`,
    suggestions: [
      'The data may not be available from the provider',
      'Try a different symbol or timeframe',
    ],
  }),
};
