/**
 * ETFProfile Component
 *
 * Displays comprehensive ETF profile with holdings,
 * sector breakdown, and performance.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ETFProfile as ETFProfileType } from '../../types/index.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
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

// Metric row component
function MetricRow({ label, value, valueColor }: {
  label: string;
  value: string;
  valueColor?: string;
}): React.ReactElement {
  return (
    <PanelRow>
      <InkBox width={12}>
        <Text color={palette.textTertiary}>{label}</Text>
      </InkBox>
      <Text color={valueColor ?? palette.text}>{value}</Text>
    </PanelRow>
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
    <PanelRow>
      <InkBox width={8}>
        <Text bold color={palette.text}>{symbol}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={semantic.warning}>{weight.toFixed(1)}%</Text>
      </InkBox>
      <InkBox width={9}>{formatPerf(changePercent)}</InkBox>
      <InkBox width={9}>{formatPerf(threeMonthReturn)}</InkBox>
      <InkBox width={9}>{formatPerf(ytdReturn)}</InkBox>
    </PanelRow>
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
    <PanelRow>
      <Text color={color}>{symbols.blockFull.repeat(bars)}</Text>
      <Text> </Text>
      <Text color={palette.text}>{value.toFixed(0)}% {label}</Text>
    </PanelRow>
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
    <PanelRow>
      <InkBox width={20}>
        <Text color={palette.textTertiary}>{name}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={palette.text}>{weight.toFixed(1)}%</Text>
      </InkBox>
      <Text color={palette.accent}>{symbols.blockFull.repeat(bars)}</Text>
    </PanelRow>
  );
}

export function ETFProfileView({ etf }: ETFProfileProps): React.ReactElement {
  const isUp = etf.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;

  // Get sorted sectors
  const sectors = Object.entries(etf.sectorWeights).sort((a, b) => b[1] - a[1]);
  const maxSectorWeight = sectors.length > 0 ? Math.max(...sectors.map(([_, w]) => w)) : 0;

  return (
    <Panel width={72} title={etf.symbol}>
      {/* ETF name */}
      <PanelRow>
        <Text color={palette.text}>{etf.name}</Text>
      </PanelRow>

      {/* Family and category */}
      <PanelRow>
        <Text color={palette.textTertiary}>{etf.family ?? 'Unknown'} {symbols.bullet} {etf.category ?? 'ETF'}</Text>
      </PanelRow>

      {/* Key Metrics */}
      <Section title="Key Metrics">
        <PanelRow>
          <InkBox width={12}>
            <Text color={palette.textTertiary}>Price</Text>
          </InkBox>
          <Text bold color={palette.text}>{formatCurrency(etf.price)}</Text>
          <Text>  </Text>
          <Text color={isUp ? semantic.positive : semantic.negative}>
            {arrow} {formatCurrency(etf.change)} ({formatPercent(etf.changePercent)})
          </Text>
        </PanelRow>
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
      </Section>

      {/* Top Holdings */}
      {etf.topHoldings.length > 0 && (
        <Section title="Top Holdings">
          <PanelRow>
            <InkBox width={8}><Text color={palette.textTertiary}>Symbol</Text></InkBox>
            <InkBox width={8}><Text color={palette.textTertiary}>Weight</Text></InkBox>
            <InkBox width={9}><Text color={palette.textTertiary}>Today</Text></InkBox>
            <InkBox width={9}><Text color={palette.textTertiary}>3M</Text></InkBox>
            <InkBox width={9}><Text color={palette.textTertiary}>YTD</Text></InkBox>
          </PanelRow>
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
            <PanelRow>
              <Text color={palette.textTertiary}>
                ... ({etf.holdingsCount.toLocaleString()} total holdings)
              </Text>
            </PanelRow>
          )}
        </Section>
      )}

      {/* Asset Allocation */}
      {(etf.stockPosition !== null || etf.bondPosition !== null || etf.cashPosition !== null) && (
        <Section title="Asset Allocation">
          {etf.stockPosition !== null && etf.stockPosition > 0 && (
            <AllocationBar label="Stocks" value={etf.stockPosition} color={palette.info} />
          )}
          {etf.bondPosition !== null && etf.bondPosition > 0 && (
            <AllocationBar label="Bonds" value={etf.bondPosition} color={semantic.positive} />
          )}
          {etf.cashPosition !== null && etf.cashPosition > 0 && (
            <AllocationBar label="Cash" value={etf.cashPosition} color={semantic.warning} />
          )}
        </Section>
      )}

      {/* Sector Breakdown */}
      {sectors.length > 0 && (
        <Section title="Sector Breakdown">
          {sectors.slice(0, 6).map(([name, weight]) => (
            <SectorBar
              key={name}
              name={name}
              weight={weight}
              maxWeight={maxSectorWeight}
            />
          ))}
          {sectors.length > 6 && (
            <PanelRow>
              <Text color={palette.textTertiary}>
                Other sectors: {sectors.slice(6).reduce((sum, [_, w]) => sum + w, 0).toFixed(1)}%
              </Text>
            </PanelRow>
          )}
        </Section>
      )}

      {/* Performance */}
      <Section title="Performance">
        {/* Short-term returns in a row */}
        <PanelRow>
          <InkBox width={12}><Text color={palette.textTertiary}>1 Month</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>3 Month</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>6 Month</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>YTD</Text></InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={12}>
            <Text color={
              etf.oneMonthReturn !== null
                ? etf.oneMonthReturn >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {etf.oneMonthReturn !== null ? formatPercentWithSign(etf.oneMonthReturn) : 'N/A'}
            </Text>
          </InkBox>
          <InkBox width={12}>
            <Text color={
              etf.threeMonthReturn !== null
                ? etf.threeMonthReturn >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {etf.threeMonthReturn !== null ? formatPercentWithSign(etf.threeMonthReturn) : 'N/A'}
            </Text>
          </InkBox>
          <InkBox width={12}>
            <Text color={
              etf.sixMonthReturn !== null
                ? etf.sixMonthReturn >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {etf.sixMonthReturn !== null ? formatPercentWithSign(etf.sixMonthReturn) : 'N/A'}
            </Text>
          </InkBox>
          <InkBox width={12}>
            <Text color={
              etf.ytdReturn !== null
                ? etf.ytdReturn >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {etf.ytdReturn !== null ? formatPercentWithSign(etf.ytdReturn) : 'N/A'}
            </Text>
          </InkBox>
        </PanelRow>
        {/* Long-term returns in a row */}
        <PanelRow>
          <InkBox width={12}><Text color={palette.textTertiary}>1 Year</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>3 Year</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>5 Year</Text></InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={12}>
            <Text color={
              etf.oneYearReturn !== null
                ? etf.oneYearReturn >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {etf.oneYearReturn !== null ? formatPercentWithSign(etf.oneYearReturn) : 'N/A'}
            </Text>
          </InkBox>
          <InkBox width={12}>
            <Text color={
              etf.threeYearReturn !== null
                ? etf.threeYearReturn >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {etf.threeYearReturn !== null ? formatPercentWithSign(etf.threeYearReturn) : 'N/A'}
            </Text>
          </InkBox>
          <InkBox width={12}>
            <Text color={
              etf.fiveYearReturn !== null
                ? etf.fiveYearReturn >= 0 ? semantic.positive : semantic.negative
                : palette.textTertiary
            }>
              {etf.fiveYearReturn !== null ? formatPercentWithSign(etf.fiveYearReturn) : 'N/A'}
            </Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Price Chart */}
      {etf.historicalPrices.length > 10 && (
        <Section title="Price Chart (90 days)">
          <PanelRow padding={0}>
            <PriceChart
              data={etf.historicalPrices}
              width={60}
              height={8}
            />
          </PanelRow>
        </Section>
      )}

      {/* Footer with timestamp */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          As of {etf.asOfDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default ETFProfileView;
