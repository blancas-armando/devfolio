/**
 * ASCIIChart Component
 *
 * Clean ASCII line chart with date labels on x-axis.
 * Uses asciichart library for smooth line rendering.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import asciichart from 'asciichart';
import { palette, semantic } from '../../design/tokens.js';

export interface DataPoint {
  date: Date;
  value: number;
}

export interface ASCIIChartProps {
  /** Data points with dates and values */
  data: DataPoint[];
  /** Chart width in characters */
  width?: number;
  /** Chart height in rows */
  height?: number;
  /** Show date axis labels */
  showDateAxis?: boolean;
  /** Chart title/label */
  label?: string;
  /** Color override (auto-detects trend if not provided) */
  color?: string;
}

// Block characters for sparklines
const BLOCKS = [' ', '\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588'];

// Format date for x-axis label
function formatDateLabel(date: Date, isStart: boolean, isEnd: boolean, totalDays: number): string {
  if (totalDays > 365) {
    // Multi-year: show year
    return date.toLocaleDateString('en-US', { year: 'numeric' });
  } else if (totalDays > 90) {
    // Multi-month: show month/year
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } else if (totalDays > 30) {
    // 1-3 months: show month/day
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    // Short range: show day
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  }
}

// Sample data to fit width
function sampleData(data: DataPoint[], targetWidth: number): DataPoint[] {
  if (data.length <= targetWidth) return data;

  const step = data.length / targetWidth;
  const sampled: DataPoint[] = [];

  for (let i = 0; i < targetWidth; i++) {
    const idx = Math.floor(i * step);
    sampled.push(data[idx]);
  }

  return sampled;
}

export function ASCIIChart({
  data,
  width = 50,
  height = 8,
  showDateAxis = true,
  label,
  color,
}: ASCIIChartProps): React.ReactElement {
  if (data.length < 2) {
    return (
      <InkBox>
        <Text color={palette.textTertiary}>Insufficient data for chart</Text>
      </InkBox>
    );
  }

  // Determine chart color based on trend
  const trend = data[data.length - 1].value - data[0].value;
  const chartColor = color ?? (trend >= 0 ? semantic.gain : semantic.loss);

  // Sample data to fit width
  const chartWidth = width - 10; // Reserve space for y-axis labels
  const sampledData = sampleData(data, chartWidth);
  const values = sampledData.map(d => d.value);

  // Calculate days span for date formatting
  const startDate = data[0].date;
  const endDate = data[data.length - 1].date;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Generate chart using asciichart library (clean smooth lines)
  const chart = asciichart.plot(values, {
    height,
    padding: '       ', // 7 spaces for y-axis alignment
    format: (x: number) => ('$' + x.toFixed(0)).padStart(6),
  });

  // Generate date axis
  const startLabel = formatDateLabel(startDate, true, false, totalDays);
  const endLabel = formatDateLabel(endDate, false, true, totalDays);
  const chartLines = chart.split('\n');
  const chartLineWidth = chartLines[0]?.length ?? chartWidth;
  const axisWidth = chartLineWidth - 7; // Subtract y-axis label space
  const padding = Math.max(0, axisWidth - startLabel.length - endLabel.length);
  const dateAxis = `${startLabel}${' '.repeat(padding)}${endLabel}`;

  return (
    <InkBox flexDirection="column">
      {label && (
        <InkBox marginBottom={1}>
          <Text color={palette.textSecondary}>{label}</Text>
        </InkBox>
      )}

      {/* Chart from asciichart library */}
      <Text color={chartColor}>{chart}</Text>

      {/* Date labels */}
      {showDateAxis && (
        <InkBox>
          <Text color={palette.textMuted}>{'       '}</Text>
          <Text color={palette.textTertiary}>{dateAxis}</Text>
        </InkBox>
      )}
    </InkBox>
  );
}

// Simplified sparkline with dates
export interface SparklineWithDatesProps {
  data: DataPoint[];
  width?: number;
  showRange?: boolean;
}

export function SparklineWithDates({
  data,
  width = 20,
  showRange = false,
}: SparklineWithDatesProps): React.ReactElement {
  if (data.length < 2) {
    return <Text color={palette.textMuted}>{'-'.repeat(width)}</Text>;
  }

  const trend = data[data.length - 1].value - data[0].value;
  const color = trend >= 0 ? semantic.gain : semantic.loss;

  const sampledData = sampleData(data, width);
  const values = sampledData.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const sparkline = sampledData.map(d => {
    const normalized = (d.value - min) / range;
    const idx = Math.floor(normalized * 7);
    return BLOCKS[idx + 1];
  }).join('');

  return (
    <InkBox>
      <Text color={color}>{sparkline}</Text>
      {showRange && (
        <>
          <Text color={palette.textMuted}> </Text>
          <Text color={palette.textTertiary}>
            ${min.toFixed(0)}-${max.toFixed(0)}
          </Text>
        </>
      )}
    </InkBox>
  );
}

export default ASCIIChart;
