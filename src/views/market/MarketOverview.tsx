/**
 * MarketOverview Component
 *
 * Displays market indices, sector performance, and top movers.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { MarketOverview } from '../../services/market.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';

export interface MarketOverviewProps {
  overview: MarketOverview;
}

// Index row component
function IndexRow({ name, price, changePercent }: {
  name: string;
  price: number;
  changePercent: number;
}): React.ReactElement {
  const isUp = changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const priceStr = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const changeStr = `${isUp ? '+' : ''}${changePercent.toFixed(2)}%`;

  return (
    <InkBox>
      <InkBox width={16}>
        <Text color={palette.text}>{name}</Text>
      </InkBox>
      <InkBox width={14} justifyContent="flex-end">
        <Text color={palette.text}>{priceStr}</Text>
      </InkBox>
      <InkBox width={12} marginLeft={2}>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {arrow} {changeStr}
        </Text>
      </InkBox>
    </InkBox>
  );
}

// VIX row component
function VixRow({ vix }: { vix: number }): React.ReactElement {
  const vixColor = vix > 20 ? semantic.negative : vix > 15 ? semantic.warning : semantic.positive;
  const vixLabel = vix > 25 ? '(High Fear)' : vix > 20 ? '(Elevated)' : vix > 15 ? '(Normal)' : '(Low)';

  return (
    <InkBox>
      <InkBox width={16}>
        <Text color={palette.text}>VIX</Text>
      </InkBox>
      <InkBox width={14} justifyContent="flex-end">
        <Text color={palette.text}>{vix.toFixed(2)}</Text>
      </InkBox>
      <InkBox width={12} marginLeft={2}>
        <Text color={vixColor}>{vixLabel}</Text>
      </InkBox>
    </InkBox>
  );
}

// Sector row with bar chart
function SectorRow({
  name,
  changePercent,
  maxPct,
}: {
  name: string;
  changePercent: number;
  maxPct: number;
}): React.ReactElement {
  const isUp = changePercent >= 0;
  const barWidth = 20;
  const barLen = Math.round((Math.abs(changePercent) / maxPct) * barWidth);
  const changeStr = `${isUp ? '+' : ''}${changePercent.toFixed(2)}%`;

  return (
    <InkBox>
      <InkBox width={18}>
        <Text color={palette.text}>{name}</Text>
      </InkBox>
      <InkBox width={22}>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {symbols.blockFull.repeat(barLen)}
        </Text>
        <Text color={palette.textTertiary}>
          {symbols.blockLight.repeat(barWidth - barLen)}
        </Text>
      </InkBox>
      <InkBox width={10} justifyContent="flex-end">
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {changeStr}
        </Text>
      </InkBox>
    </InkBox>
  );
}

// Mover component
function MoverList({
  movers,
  isGainer,
}: {
  movers: Array<{ symbol: string; changePercent: number }>;
  isGainer: boolean;
}): React.ReactElement {
  const color = isGainer ? semantic.positive : semantic.negative;
  const arrow = isGainer ? symbols.arrowUp : symbols.arrowDown;

  return (
    <InkBox>
      <Text color={palette.textTertiary}>{arrow} </Text>
      {movers.slice(0, 4).map((m, i) => (
        <React.Fragment key={m.symbol}>
          {i > 0 && <Text color={palette.textTertiary}>  </Text>}
          <Text color={color}>
            {m.symbol} {isGainer ? '+' : ''}{m.changePercent.toFixed(1)}%
          </Text>
        </React.Fragment>
      ))}
    </InkBox>
  );
}

export function MarketOverviewView({ overview }: MarketOverviewProps): React.ReactElement {
  const width = 72;
  const line = borders.horizontal.repeat(width - 2);
  const maxPct = Math.max(...overview.sectors.map(s => Math.abs(s.changePercent)), 1);

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox>
        <Text color={palette.info}>{borders.vertical} </Text>
        <Text bold color={palette.text}>Market Overview</Text>
      </InkBox>

      {/* Indices Section */}
      <InkBox>
        <Text color={palette.info}>{borders.leftTee}{borders.horizontal}</Text>
        <Text color={palette.info}> Indices </Text>
        <Text color={palette.info}>{borders.horizontal.repeat(width - 14)}{borders.rightTee}</Text>
      </InkBox>
      <InkBox flexDirection="column" paddingX={2}>
        {overview.indices.map((idx) => (
          <IndexRow
            key={idx.symbol}
            name={idx.name}
            price={idx.price}
            changePercent={idx.changePercent}
          />
        ))}
        {overview.vix !== null && <VixRow vix={overview.vix} />}
      </InkBox>

      {/* Sector Performance Section */}
      <InkBox>
        <Text color={palette.info}>{borders.leftTee}{borders.horizontal}</Text>
        <Text color={palette.info}> Sector Performance </Text>
        <Text color={palette.info}>{borders.horizontal.repeat(width - 24)}{borders.rightTee}</Text>
      </InkBox>
      <InkBox flexDirection="column" paddingX={2}>
        {overview.sectors.slice(0, 6).map((sector) => (
          <SectorRow
            key={sector.name}
            name={sector.name}
            changePercent={sector.changePercent}
            maxPct={maxPct}
          />
        ))}
      </InkBox>

      {/* Top Movers Section */}
      <InkBox>
        <Text color={palette.info}>{borders.leftTee}{borders.horizontal}</Text>
        <Text color={palette.info}> Top Movers </Text>
        <Text color={palette.info}>{borders.horizontal.repeat(width - 16)}{borders.rightTee}</Text>
      </InkBox>
      <InkBox flexDirection="column" paddingX={2}>
        <MoverList movers={overview.gainers} isGainer={true} />
        <MoverList movers={overview.losers} isGainer={false} />
      </InkBox>

      {/* Footer */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox>
        <Text color={palette.info}>{borders.vertical} </Text>
        <Text color={palette.textTertiary}>
          As of {overview.asOfDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Text>
      </InkBox>
      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default MarketOverviewView;
