/**
 * RetryBlock Component
 *
 * Error recovery UI with retry options
 * and alternative actions.
 */

import React, { useState, useEffect } from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { timing } from '../../design/timing.js';
import { status, bullets, arrows } from '../../design/symbols.js';
import { borders, drawTop, drawBottom } from '../../design/borders.js';
import type { RecoveryAction } from '../../design/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// RetryBlock Component
// ═══════════════════════════════════════════════════════════════════════════

export interface RetryBlockProps {
  /** Error message */
  message: string;
  /** Error details or cause */
  details?: string;
  /** Recovery actions */
  actions?: RecoveryAction[];
  /** Number of retries attempted */
  retryCount?: number;
  /** Maximum retries before giving up */
  maxRetries?: number;
  /** Auto-retry countdown (seconds) */
  autoRetryIn?: number;
  /** Called when auto-retry triggers */
  onAutoRetry?: () => void;
  /** Component width */
  width?: number;
  /** Show border */
  bordered?: boolean;
}

export function RetryBlock({
  message,
  details,
  actions = [],
  retryCount = 0,
  maxRetries = 3,
  autoRetryIn,
  onAutoRetry,
  width = 60,
  bordered = true,
}: RetryBlockProps): React.ReactElement {
  const [countdown, setCountdown] = useState(autoRetryIn || 0);

  useEffect(() => {
    if (!autoRetryIn || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onAutoRetry?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRetryIn, countdown, onAutoRetry]);

  const canRetry = retryCount < maxRetries;
  const retriesLeft = maxRetries - retryCount;

  const content = (
    <InkBox flexDirection="column" paddingX={bordered ? 1 : 0} paddingY={bordered ? 1 : 0}>
      {/* Error header */}
      <InkBox>
        <Text color={semantic.error}>{status.cross} </Text>
        <Text color={palette.text}>{message}</Text>
      </InkBox>

      {/* Details */}
      {details && (
        <InkBox marginTop={1} marginLeft={2}>
          <Text color={palette.textTertiary}>{details}</Text>
        </InkBox>
      )}

      {/* Retry status */}
      {retryCount > 0 && (
        <InkBox marginTop={1}>
          <Text color={palette.textSecondary}>
            {canRetry
              ? `Attempt ${retryCount}/${maxRetries} failed. ${retriesLeft} ${retriesLeft === 1 ? 'retry' : 'retries'} remaining.`
              : `All ${maxRetries} attempts failed.`}
          </Text>
        </InkBox>
      )}

      {/* Auto-retry countdown */}
      {countdown > 0 && (
        <InkBox marginTop={1}>
          <Text color={palette.accent}>
            {arrows.right} Retrying in {countdown}s...
          </Text>
        </InkBox>
      )}

      {/* Recovery actions */}
      {actions.length > 0 && (
        <InkBox flexDirection="column" marginTop={1}>
          <Text color={palette.textSecondary}>Recovery options:</Text>
          {actions.map((action, i) => (
            <InkBox key={i} marginLeft={2}>
              <Text color={palette.textMuted}>[{i + 1}] </Text>
              <Text color={action.primary ? semantic.command : palette.text}>
                {action.command || action.label}
              </Text>
              {action.description && (
                <Text color={palette.textTertiary}> - {action.description}</Text>
              )}
            </InkBox>
          ))}
        </InkBox>
      )}

      {/* No retry available message */}
      {!canRetry && actions.length === 0 && (
        <InkBox marginTop={1}>
          <Text color={palette.textSecondary}>
            Please check your connection or try again later.
          </Text>
        </InkBox>
      )}
    </InkBox>
  );

  if (!bordered) return content;

  return (
    <InkBox flexDirection="column">
      <Text color={semantic.error}>{drawTop(width)}</Text>
      <InkBox>
        <Text color={semantic.error}>{borders.vertical}</Text>
        <InkBox width={width - 2}>{content}</InkBox>
        <Text color={semantic.error}>{borders.vertical}</Text>
      </InkBox>
      <Text color={semantic.error}>{drawBottom(width)}</Text>
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NetworkError Component
// ═══════════════════════════════════════════════════════════════════════════

export interface NetworkErrorProps {
  /** Error type */
  type?: 'connection' | 'timeout' | 'server' | 'unknown';
  /** Service name that failed */
  service?: string;
  /** HTTP status code if available */
  statusCode?: number;
  /** Show retry command */
  showRetryCommand?: boolean;
  /** Retry command to show */
  retryCommand?: string;
}

export function NetworkError({
  type = 'unknown',
  service,
  statusCode,
  showRetryCommand = true,
  retryCommand = 'retry',
}: NetworkErrorProps): React.ReactElement {
  const messages: Record<string, { title: string; detail: string }> = {
    connection: {
      title: 'Connection failed',
      detail: 'Unable to reach the server. Check your internet connection.',
    },
    timeout: {
      title: 'Request timed out',
      detail: 'The server took too long to respond. Try again.',
    },
    server: {
      title: 'Server error',
      detail: statusCode
        ? `The server returned an error (${statusCode}).`
        : 'The server encountered an error.',
    },
    unknown: {
      title: 'Network error',
      detail: 'An unexpected error occurred. Please try again.',
    },
  };

  const { title, detail } = messages[type];

  const actions: RecoveryAction[] = [];
  if (showRetryCommand) {
    actions.push({
      label: 'Retry',
      command: retryCommand,
      type: 'retry',
      primary: true,
    });
  }

  return (
    <RetryBlock
      message={service ? `${title}: ${service}` : title}
      details={detail}
      actions={actions}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// API Error Component
// ═══════════════════════════════════════════════════════════════════════════

export interface APIErrorProps {
  /** API name or endpoint */
  api: string;
  /** Error code */
  errorCode?: string;
  /** Error message */
  message: string;
  /** Whether this is a rate limit error */
  isRateLimit?: boolean;
  /** Wait time for rate limit (seconds) */
  waitTime?: number;
}

export function APIError({
  api,
  errorCode,
  message,
  isRateLimit = false,
  waitTime,
}: APIErrorProps): React.ReactElement {
  const actions: RecoveryAction[] = [];

  if (isRateLimit) {
    return (
      <RetryBlock
        message={`Rate limited: ${api}`}
        details={waitTime
          ? `Too many requests. Please wait ${waitTime} seconds.`
          : 'Too many requests. Please wait before trying again.'}
        autoRetryIn={waitTime}
        bordered
      />
    );
  }

  return (
    <RetryBlock
      message={`API Error: ${api}`}
      details={errorCode ? `${message} (${errorCode})` : message}
      actions={[
        { label: 'Retry', command: 'retry', type: 'retry', primary: true },
        { label: 'Check setup', command: 'setup', type: 'help' },
      ]}
      bordered
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// InlineRetry Component
// ═══════════════════════════════════════════════════════════════════════════

export interface InlineRetryProps {
  /** Error message */
  message: string;
  /** Retry command */
  retryCommand?: string;
  /** Current retry count */
  retryCount?: number;
}

export function InlineRetry({
  message,
  retryCommand = 'retry',
  retryCount = 0,
}: InlineRetryProps): React.ReactElement {
  return (
    <InkBox>
      <Text color={semantic.error}>{status.cross} {message}</Text>
      {retryCount > 0 && (
        <Text color={palette.textTertiary}> (attempt {retryCount})</Text>
      )}
      <Text color={palette.textSecondary}> - </Text>
      <Text color={semantic.command}>{retryCommand}</Text>
    </InkBox>
  );
}
