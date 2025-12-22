/**
 * ValidationError Component
 *
 * Display validation errors with field context
 * and suggestions for fixing issues.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { status, bullets, arrows } from '../../design/symbols.js';
import { borders, drawTop, drawBottom } from '../../design/borders.js';
import type { FieldError, ValidationResult } from '../../design/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Single Field Error Component
// ═══════════════════════════════════════════════════════════════════════════

export interface FieldErrorDisplayProps {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Optional error code */
  code?: string;
  /** Suggestion for fixing */
  suggestion?: string;
  /** Show field prefix */
  showField?: boolean;
}

export function FieldErrorDisplay({
  field,
  message,
  code,
  suggestion,
  showField = true,
}: FieldErrorDisplayProps): React.ReactElement {
  return (
    <InkBox flexDirection="column">
      <InkBox>
        <Text color={semantic.error}>{status.cross} </Text>
        {showField && (
          <Text color={palette.text} bold>{field}: </Text>
        )}
        <Text color={semantic.error}>{message}</Text>
        {code && (
          <Text color={palette.textMuted}> [{code}]</Text>
        )}
      </InkBox>
      {suggestion && (
        <InkBox marginLeft={2}>
          <Text color={palette.textTertiary}>
            {arrows.right} {suggestion}
          </Text>
        </InkBox>
      )}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Error List Component
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationErrorListProps {
  /** List of errors */
  errors: FieldError[];
  /** Title for the error block */
  title?: string;
  /** Compact mode */
  compact?: boolean;
}

export function ValidationErrorList({
  errors,
  title = 'Validation Errors',
  compact = false,
}: ValidationErrorListProps): React.ReactElement {
  if (errors.length === 0) return <></>;

  if (compact) {
    return (
      <InkBox flexDirection="column">
        {errors.map((error, i) => (
          <InkBox key={i}>
            <Text color={semantic.error}>{status.cross} </Text>
            <Text color={palette.textSecondary}>{error.field}: </Text>
            <Text color={semantic.error}>{error.message}</Text>
          </InkBox>
        ))}
      </InkBox>
    );
  }

  return (
    <InkBox flexDirection="column">
      <Text color={semantic.error} bold>
        {status.warning} {title} ({errors.length})
      </Text>
      <InkBox flexDirection="column" marginTop={1} marginLeft={2}>
        {errors.map((error, i) => (
          <FieldErrorDisplay
            key={i}
            field={error.field}
            message={error.message}
            code={error.code}
            suggestion={error.suggestion}
          />
        ))}
      </InkBox>
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Inline Validation Component
// ═══════════════════════════════════════════════════════════════════════════

export interface InlineValidationProps {
  /** Field name */
  field: string;
  /** Current value */
  value: string;
  /** Error message (if invalid) */
  error?: string;
  /** Success message (if valid) */
  success?: string;
  /** Hint text */
  hint?: string;
}

export function InlineValidation({
  field,
  value,
  error,
  success,
  hint,
}: InlineValidationProps): React.ReactElement {
  const hasError = !!error;
  const isValid = !error && value.length > 0 && success;

  return (
    <InkBox flexDirection="column">
      <InkBox>
        <Text color={palette.textSecondary}>{field}: </Text>
        <Text color={hasError ? semantic.error : palette.text}>{value || '(empty)'}</Text>
        {isValid && (
          <Text color={semantic.success}> {status.check}</Text>
        )}
        {hasError && (
          <Text color={semantic.error}> {status.cross}</Text>
        )}
      </InkBox>
      {error && (
        <InkBox marginLeft={2}>
          <Text color={semantic.error}>{error}</Text>
        </InkBox>
      )}
      {isValid && success && (
        <InkBox marginLeft={2}>
          <Text color={semantic.success}>{success}</Text>
        </InkBox>
      )}
      {!error && !success && hint && (
        <InkBox marginLeft={2}>
          <Text color={palette.textTertiary}>{hint}</Text>
        </InkBox>
      )}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Summary Component
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationSummaryProps {
  /** Validation result */
  result: ValidationResult;
  /** Width for bordered display */
  width?: number;
  /** Show border */
  bordered?: boolean;
}

export function ValidationSummary({
  result,
  width = 60,
  bordered = false,
}: ValidationSummaryProps): React.ReactElement {
  if (result.valid) {
    const content = (
      <InkBox paddingX={1} paddingY={bordered ? 1 : 0}>
        <Text color={semantic.success}>{status.check} Validation passed</Text>
      </InkBox>
    );

    if (!bordered) return content;

    return (
      <InkBox flexDirection="column">
        <Text color={palette.border}>{drawTop(width)}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <InkBox width={width - 2}>{content}</InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <Text color={palette.border}>{drawBottom(width)}</Text>
      </InkBox>
    );
  }

  const content = (
    <InkBox flexDirection="column" paddingX={1} paddingY={bordered ? 1 : 0}>
      <Text color={semantic.error} bold>
        {status.cross} {result.errors.length} validation error{result.errors.length !== 1 ? 's' : ''}
      </Text>
      <InkBox flexDirection="column" marginTop={1}>
        {result.errors.map((error, i) => (
          <InkBox key={i}>
            <Text color={palette.textMuted}>{bullets.bullet} </Text>
            <Text color={palette.text}>{error.field}</Text>
            <Text color={palette.textTertiary}>: </Text>
            <Text color={semantic.error}>{error.message}</Text>
          </InkBox>
        ))}
      </InkBox>
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
// Input Error Component (for forms)
// ═══════════════════════════════════════════════════════════════════════════

export interface InputErrorProps {
  /** Error message */
  message: string;
  /** Suggestions for valid input */
  validExamples?: string[];
}

export function InputError({
  message,
  validExamples = [],
}: InputErrorProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginTop={1}>
      <InkBox>
        <Text color={semantic.error}>{status.cross} {message}</Text>
      </InkBox>
      {validExamples.length > 0 && (
        <InkBox marginTop={1} marginLeft={2} flexDirection="column">
          <Text color={palette.textSecondary}>Valid examples:</Text>
          {validExamples.map((example, i) => (
            <InkBox key={i} marginLeft={2}>
              <Text color={palette.textTertiary}>{bullets.bullet} </Text>
              <Text color={semantic.command}>{example}</Text>
            </InkBox>
          ))}
        </InkBox>
      )}
    </InkBox>
  );
}
