/**
 * ETFProfile Component
 *
 * Displays comprehensive ETF profile with holdings,
 * sector breakdown, and performance.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ETFProfile as ETFProfileType } from '../../types/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';
import { PriceChart } from '../../components/data/Chart.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';

export interface ETFProfileProps {
  etf: ETFProfileType;
}

// Format large numbers
function formatLargeNumber(num: number | null): string {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
  return '$' + num.toLocaleString();
}

// Format percent with sign
function formatPercentWithSign(val: number | null): string {
  if (val === null) return 'N/A';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

// Section header component
function SectionHeader({ title, width }: { title: string; width: number }): React.ReactElement {
  const headerText = ` ${title} `;
  const remainingWidth = width - 4 - headerText.length;
  return (
    <Text color={palette.info}>
      {borders.leftTee}{borders.horizontal}{headerText}{borders.horizontal.repeat(remainingWidth)}{borders.rightTee}
    </Text>
  );
}

// Metric row component
function MetricRow({ label, value, valueColor }: {
  label: string;
  value: string;
  valueColor?: string;
}): React.ReactElement {
  return (
    <InkBox>
      <InkBox width={12}>
        <Text color={palette.textTertiary}>{label}</Text>
      </InkBox>
      <Text color={valueColor ?? palette.text}>{value}</Text>
    </InkBox>
  );
}

// Holding row component
function HoldingRow({ symbol, weight, changePercent, threeMonthReturn, ytdReturn }: {
  symbol: string;
  weight: number;
  changePercent?: number;
  threeMonthReturn?: number;
  ytdReturn?: number;
}): React.ReactElement {
  const formatPerf = (val: number | undefined): React.ReactElement => {
    if (val === undefined) return <Text color={palette.textTertiary}>--</Text>;
    const color = val >= 0 ? semantic.positive : semantic.negative;
    const sign = val >= 0 ? '+' : '';
    return <Text color={color}>{sign}{val.toFixed(1)}%</Text>;
  };

  return (
    <InkBox>
      <InkBox width={8}>
        <Text bold color={palette.text}>{symbol}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={semantic.warning}>{weight.toFixed(1)}%</Text>
      </InkBox>
      <InkBox width={9}>{formatPerf(changePercent)}</InkBox>
      <InkBox width={9}>{formatPerf(threeMonthReturn)}</InkBox>
      <InkBox width={9}>{formatPerf(ytdReturn)}</InkBox>
    </InkBox>
  );
}

// Allocation bar component
function AllocationBar({ label, value, color }: {
  label: string;
  value: number;
  color: string;
}): React.ReactElement {
  const barWidth = 30;
  const bars = Math.round((value / 100) * barWidth);
  return (
    <InkBox>
      <Text color={color}>{symbols.blockFull.repeat(bars)}</Text>
      <Text> </Text>
      <Text color={palette.text}>{value.toFixed(0)}% {label}</Text>
    </InkBox>
  );
}

// Sector bar component
function SectorBar({ name, weight, maxWeight }: {
  name: string;
  weight: number;
  maxWeight: number;
}): React.ReactElement {
  const barWidth = 20;
  const bars = Math.round((weight / maxWeight) * barWidth);
  return (
    <InkBox>
      <InkBox width={20}>
        <Text color={palette.textTertiary}>{name}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={palette.text}>{weight.toFixed(1)}%</Text>
      </InkBox>
      <Text color={palette.accent}>{symbols.blockFull.repeat(bars)}</Text>
    </InkBox>
  );
}

export function ETFProfileView({ etf }: ETFProfileProps): React.ReactElement {
  const width = 60;
  const line = borders.horizontal.repeat(width - 2);
  const isUp = etf.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;

  // Get sorted sectors
  const sectors = Object.entries(etf.sectorWeights).sort((a, b) => b[1] - a[1]);
  const maxSectorWeight = sectors.length > 0 ? Math.max(...sectors.map(([_, w]) => w)) : 0;

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>

      {/* ETF name and ticker */}
      <InkBox paddingX={1}>
        <Text bold color={palette.text}>{etf.symbol}</Text>
        <Text color={palette.textTertiary}> {borders.vertical} </Text>
        <Text color={palette.text}>{etf.name}</Text>
      </InkBox>

      {/* Family and category */}
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>{etf.family ?? 'Unknown'} {symbols.bullet} {etf.category ?? 'ETF'}</Text>
      </InkBox>

      {/* Key Metrics */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox flexDirection="column" paddingX={1}>
        <InkBox>
          <InkBox width={12}>
            <Text color={palette.textTertiary}>Price</Text>
          </InkBox>
          <Text bold color={palette.text}>{formatCurrency(etf.price)}</Text>
          <Text>  </Text>
          <Text color={isUp ? semantic.positive : semantic.negative}>
            {arrow} {formatCurrency(etf.change)} ({formatPercent(etf.changePercent)})
          </Text>
        </InkBox>
        <MetricRow
          label="Yield"
          value={etf.yield !== null ? `${etf.yield.toFixed(2)}%` : 'N/A'}
          valueColor={etf.yield !== null ? semantic.positive : undefined}
        />
        <MetricRow
          label="Expense"
          value={etf.expenseRatio !== null ? `${etf.expenseRatio.toFixed(2)}%` : 'N/A'}
          valueColor={semantic.warning}
        />
        <MetricRow label="AUM" value={formatLargeNumber(etf.totalAssets)} />
        {etf.inceptionDate && (
          <MetricRow
            label="Inception"
            value={etf.inceptionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          />
        )}
      </InkBox>

      {/* Top Holdings */}
      {etf.topHoldings.length > 0 && (
        <>
          <SectionHeader title="Top Holdings" width={width} />
          <InkBox paddingX={1}>
            <InkBox width={8}><Text color={palette.textTertiary}>Symbol</Text></InkBox>
            <InkBox width={8}><Text color={palette.textTertiary}>Weight</Text></InkBox>
            <InkBox width={9}><Text color={palette.textTertiary}>Today</Text></InkBox>
            <InkBox width={9}><Text color={palette.textTertiary}>3M</Text></InkBox>
            <InkBox width={9}><Text color={palette.textTertiary}>YTD</Text></InkBox>
          </InkBox>
          <InkBox flexDirection="column" paddingX={1}>
            {etf.topHoldings.slice(0, 10).map((h) => (
              <HoldingRow
                key={h.symbol}
                symbol={h.symbol}
                weight={h.weight}
                changePercent={h.changePercent}
                threeMonthReturn={h.threeMonthReturn}
                ytdReturn={h.ytdReturn}
              />
            ))}
            {etf.holdingsCount && etf.holdingsCount > 10 && (
              <Text color={palette.textTertiary}>
                ... ({etf.holdingsCount.toLocaleString()} total holdings)
              </Text>
            )}
          </InkBox>
        </>
      )}

      {/* Asset Allocation */}
      {(etf.stockPosition !== null || etf.bondPosition !== null || etf.cashPosition !== null) && (
        <>
          <SectionHeader title="Asset Allocation" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {etf.stockPosition !== null && etf.stockPosition > 0 && (
              <AllocationBar label="Stocks" value={etf.stockPosition} color={palette.info} />
            )}
            {etf.bondPosition !== null && etf.bondPosition > 0 && (
              <AllocationBar label="Bonds" value={etf.bondPosition} color={semantic.positive} />
            )}
            {etf.cashPosition !== null && etf.cashPosition > 0 && (
              <AllocationBar label="Cash" value={etf.cashPosition} color={semantic.warning} />
            )}
          </InkBox>
        </>
      )}

      {/* Sector Breakdown */}
      {sectors.length > 0 && (
        <>
          <SectionHeader title="Sector Breakdown" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {sectors.slice(0, 6).map(([name, weight]) => (
              <SectorBar
                key={name}
                name={name}
                weight={weight}
                maxWeight={maxSectorWeight}
              />
            ))}
            {sectors.length > 6 && (
              <Text color={palette.textTertiary}>
                Other sectors: {sectors.slice(6).reduce((sum, [_, w]) => sum + w, 0).toFixed(1)}%
              </Text>
            )}
          </InkBox>
        </>
      )}

      {/* Performance */}
      <SectionHeader title="Performance" width={width} />
      <InkBox flexDirection="column" paddingX={1}>
        {[
          ['YTD', etf.ytdReturn],
          ['1 Year', etf.oneYearReturn],
          ['3 Year', etf.threeYearReturn],
          ['5 Year', etf.fiveYearReturn],
        ].map(([label, value]) => (
          <InkBox key={label as string}>
            <InkBox width={12}>
              <Text color={palette.textTertiary}>{label}</Text>
            </InkBox>
            <Text color={
              value !== null
                ? (value as number) >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {value !== null ? formatPercentWithSign(value as number) : 'N/A'}
            </Text>
          </InkBox>
        ))}
      </InkBox>

      {/* Price Chart */}
      {etf.historicalPrices.length > 10 && (
        <>
          <SectionHeader title="Price Chart (90 days)" width={width} />
          <InkBox paddingX={1}>
            <PriceChart
              data={etf.historicalPrices}
              width={width - 12}
              height={8}
            />
          </InkBox>
        </>
      )}

      {/* Footer with timestamp */}
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>
          As of {etf.asOfDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Text>
      </InkBox>

      {/* Bottom border */}
      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default ETFProfileView;
