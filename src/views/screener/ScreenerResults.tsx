/**
 * ScreenerResults Component
 *
 * Display stock screener results with price,
 * change, market cap, and P/E ratio.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ScreenerResponse, ScreenerResult } from '../../services/screener.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';

export interface ScreenerResultsProps {
  screener: ScreenerResponse;
}

// Format large numbers
function formatCompact(num: number | null): string {
  if (num === null) return '--';
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(0)}M`;
  return num.toLocaleString();
}

// Format volume
function formatVolume(num: number | null): string {
  if (num === null) return '--';
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return num.toLocaleString();
}

// Stock row component
function StockRow({ result, rank }: { result: ScreenerResult; rank: number }): React.ReactElement {
  const isUp = result.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const changeColor = isUp ? semantic.positive : semantic.negative;

  return (
    <InkBox>
      <InkBox width={4}>
        <Text color={palette.textTertiary}>{rank}.</Text>
      </InkBox>
      <InkBox width={8}>
        <Text bold color={palette.text}>{result.symbol}</Text>
      </InkBox>
      <InkBox width={10} justifyContent="flex-end">
        <Text color={palette.text}>${result.price.toFixed(2)}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={changeColor}>
          {arrow} {isUp ? '+' : ''}{result.changePercent.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={palette.textTertiary}>{formatCompact(result.marketCap)}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={palette.textTertiary}>
          {result.peRatio !== null ? result.peRatio.toFixed(1) : '--'}
        </Text>
      </InkBox>
      <Text color={palette.textSecondary}>
        {result.name.length > 22 ? result.name.substring(0, 19) + '...' : result.name}
      </Text>
    </InkBox>
  );
}

export function ScreenerResultsView({ screener }: ScreenerResultsProps): React.ReactElement {
  const width = 78;
  const line = borders.horizontal.repeat(width - 2);

  if (screener.results.length === 0) {
    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox paddingX={1}>
          <Text bold color={palette.text}>{screener.title}</Text>
        </InkBox>
        <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox paddingX={1}>
          <Text color={palette.textTertiary}>No results found</Text>
        </InkBox>
        <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox paddingX={1}>
        <Text bold color={palette.text}>{screener.title}</Text>
      </InkBox>
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>{screener.description}</Text>
      </InkBox>

      {/* Column headers */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox paddingX={1}>
        <InkBox width={4}>
          <Text color={palette.textTertiary}>#</Text>
        </InkBox>
        <InkBox width={8}>
          <Text color={palette.textTertiary}>Symbol</Text>
        </InkBox>
        <InkBox width={10} justifyContent="flex-end">
          <Text color={palette.textTertiary}>Price</Text>
        </InkBox>
        <InkBox width={10}>
          <Text color={palette.textTertiary}>Change</Text>
        </InkBox>
        <InkBox width={10}>
          <Text color={palette.textTertiary}>Mkt Cap</Text>
        </InkBox>
        <InkBox width={8}>
          <Text color={palette.textTertiary}>P/E</Text>
        </InkBox>
        <Text color={palette.textTertiary}>Name</Text>
      </InkBox>

      {/* Results */}
      <InkBox flexDirection="column" paddingX={1}>
        {screener.results.map((result, i) => (
          <StockRow key={result.symbol} result={result} rank={i + 1} />
        ))}
      </InkBox>

      {/* Footer */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>
          {screener.total} results {symbols.bullet} Type 's SYMBOL' to view stock profile
        </Text>
      </InkBox>

      {/* Available presets hint */}
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>
          Presets: gainers, losers, active, value, growth, tech, healthcare, finance, energy
        </Text>
      </InkBox>

      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default ScreenerResultsView;
