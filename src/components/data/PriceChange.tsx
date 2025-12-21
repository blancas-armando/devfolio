/**
 * PriceChange Component
 *
 * Displays price changes with color coding
 * and directional arrows.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { arrows, getPriceArrow } from '../../design/symbols.js';

export interface PriceChangeProps {
  /** Change value (can be percent or absolute) */
  value: number;
  /** Show as percentage */
  percent?: boolean;
  /** Show arrow indicator */
  showArrow?: boolean;
  /** Show plus sign for positive values */
  showPlus?: boolean;
  /** Number of decimal places */
  decimals?: number;
  /** Size variant */
  size?: 'small' | 'normal' | 'large';
}

export function PriceChange({
  value,
  percent = true,
  showArrow = true,
  showPlus = true,
  decimals = 2,
  size = 'normal',
}: PriceChangeProps): React.ReactElement {
  // Determine color
  const color = value > 0 ? semantic.gain : value < 0 ? semantic.loss : semantic.unchanged;

  // Format value
  const sign = value > 0 && showPlus ? '+' : '';
  const formattedValue = `${sign}${value.toFixed(decimals)}${percent ? '%' : ''}`;

  // Get arrow
  const arrow = showArrow ? getPriceArrow(value) : '';

  // Style based on size
  const bold = size === 'large';

  return (
    <InkBox>
      {showArrow && arrow && (
        <Text color={color}>{arrow} </Text>
      )}
      <Text color={color} bold={bold}>
        {formattedValue}
      </Text>
    </InkBox>
  );
}

// Price with change
export interface PriceWithChangeProps {
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  showAbsoluteChange?: boolean;
  showArrow?: boolean;
}

export function PriceWithChange({
  price,
  change,
  changePercent,
  currency = '$',
  showAbsoluteChange = false,
  showArrow = true,
}: PriceWithChangeProps): React.ReactElement {
  const color = change >= 0 ? semantic.gain : semantic.loss;

  return (
    <InkBox>
      <Text color={palette.text} bold>{currency}{price.toFixed(2)}</Text>
      <Text>  </Text>
      <PriceChange value={changePercent} showArrow={showArrow} />
      {showAbsoluteChange && (
        <>
          <Text>  </Text>
          <Text color={color}>
            ({change >= 0 ? '+' : ''}{currency}{Math.abs(change).toFixed(2)})
          </Text>
        </>
      )}
    </InkBox>
  );
}

// Compact price change (just colored value)
export interface CompactChangeProps {
  value: number;
  percent?: boolean;
}

export function CompactChange({
  value,
  percent = true,
}: CompactChangeProps): React.ReactElement {
  const color = value > 0 ? semantic.gain : value < 0 ? semantic.loss : semantic.unchanged;
  const sign = value > 0 ? '+' : '';

  return (
    <Text color={color}>
      {sign}{value.toFixed(2)}{percent ? '%' : ''}
    </Text>
  );
}

// Change badge (pill style)
export interface ChangeBadgeProps {
  value: number;
  percent?: boolean;
}

export function ChangeBadge({
  value,
  percent = true,
}: ChangeBadgeProps): React.ReactElement {
  const bgColor = value > 0 ? semantic.gain : value < 0 ? semantic.loss : semantic.unchanged;
  const sign = value > 0 ? '+' : '';

  return (
    <Text backgroundColor={bgColor} color={palette.text}>
      {' '}{sign}{value.toFixed(2)}{percent ? '%' : ''}{' '}
    </Text>
  );
}

// Movement indicator (large arrow + value)
export interface MovementIndicatorProps {
  value: number;
  label?: string;
}

export function MovementIndicator({
  value,
  label,
}: MovementIndicatorProps): React.ReactElement {
  const color = value > 0 ? semantic.gain : value < 0 ? semantic.loss : semantic.unchanged;
  const arrow = value > 0 ? arrows.up : value < 0 ? arrows.down : '';

  return (
    <InkBox flexDirection="column" alignItems="center">
      <Text color={color} bold>
        {arrow} {value > 0 ? '+' : ''}{value.toFixed(2)}%
      </Text>
      {label && (
        <Text color={palette.textTertiary}>{label}</Text>
      )}
    </InkBox>
  );
}

// Price range indicator (shows position in range)
export interface PriceRangeProps {
  current: number;
  low: number;
  high: number;
  width?: number;
}

export function PriceRange({
  current,
  low,
  high,
  width = 20,
}: PriceRangeProps): React.ReactElement {
  const range = high - low;
  const position = range > 0 ? (current - low) / range : 0.5;
  const markerPos = Math.round(position * (width - 1));

  // Build the range bar
  const bar = Array.from({ length: width }, (_, i) => {
    if (i === markerPos) return '\u25CF'; // Filled circle
    return '\u2500'; // Line
  }).join('');

  return (
    <InkBox flexDirection="column">
      <InkBox justifyContent="space-between" width={width + 10}>
        <Text color={palette.textTertiary}>${low.toFixed(0)}</Text>
        <Text color={palette.textTertiary}>${high.toFixed(0)}</Text>
      </InkBox>
      <Text color={palette.accent}>{bar}</Text>
    </InkBox>
  );
}
