/**
 * Progress Components
 *
 * Progress bars and step indicators for
 * tracking multi-step operations.
 */

import React, { useState, useEffect } from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { timing } from '../../design/timing.js';
import { progress as progressChars, status, bullets } from '../../design/symbols.js';
import type { StepStatus } from '../../design/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Progress Bar Component
// ═══════════════════════════════════════════════════════════════════════════

export interface ProgressBarProps {
  /** Current value */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Width in characters */
  width?: number;
  /** Show percentage label */
  showPercent?: boolean;
  /** Show value label (value/max) */
  showValue?: boolean;
  /** Bar color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Label text */
  label?: string;
  /** Animate the fill */
  animate?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  width = 30,
  showPercent = true,
  showValue = false,
  color = palette.accent,
  backgroundColor = palette.textMuted,
  label,
  animate = false,
}: ProgressBarProps): React.ReactElement {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    // Animate to target value
    const step = Math.max(1, Math.ceil((value - displayValue) / 10));
    if (displayValue < value) {
      const timer = setTimeout(() => {
        setDisplayValue(prev => Math.min(value, prev + step));
      }, timing.transitionFast);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue, animate]);

  const ratio = Math.min(1, Math.max(0, displayValue / max));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const percent = Math.round(ratio * 100);

  return (
    <InkBox>
      {label && (
        <InkBox marginRight={1}>
          <Text color={palette.textSecondary}>{label}</Text>
        </InkBox>
      )}
      <Text color={color}>{progressChars.full.repeat(filled)}</Text>
      <Text color={backgroundColor}>{progressChars.empty.repeat(empty)}</Text>
      {showPercent && (
        <Text color={palette.textSecondary}> {percent}%</Text>
      )}
      {showValue && (
        <Text color={palette.textSecondary}> {displayValue}/{max}</Text>
      )}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Indeterminate Progress Bar
// ═══════════════════════════════════════════════════════════════════════════

export interface IndeterminateProgressProps {
  /** Width in characters */
  width?: number;
  /** Bar color */
  color?: string;
  /** Animation speed */
  speed?: number;
  /** Label text */
  label?: string;
}

export function IndeterminateProgress({
  width = 30,
  color = palette.accent,
  speed = timing.spinnerNormal,
  label,
}: IndeterminateProgressProps): React.ReactElement {
  const [position, setPosition] = useState(0);
  const markerWidth = 6;

  useEffect(() => {
    const timer = setInterval(() => {
      setPosition(prev => (prev + 1) % (width - markerWidth + 1));
    }, speed);

    return () => clearInterval(timer);
  }, [width, speed]);

  const before = progressChars.empty.repeat(position);
  const marker = progressChars.full.repeat(markerWidth);
  const after = progressChars.empty.repeat(Math.max(0, width - position - markerWidth));

  return (
    <InkBox>
      {label && (
        <InkBox marginRight={1}>
          <Text color={palette.textSecondary}>{label}</Text>
        </InkBox>
      )}
      <Text color={palette.textMuted}>{before}</Text>
      <Text color={color}>{marker}</Text>
      <Text color={palette.textMuted}>{after}</Text>
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Step Progress Component
// ═══════════════════════════════════════════════════════════════════════════

export interface Step {
  /** Step label */
  label: string;
  /** Step status */
  status: StepStatus;
  /** Optional description */
  description?: string;
}

export interface StepProgressProps {
  /** Steps to display */
  steps: Step[];
  /** Compact mode (inline) */
  compact?: boolean;
  /** Show step numbers */
  showNumbers?: boolean;
}

const stepStatusIcons: Record<StepStatus, string> = {
  pending: bullets.circleEmpty,
  active: bullets.circle,
  complete: status.check,
  error: status.cross,
  skipped: bullets.dash,
};

const stepStatusColors: Record<StepStatus, string> = {
  pending: palette.textMuted,
  active: palette.accent,
  complete: semantic.success,
  error: semantic.error,
  skipped: palette.textMuted,
};

export function StepProgress({
  steps,
  compact = false,
  showNumbers = true,
}: StepProgressProps): React.ReactElement {
  const currentStep = steps.findIndex(s => s.status === 'active');
  const totalSteps = steps.length;

  if (compact) {
    // Inline compact view: [====>      ] Step 2/4: Label
    const completedSteps = steps.filter(s => s.status === 'complete').length;
    const activeStep = steps.find(s => s.status === 'active');
    const displayStep = currentStep >= 0 ? currentStep + 1 : completedSteps;

    return (
      <InkBox>
        <ProgressBar
          value={completedSteps}
          max={totalSteps}
          width={20}
          showPercent={false}
        />
        <Text color={palette.textSecondary}>
          {' '}{displayStep}/{totalSteps}
        </Text>
        {activeStep && (
          <Text color={palette.text}>: {activeStep.label}</Text>
        )}
      </InkBox>
    );
  }

  // Vertical detailed view
  return (
    <InkBox flexDirection="column">
      {steps.map((step, index) => (
        <InkBox key={index}>
          <Text color={stepStatusColors[step.status]}>
            {showNumbers ? `${index + 1}. ` : ''}{stepStatusIcons[step.status]}
          </Text>
          <Text> </Text>
          <Text
            color={step.status === 'active' ? palette.text : stepStatusColors[step.status]}
            bold={step.status === 'active'}
          >
            {step.label}
          </Text>
          {step.description && step.status === 'active' && (
            <Text color={palette.textTertiary}> - {step.description}</Text>
          )}
        </InkBox>
      ))}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Operation Progress Component
// ═══════════════════════════════════════════════════════════════════════════

export interface OperationProgressProps {
  /** Operation name */
  operation: string;
  /** Current step */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Current step label */
  stepLabel?: string;
  /** Show elapsed time */
  showElapsed?: boolean;
  /** Start time (for elapsed calculation) */
  startTime?: number;
}

export function OperationProgress({
  operation,
  currentStep,
  totalSteps,
  stepLabel,
  showElapsed = false,
  startTime,
}: OperationProgressProps): React.ReactElement {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!showElapsed || !startTime) return;

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [showElapsed, startTime]);

  const formatElapsed = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <InkBox flexDirection="column">
      <InkBox>
        <Text bold color={palette.text}>{operation}</Text>
        {showElapsed && elapsed > 0 && (
          <Text color={palette.textTertiary}> ({formatElapsed(elapsed)})</Text>
        )}
      </InkBox>
      <InkBox marginTop={0}>
        <ProgressBar
          value={currentStep}
          max={totalSteps}
          width={40}
          showPercent
        />
      </InkBox>
      {stepLabel && (
        <InkBox marginTop={0}>
          <Text color={palette.textSecondary}>
            Step {currentStep}/{totalSteps}: {stepLabel}
          </Text>
        </InkBox>
      )}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Mini Progress Indicator
// ═══════════════════════════════════════════════════════════════════════════

export interface MiniProgressProps {
  /** Current value */
  value: number;
  /** Maximum value */
  max: number;
  /** Color */
  color?: string;
}

export function MiniProgress({
  value,
  max,
  color = palette.accent,
}: MiniProgressProps): React.ReactElement {
  const ratio = Math.min(1, Math.max(0, value / max));
  const index = Math.min(
    Math.floor(ratio * 8),
    7
  );

  const blocks = [
    progressChars.empty,
    progressChars.veryLow,
    progressChars.low,
    progressChars.medLow,
    progressChars.med,
    progressChars.medHigh,
    progressChars.high,
    progressChars.full,
  ];

  return <Text color={color}>{blocks[index]}</Text>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Download/Upload Progress
// ═══════════════════════════════════════════════════════════════════════════

export interface TransferProgressProps {
  /** Bytes transferred */
  transferred: number;
  /** Total bytes */
  total: number;
  /** Transfer type */
  type?: 'download' | 'upload';
  /** File name */
  fileName?: string;
}

export function TransferProgress({
  transferred,
  total,
  type = 'download',
  fileName,
}: TransferProgressProps): React.ReactElement {
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const icon = type === 'download' ? '\u2193' : '\u2191'; // ↓ or ↑

  return (
    <InkBox flexDirection="column">
      <InkBox>
        <Text color={palette.accent}>{icon}</Text>
        <Text> </Text>
        {fileName && (
          <Text color={palette.text}>{fileName}</Text>
        )}
      </InkBox>
      <InkBox>
        <ProgressBar value={transferred} max={total} width={30} showPercent />
        <Text color={palette.textSecondary}>
          {' '}{formatBytes(transferred)} / {formatBytes(total)}
        </Text>
      </InkBox>
    </InkBox>
  );
}
