/**
 * MetricRow Component
 *
 * Displays a label-value pair with consistent
 * spacing and alignment.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { padEnd, stripAnsi } from '../../design/borders.js';

export interface MetricRowProps {
  /** Label text */
  label: string;
  /** Value text */
  value: string | number;
  /** Label width for alignment */
  labelWidth?: number;
  /** Label color */
  labelColor?: string;
  /** Value color */
  valueColor?: string;
  /** Is this a financial value (for +/- coloring) */
  financial?: boolean;
  /** Financial value for coloring (if different from display value) */
  financialValue?: number;
  /** Suffix (e.g., %, B, M) */
  suffix?: string;
  /** Indent level */
  indent?: number;
}

export function MetricRow({
  label,
  value,
  labelWidth = 16,
  labelColor = palette.textSecondary,
  valueColor = palette.text,
  financial = false,
  financialValue,
  suffix = '',
  indent = 0,
}: MetricRowProps): React.ReactElement {
  // Format value
  const displayValue = typeof value === 'number' ? value.toString() : value;

  // Determine value color for financial values
  let finalValueColor = valueColor;
  if (financial) {
    const numValue = financialValue ?? (typeof value === 'number' ? value : parseFloat(displayValue));
    if (!isNaN(numValue)) {
      finalValueColor = numValue > 0 ? semantic.gain : numValue < 0 ? semantic.loss : semantic.unchanged;
    }
  }

  // Pad label for alignment
  const paddedLabel = label.padEnd(labelWidth);

  return (
    <InkBox marginLeft={indent}>
      <Text color={labelColor}>{paddedLabel}</Text>
      <Text color={finalValueColor}>{displayValue}{suffix}</Text>
    </InkBox>
  );
}

// Compact metric (smaller label width)
export function CompactMetric(props: Omit<MetricRowProps, 'labelWidth'>): React.ReactElement {
  return <MetricRow {...props} labelWidth={12} />;
}

// Wide metric (larger label width)
export function WideMetric(props: Omit<MetricRowProps, 'labelWidth'>): React.ReactElement {
  return <MetricRow {...props} labelWidth={20} />;
}

// Metric with unit
export interface MetricWithUnitProps extends MetricRowProps {
  unit: string;
}

export function MetricWithUnit({
  unit,
  value,
  ...props
}: MetricWithUnitProps): React.ReactElement {
  const displayValue = `${value} ${unit}`;
  return <MetricRow {...props} value={displayValue} />;
}

// Inline metrics (multiple on same line)
export interface InlineMetricsProps {
  metrics: Array<{ label: string; value: string | number; color?: string }>;
  separator?: string;
  labelColor?: string;
}

export function InlineMetrics({
  metrics,
  separator = '  ',
  labelColor = palette.textSecondary,
}: InlineMetricsProps): React.ReactElement {
  return (
    <InkBox>
      {metrics.map((metric, index) => (
        <React.Fragment key={metric.label}>
          {index > 0 && <Text color={palette.textMuted}>{separator}</Text>}
          <Text color={labelColor}>{metric.label}: </Text>
          <Text color={metric.color ?? palette.text}>{metric.value}</Text>
        </React.Fragment>
      ))}
    </InkBox>
  );
}

// Metric divider (for separating groups)
export function MetricDivider(): React.ReactElement {
  return (
    <InkBox marginTop={1} marginBottom={1}>
      <Text color={palette.border}>{'─'.repeat(30)}</Text>
    </InkBox>
  );
}
