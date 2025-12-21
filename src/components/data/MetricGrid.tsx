/**
 * MetricGrid Component
 *
 * Displays metrics in a grid layout with
 * consistent spacing and alignment.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { MetricRow } from './MetricRow.js';
import { palette } from '../../design/tokens.js';

export interface MetricItem {
  label: string;
  value: string | number;
  color?: string;
  financial?: boolean;
}

export interface MetricGridProps {
  /** Metrics to display */
  metrics: MetricItem[];
  /** Number of columns */
  columns?: number;
  /** Width of each column */
  columnWidth?: number;
  /** Label width within column */
  labelWidth?: number;
  /** Gap between columns */
  gap?: number;
}

export function MetricGrid({
  metrics,
  columns = 2,
  columnWidth = 35,
  labelWidth = 14,
  gap = 2,
}: MetricGridProps): React.ReactElement {
  // Split metrics into rows
  const rows: MetricItem[][] = [];
  for (let i = 0; i < metrics.length; i += columns) {
    rows.push(metrics.slice(i, i + columns));
  }

  return (
    <InkBox flexDirection="column">
      {rows.map((row, rowIndex) => (
        <InkBox key={rowIndex} flexDirection="row">
          {row.map((metric, colIndex) => (
            <InkBox key={metric.label} width={columnWidth} marginRight={colIndex < row.length - 1 ? gap : 0}>
              <MetricRow
                label={metric.label}
                value={metric.value}
                labelWidth={labelWidth}
                valueColor={metric.color}
                financial={metric.financial}
              />
            </InkBox>
          ))}
        </InkBox>
      ))}
    </InkBox>
  );
}

// Section with title and metrics
export interface MetricSectionProps {
  title: string;
  metrics: MetricItem[];
  columns?: number;
  columnWidth?: number;
}

export function MetricSection({
  title,
  metrics,
  columns = 2,
  columnWidth = 35,
}: MetricSectionProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginTop={1}>
      <InkBox marginBottom={1}>
        <Text color={palette.textSecondary} bold>{title}</Text>
      </InkBox>
      <MetricGrid metrics={metrics} columns={columns} columnWidth={columnWidth} />
    </InkBox>
  );
}

// Key-value list (single column)
export interface KeyValueListProps {
  items: MetricItem[];
  labelWidth?: number;
}

export function KeyValueList({
  items,
  labelWidth = 16,
}: KeyValueListProps): React.ReactElement {
  return (
    <InkBox flexDirection="column">
      {items.map((item) => (
        <MetricRow
          key={item.label}
          label={item.label}
          value={item.value}
          labelWidth={labelWidth}
          valueColor={item.color}
          financial={item.financial}
        />
      ))}
    </InkBox>
  );
}

// Horizontal stat bar (for quick numbers)
export interface StatBarProps {
  stats: Array<{ label: string; value: string | number; color?: string }>;
  separator?: string;
}

export function StatBar({
  stats,
  separator = '   ',
}: StatBarProps): React.ReactElement {
  return (
    <InkBox>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          {index > 0 && <Text color={palette.textMuted}>{separator}</Text>}
          <Text color={palette.textTertiary}>{stat.label} </Text>
          <Text color={stat.color ?? palette.text} bold>{stat.value}</Text>
        </React.Fragment>
      ))}
    </InkBox>
  );
}
