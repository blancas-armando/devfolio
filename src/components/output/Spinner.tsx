/**
 * Spinner Component
 *
 * Loading indicators with braille animation
 * for a polished terminal experience.
 */

import React, { useState, useEffect } from 'react';
import { Box as InkBox, Text } from 'ink';
import { spinnerFrames, spinnerDots } from '../../design/symbols.js';
import { palette } from '../../design/tokens.js';

export type SpinnerType = 'braille' | 'dots' | 'simple';

export interface SpinnerProps {
  /** Spinner animation type */
  type?: SpinnerType;
  /** Label text shown next to spinner */
  label?: string;
  /** Spinner color */
  color?: string;
  /** Label color */
  labelColor?: string;
  /** Animation speed in ms */
  speed?: number;
}

const spinnerTypes: Record<SpinnerType, readonly string[]> = {
  braille: spinnerFrames,
  dots: spinnerDots,
  simple: ['-', '\\', '|', '/'],
};

export function Spinner({
  type = 'braille',
  label,
  color = palette.accent,
  labelColor = palette.textSecondary,
  speed = 80,
}: SpinnerProps): React.ReactElement {
  const frames = spinnerTypes[type];
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, speed);

    return () => clearInterval(timer);
  }, [frames.length, speed]);

  return (
    <InkBox>
      <Text color={color}>{frames[frameIndex]}</Text>
      {label && (
        <>
          <Text> </Text>
          <Text color={labelColor}>{label}</Text>
        </>
      )}
    </InkBox>
  );
}

// Indented spinner (for nested operations)
export interface IndentedSpinnerProps extends SpinnerProps {
  indent?: number;
}

export function IndentedSpinner({
  indent = 2,
  ...props
}: IndentedSpinnerProps): React.ReactElement {
  return (
    <InkBox marginLeft={indent}>
      <Spinner {...props} />
    </InkBox>
  );
}

// Processing indicator with operation name
export interface ProcessingIndicatorProps {
  /** What operation is in progress */
  operation: string;
  /** Spinner type */
  spinnerType?: SpinnerType;
}

export function ProcessingIndicator({
  operation,
  spinnerType = 'braille',
}: ProcessingIndicatorProps): React.ReactElement {
  return (
    <InkBox marginLeft={2} marginTop={1}>
      <Spinner type={spinnerType} label={operation} />
    </InkBox>
  );
}

// Inline loading state
export interface InlineLoadingProps {
  /** Whether loading is in progress */
  loading: boolean;
  /** Content to show when not loading */
  children: React.ReactNode;
  /** Loading message */
  message?: string;
}

export function InlineLoading({
  loading,
  children,
  message = 'Loading...',
}: InlineLoadingProps): React.ReactElement {
  if (loading) {
    return <Spinner label={message} />;
  }

  return <>{children}</>;
}

// Progress dots (for multi-step operations)
export interface ProgressDotsProps {
  /** Current step (0-indexed) */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Active color */
  activeColor?: string;
  /** Inactive color */
  inactiveColor?: string;
}

export function ProgressDots({
  currentStep,
  totalSteps,
  activeColor = palette.accent,
  inactiveColor = palette.textMuted,
}: ProgressDotsProps): React.ReactElement {
  return (
    <InkBox>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <Text
          key={i}
          color={i <= currentStep ? activeColor : inactiveColor}
        >
          {i <= currentStep ? '\u25CF' : '\u25CB'}
          {i < totalSteps - 1 ? ' ' : ''}
        </Text>
      ))}
    </InkBox>
  );
}
