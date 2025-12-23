/**
 * Skeleton Components
 *
 * Loading placeholders with pulse animation
 * for a polished loading experience.
 */

import React, { useState, useEffect } from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette } from '../../design/tokens.js';
import { timing } from '../../design/timing.js';

// Block characters for skeleton shimmer effect
const SKELETON_CHARS = {
  light: '\u2591',    // ░ Light shade
  medium: '\u2592',   // ▒ Medium shade
  dark: '\u2593',     // ▓ Dark shade
  full: '\u2588',     // █ Full block
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Base Skeleton Component
// ═══════════════════════════════════════════════════════════════════════════

export interface SkeletonProps {
  /** Width in characters */
  width?: number | 'full';
  /** Height in lines (for box variant) */
  height?: number;
  /** Visual variant */
  variant?: 'text' | 'box' | 'line';
  /** Enable pulse animation */
  animate?: boolean;
  /** Animation speed in ms */
  speed?: number;
  /** Character to use */
  char?: keyof typeof SKELETON_CHARS;
}

export function Skeleton({
  width = 20,
  height = 1,
  variant = 'text',
  animate = true,
  speed = timing.skeletonPulse,
  char = 'medium',
}: SkeletonProps): React.ReactElement {
  const [pulseState, setPulseState] = useState(0);

  useEffect(() => {
    if (!animate) return;

    const timer = setInterval(() => {
      setPulseState(prev => (prev + 1) % 3);
    }, speed);

    return () => clearInterval(timer);
  }, [animate, speed]);

  const chars: (keyof typeof SKELETON_CHARS)[] = ['light', 'medium', 'dark'];
  const currentChar = animate ? chars[pulseState] : char;
  const colors = [palette.textMuted, palette.borderLight, palette.textMuted];
  const currentColor = animate ? colors[pulseState] : palette.textMuted;

  const resolvedWidth = width === 'full' ? 60 : width;
  const skeletonChar = SKELETON_CHARS[currentChar];

  if (variant === 'line') {
    return (
      <Text color={currentColor} dimColor>
        {skeletonChar.repeat(resolvedWidth)}
      </Text>
    );
  }

  if (variant === 'box') {
    return (
      <InkBox flexDirection="column">
        {Array.from({ length: height }).map((_, i) => (
          <Text key={i} color={currentColor} dimColor>
            {skeletonChar.repeat(resolvedWidth)}
          </Text>
        ))}
      </InkBox>
    );
  }

  // Default: text variant
  return (
    <Text color={currentColor} dimColor>
      {skeletonChar.repeat(resolvedWidth)}
    </Text>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Text Component
// ═══════════════════════════════════════════════════════════════════════════

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Width of each line (or 'random' for varied widths) */
  width?: number | 'random' | 'full';
  /** Max width when using random */
  maxWidth?: number;
  /** Line spacing */
  spacing?: number;
  /** Enable pulse animation */
  animate?: boolean;
}

export function SkeletonText({
  lines = 3,
  width = 'random',
  maxWidth = 60,
  spacing = 0,
  animate = true,
}: SkeletonTextProps): React.ReactElement {
  // Generate consistent random widths based on line index
  const getLineWidth = (index: number): number => {
    if (width === 'full') return maxWidth;
    if (typeof width === 'number') return width;
    // Random-ish based on index for consistency
    const widths = [1.0, 0.9, 0.75, 0.85, 0.6, 0.95, 0.7, 0.8];
    return Math.round(maxWidth * widths[index % widths.length]);
  };

  return (
    <InkBox flexDirection="column">
      {Array.from({ length: lines }).map((_, i) => (
        <InkBox key={i} marginTop={i > 0 ? spacing : 0}>
          <Skeleton
            width={getLineWidth(i)}
            variant="text"
            animate={animate}
          />
        </InkBox>
      ))}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Table Component
// ═══════════════════════════════════════════════════════════════════════════

export interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Column widths */
  columnWidths?: number[];
  /** Show header row */
  showHeader?: boolean;
  /** Gap between columns */
  gap?: number;
  /** Enable pulse animation */
  animate?: boolean;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  columnWidths = [20, 12, 12, 12],
  showHeader = true,
  gap = 2,
  animate = true,
}: SkeletonTableProps): React.ReactElement {
  const totalRows = showHeader ? rows + 1 : rows;

  // Ensure we have widths for all columns
  const widths = Array.from({ length: columns }, (_, i) =>
    columnWidths[i] ?? columnWidths[columnWidths.length - 1] ?? 12
  );

  return (
    <InkBox flexDirection="column">
      {Array.from({ length: totalRows }).map((_, rowIndex) => (
        <InkBox key={rowIndex}>
          {widths.map((colWidth, colIndex) => (
            <InkBox key={colIndex} marginRight={colIndex < columns - 1 ? gap : 0}>
              <Skeleton
                width={colWidth}
                variant="text"
                animate={animate}
                char={showHeader && rowIndex === 0 ? 'dark' : 'medium'}
              />
            </InkBox>
          ))}
        </InkBox>
      ))}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Metric Grid Component
// ═══════════════════════════════════════════════════════════════════════════

export interface SkeletonMetricGridProps {
  /** Number of metrics */
  count?: number;
  /** Number of columns */
  columns?: number;
  /** Label width */
  labelWidth?: number;
  /** Value width */
  valueWidth?: number;
  /** Enable pulse animation */
  animate?: boolean;
}

export function SkeletonMetricGrid({
  count = 6,
  columns = 2,
  labelWidth = 12,
  valueWidth = 10,
  animate = true,
}: SkeletonMetricGridProps): React.ReactElement {
  const rows = Math.ceil(count / columns);

  return (
    <InkBox flexDirection="column">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <InkBox key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => {
            const metricIndex = rowIndex * columns + colIndex;
            if (metricIndex >= count) return null;

            return (
              <InkBox key={colIndex} marginRight={colIndex < columns - 1 ? 4 : 0}>
                <Skeleton
                  width={labelWidth}
                  variant="text"
                  animate={animate}
                  char="light"
                />
                <Text> </Text>
                <Skeleton
                  width={valueWidth}
                  variant="text"
                  animate={animate}
                  char="medium"
                />
              </InkBox>
            );
          })}
        </InkBox>
      ))}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Card Component
// ═══════════════════════════════════════════════════════════════════════════

export interface SkeletonCardProps {
  /** Card width */
  width?: number;
  /** Show title placeholder */
  showTitle?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Enable pulse animation */
  animate?: boolean;
}

export function SkeletonCard({
  width = 60,
  showTitle = true,
  contentLines = 3,
  animate = true,
}: SkeletonCardProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" paddingX={1}>
      {showTitle && (
        <InkBox marginBottom={1}>
          <Skeleton width={Math.round(width * 0.4)} animate={animate} char="dark" />
        </InkBox>
      )}
      <SkeletonText
        lines={contentLines}
        maxWidth={width - 4}
        animate={animate}
      />
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton Chart Component
// ═══════════════════════════════════════════════════════════════════════════

export interface SkeletonChartProps {
  /** Chart width */
  width?: number;
  /** Chart height */
  height?: number;
  /** Enable pulse animation */
  animate?: boolean;
}

export function SkeletonChart({
  width = 60,
  height = 8,
  animate = true,
}: SkeletonChartProps): React.ReactElement {
  const [pulseState, setPulseState] = useState(0);

  useEffect(() => {
    if (!animate) return;

    const timer = setInterval(() => {
      setPulseState(prev => (prev + 1) % 3);
    }, timing.skeletonPulse);

    return () => clearInterval(timer);
  }, [animate]);

  const colors = [palette.textMuted, palette.borderLight, palette.textMuted];
  const currentColor = animate ? colors[pulseState] : palette.textMuted;

  // Create a simple bar chart skeleton
  const barHeights = [3, 5, 2, 6, 4, 7, 3, 5, 4, 6];
  const barWidth = Math.max(1, Math.floor((width - 4) / barHeights.length) - 1);

  return (
    <InkBox flexDirection="column">
      {Array.from({ length: height }).map((_, y) => {
        const row = height - y - 1;
        return (
          <InkBox key={y}>
            {barHeights.map((barHeight, x) => {
              const filled = row < barHeight;
              return (
                <InkBox key={x} marginRight={1}>
                  <Text color={currentColor} dimColor>
                    {filled
                      ? SKELETON_CHARS.medium.repeat(barWidth)
                      : ' '.repeat(barWidth)}
                  </Text>
                </InkBox>
              );
            })}
          </InkBox>
        );
      })}
    </InkBox>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Loading Wrapper Component
// ═══════════════════════════════════════════════════════════════════════════

export interface SkeletonWrapperProps {
  /** Loading state */
  loading: boolean;
  /** Skeleton to show when loading */
  skeleton: React.ReactNode;
  /** Content to show when loaded */
  children: React.ReactNode;
}

export function SkeletonWrapper({
  loading,
  skeleton,
  children,
}: SkeletonWrapperProps): React.ReactElement {
  if (loading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
}
