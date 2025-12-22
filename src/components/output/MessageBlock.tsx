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

// ═══════════════════════════════════════════════════════════════════════════
// Enhanced Error Message with Recovery Actions
// ═══════════════════════════════════════════════════════════════════════════

export interface RecoveryAction {
  label: string;
  command: string;
  description?: string;
  primary?: boolean;
}

export interface EnhancedErrorMessageProps {
  /** Main error message */
  message: string;
  /** Error code for reference */
  code?: string;
  /** Detailed explanation */
  details?: string;
  /** Suggestions for resolution */
  suggestions?: string[];
  /** Recovery actions with commands */
  actions?: RecoveryAction[];
  /** Severity level */
  severity?: 'error' | 'warning' | 'info';
  /** Width of the error block */
  width?: number;
  /** Show border */
  bordered?: boolean;
}

const severityConfig = {
  error: { color: palette.negative, icon: '\u2717', label: 'Error' },
  warning: { color: palette.warning, icon: '\u26A0', label: 'Warning' },
  info: { color: palette.info, icon: '\u2139', label: 'Info' },
};

export function EnhancedErrorMessage({
  message,
  code,
  details,
  suggestions = [],
  actions = [],
  severity = 'error',
  width = 60,
  bordered = true,
}: EnhancedErrorMessageProps): React.ReactElement {
  const config = severityConfig[severity];
  const style = borderStyle.rounded;
  const innerWidth = width - 4;

  const content = (
    <InkBox flexDirection="column" paddingX={bordered ? 1 : 0} paddingY={bordered ? 1 : 0}>
      {/* Header */}
      <InkBox>
        <Text color={config.color}>{config.icon} </Text>
        <Text color={palette.text}>{message}</Text>
        {code && (
          <Text color={palette.textMuted}> [{code}]</Text>
        )}
      </InkBox>

      {/* Details */}
      {details && (
        <InkBox marginTop={1}>
          <Text color={palette.textTertiary}>{details}</Text>
        </InkBox>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <InkBox flexDirection="column" marginTop={1}>
          {suggestions.map((suggestion, i) => (
            <InkBox key={i}>
              <Text color={palette.textMuted}>{'\u2022'} </Text>
              <Text color={palette.textSecondary}>{suggestion}</Text>
            </InkBox>
          ))}
        </InkBox>
      )}

      {/* Recovery actions */}
      {actions.length > 0 && (
        <InkBox flexDirection="column" marginTop={1}>
          <Text color={palette.textSecondary}>Recovery options:</Text>
          {actions.map((action, i) => (
            <InkBox key={i} marginLeft={2}>
              <Text color={palette.textMuted}>[{i + 1}] </Text>
              <Text color={action.primary ? palette.accent : palette.text}>
                {action.command}
              </Text>
              {action.description && (
                <Text color={palette.textTertiary}> - {action.description}</Text>
              )}
            </InkBox>
          ))}
        </InkBox>
      )}
    </InkBox>
  );

  if (!bordered) return content;

  return (
    <InkBox flexDirection="column" marginTop={1} marginBottom={1}>
      {/* Top border with severity label */}
      <Text>
        <Text color={config.color}>{style.topLeft}</Text>
        <Text color={config.color}>{style.horizontal}</Text>
        <Text color={config.color}>{config.label}</Text>
        <Text color={config.color}>
          {style.horizontal.repeat(Math.max(0, width - config.label.length - 4))}
        </Text>
        <Text color={config.color}>{style.topRight}</Text>
      </Text>

      {/* Content */}
      <InkBox flexDirection="row">
        <Text color={config.color}>{style.vertical}</Text>
        <InkBox width={innerWidth}>{content}</InkBox>
        <Text color={config.color}>{style.vertical}</Text>
      </InkBox>

      {/* Bottom border */}
      <Text color={config.color}>
        {style.bottomLeft}
        {style.horizontal.repeat(width - 2)}
        {style.bottomRight}
      </Text>
    </InkBox>
  );
}

// Enhanced error factories
export const EnhancedErrors = {
  symbolNotFound: (symbol: string): EnhancedErrorMessageProps => ({
    message: `Symbol '${symbol}' not found`,
    severity: 'error',
    suggestions: [
      'Check the symbol spelling',
      'Make sure it\'s a valid stock or ETF ticker',
    ],
    actions: [
      { label: 'Search', command: `search ${symbol}`, description: 'Search similar symbols', primary: true },
      { label: 'Browse', command: 'screen tech', description: 'Browse tech stocks' },
    ],
  }),

  networkError: (detail?: string): EnhancedErrorMessageProps => ({
    message: detail || 'Network request failed',
    severity: 'error',
    details: 'Unable to connect to the data provider.',
    suggestions: [
      'Check your internet connection',
      'The service may be temporarily unavailable',
    ],
    actions: [
      { label: 'Retry', command: 'retry', primary: true },
      { label: 'Status', command: 'pulse', description: 'Check system status' },
    ],
  }),

  apiKeyMissing: (provider = 'AI'): EnhancedErrorMessageProps => ({
    message: `${provider} API key not configured`,
    code: 'API_KEY_MISSING',
    severity: 'warning',
    details: 'AI features require an API key to function.',
    actions: [
      { label: 'Setup', command: 'setup', description: 'Configure API keys', primary: true },
    ],
  }),

  rateLimited: (waitSeconds?: number): EnhancedErrorMessageProps => ({
    message: 'Rate limit exceeded',
    code: 'RATE_LIMIT',
    severity: 'warning',
    details: waitSeconds
      ? `Please wait ${waitSeconds} seconds before trying again.`
      : 'Too many requests in a short time.',
    suggestions: ['Wait a moment before retrying'],
  }),

  invalidInput: (field: string, reason: string): EnhancedErrorMessageProps => ({
    message: `Invalid ${field}`,
    severity: 'error',
    details: reason,
    actions: [
      { label: 'Help', command: 'help', description: 'View available commands', primary: true },
    ],
  }),
};
