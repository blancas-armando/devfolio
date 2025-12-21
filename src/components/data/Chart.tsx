/**
 * Chart Component
 *
 * ASCII chart wrapper using asciichart library.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import asciichart from 'asciichart';
import { palette, semantic } from '../../design/tokens.js';
import { generateSparkline } from '../../design/symbols.js';

export interface ChartProps {
  /** Data points */
  data: number[];
  /** Chart width (used to sample data) */
  width?: number;
  /** Chart height in rows */
  height?: number;
  /** Chart color */
  color?: string;
  /** Show axis labels */
  showAxis?: boolean;
  /** Label for the chart */
  label?: string;
  /** Padding */
  padding?: string;
}

export function Chart({
  data,
  width,
  height = 8,
  color,
  showAxis = false,
  label,
  padding = '      ',
}: ChartProps): React.ReactElement {
  if (data.length < 2) {
    return (
      <InkBox>
        <Text color={palette.textTertiary}>Insufficient data for chart</Text>
      </InkBox>
    );
  }

  // Determine color based on trend
  const trend = data[data.length - 1] - data[0];
  const chartColor = color ?? (trend >= 0 ? semantic.gain : semantic.loss);

  // Sample data if width specified and data is longer
  let chartData = data;
  if (width && data.length > width) {
    const step = Math.floor(data.length / width);
    chartData = data.filter((_, i) => i % step === 0).slice(0, width);
  }

  // Generate ASCII chart
  const chart = asciichart.plot(chartData, {
    height,
    padding,
    format: (x: number) => x.toFixed(2).padStart(8),
  });

  return (
    <InkBox flexDirection="column">
      {label && (
        <InkBox marginBottom={1}>
          <Text color={palette.textSecondary}>{label}</Text>
        </InkBox>
      )}
      <Text color={chartColor}>{chart}</Text>
    </InkBox>
  );
}

// Mini sparkline chart
export interface SparklineProps {
  /** Data points */
  data: number[];
  /** Color */
  color?: string;
  /** Label */
  label?: string;
}

export function Sparkline({
  data,
  color,
  label,
}: SparklineProps): React.ReactElement {
  if (data.length < 2) {
    return <Text color={palette.textTertiary}>-</Text>;
  }

  // Determine color based on trend
  const trend = data[data.length - 1] - data[0];
  const sparkColor = color ?? (trend >= 0 ? semantic.gain : semantic.loss);

  const sparkline = generateSparkline(data);

  return (
    <InkBox>
      {label && (
        <>
          <Text color={palette.textSecondary}>{label} </Text>
        </>
      )}
      <Text color={sparkColor}>{sparkline}</Text>
    </InkBox>
  );
}

// Chart with price range info
export interface PriceChartProps extends ChartProps {
  /** Current price */
  currentPrice?: number;
  /** 52-week high */
  high52w?: number;
  /** 52-week low */
  low52w?: number;
}

export function PriceChart({
  currentPrice,
  high52w,
  low52w,
  ...chartProps
}: PriceChartProps): React.ReactElement {
  return (
    <InkBox flexDirection="column">
      <Chart {...chartProps} />

      {/* Price range info */}
      {(high52w !== undefined || low52w !== undefined) && (
        <InkBox marginTop={1} justifyContent="space-between">
          {low52w !== undefined && (
            <Text color={palette.textTertiary}>
              52W Low: <Text color={palette.text}>${low52w.toFixed(2)}</Text>
            </Text>
          )}
          {currentPrice !== undefined && (
            <Text color={palette.textSecondary}>
              Current: <Text color={palette.text} bold>${currentPrice.toFixed(2)}</Text>
            </Text>
          )}
          {high52w !== undefined && (
            <Text color={palette.textTertiary}>
              52W High: <Text color={palette.text}>${high52w.toFixed(2)}</Text>
            </Text>
          )}
        </InkBox>
      )}
    </InkBox>
  );
}

// Mini chart in a row (for tables)
export interface InlineChartProps {
  data: number[];
  width?: number;
}

export function InlineChart({
  data,
  width = 10,
}: InlineChartProps): React.ReactElement {
  if (data.length < 2) {
    return <Text color={palette.textMuted}>{'-'.repeat(width)}</Text>;
  }

  // Sample data to fit width
  const step = Math.max(1, Math.floor(data.length / width));
  const sampled = data.filter((_, i) => i % step === 0).slice(0, width);

  const trend = data[data.length - 1] - data[0];
  const color = trend >= 0 ? semantic.gain : semantic.loss;

  return <Text color={color}>{generateSparkline(sampled)}</Text>;
}
