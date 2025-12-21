/**
 * StockProfile Component
 *
 * Displays comprehensive company profile with metrics,
 * chart, and AI quick take.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { CompanyProfile } from '../../services/market.js';
import type { QuickTake } from '../../services/quicktake.js';
import type { RelatedStock } from '../../services/screener.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';
import { MetricSection, MetricGrid, type MetricItem } from '../../components/data/MetricGrid.js';
import { PriceWithChange } from '../../components/data/PriceChange.js';
import { PriceChart } from '../../components/data/Chart.js';
import { formatLargeNumber, formatRatio, formatPercentValue } from '../../utils/format.js';

export interface StockProfileProps {
  profile: CompanyProfile;
  quickTake?: QuickTake | null;
  relatedStocks?: RelatedStock[];
}

// Helper to format currency
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return '$' + value.toFixed(2);
}

// Section header component
function SectionHeader({ title }: { title: string }): React.ReactElement {
  return (
    <InkBox marginTop={1}>
      <Text bold color={semantic.command}>{title}</Text>
    </InkBox>
  );
}

// Metric row component
function MetricRow({ items }: { items: MetricItem[] }): React.ReactElement {
  return (
    <InkBox flexWrap="wrap">
      {items.map((item, i) => (
        <InkBox key={item.label} width="33%" paddingRight={1}>
          <Text color={palette.textTertiary}>{item.label}: </Text>
          <Text color={palette.text}>{item.value}</Text>
        </InkBox>
      ))}
    </InkBox>
  );
}

export function StockProfile({ profile, quickTake, relatedStocks }: StockProfileProps): React.ReactElement {
  const width = 60;
  const line = borders.horizontal.repeat(width - 2);
  const isUp = profile.changePercent >= 0;

  // Prepare metrics
  const marketDataMetrics: MetricItem[] = [
    { label: 'Market Cap', value: formatLargeNumber(profile.marketCap) },
    { label: 'Enterprise Value', value: formatLargeNumber(profile.enterpriseValue) },
    { label: '52W High', value: profile.high52w ? formatCurrency(profile.high52w) : 'N/A' },
    { label: '52W Low', value: profile.low52w ? formatCurrency(profile.low52w) : 'N/A' },
    { label: 'Beta', value: formatRatio(profile.beta) },
    { label: 'Avg Volume', value: profile.avgVolume ? `${(profile.avgVolume / 1e6).toFixed(2)}M` : 'N/A' },
  ];

  const evFcf = profile.enterpriseValue && profile.freeCashFlow && profile.freeCashFlow > 0
    ? profile.enterpriseValue / profile.freeCashFlow
    : null;

  const valuationMetrics: MetricItem[] = [
    { label: 'P/E Ratio', value: formatRatio(profile.peRatio) },
    { label: 'Forward P/E', value: formatRatio(profile.forwardPE) },
    { label: 'PEG Ratio', value: formatRatio(profile.pegRatio) },
    { label: 'P/S Ratio', value: formatRatio(profile.priceToSales) },
    { label: 'P/B Ratio', value: formatRatio(profile.priceToBook) },
    { label: 'EV/Revenue', value: formatRatio(profile.evToRevenue) },
    { label: 'EV/EBITDA', value: formatRatio(profile.evToEbitda) },
    { label: 'EV/FCF', value: formatRatio(evFcf) },
  ];

  const financialMetrics: MetricItem[] = [
    { label: 'Revenue (TTM)', value: formatLargeNumber(profile.revenue) },
    { label: 'Revenue Growth', value: formatPercentValue(profile.revenueGrowth) },
    { label: 'Gross Margin', value: formatPercentValue(profile.grossMargin) },
    { label: 'Operating Margin', value: formatPercentValue(profile.operatingMargin) },
    { label: 'Profit Margin', value: formatPercentValue(profile.profitMargin) },
    { label: 'Free Cash Flow', value: formatLargeNumber(profile.freeCashFlow) },
  ];

  const balanceSheetMetrics: MetricItem[] = [
    { label: 'Total Cash', value: formatLargeNumber(profile.totalCash) },
    { label: 'Total Debt', value: formatLargeNumber(profile.totalDebt) },
    { label: 'Debt/Equity', value: formatRatio(profile.debtToEquity) },
    { label: 'Current Ratio', value: formatRatio(profile.currentRatio) },
    { label: 'Book Value', value: profile.bookValue ? formatCurrency(profile.bookValue) : 'N/A' },
  ];

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>

      {/* Company name and ticker */}
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text bold color={palette.text}>{profile.symbol}</Text>
        <Text color={palette.textTertiary}> {borders.vertical} </Text>
        <Text color={palette.text}>{profile.name}</Text>
      </InkBox>

      {/* Price line */}
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <PriceWithChange
          price={profile.price}
          change={profile.change}
          changePercent={profile.changePercent}
          showArrow={true}
        />
      </InkBox>

      {/* Sector & Industry */}
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text color={palette.textTertiary}>{profile.sector} &gt; {profile.industry}</Text>
      </InkBox>

      {/* Description */}
      {profile.description && (
        <>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox>
            <Text color={palette.border}>{borders.vertical} </Text>
            <InkBox width={width - 4}>
              <Text color={palette.textSecondary} wrap="truncate-end">
                {profile.description.substring(0, 200)}
                {profile.description.length > 200 ? '...' : ''}
              </Text>
            </InkBox>
          </InkBox>
        </>
      )}

      {/* Market Data Section */}
      <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text bold color={semantic.command}>Market Data</Text>
      </InkBox>
      <InkBox flexDirection="column" paddingX={1}>
        <MetricGrid metrics={marketDataMetrics} columns={3} />
      </InkBox>

      {/* Valuation Section */}
      <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text bold color={semantic.command}>Valuation</Text>
      </InkBox>
      <InkBox flexDirection="column" paddingX={1}>
        <MetricGrid metrics={valuationMetrics} columns={3} />
      </InkBox>

      {/* Financials Section */}
      <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text bold color={semantic.command}>Financials</Text>
      </InkBox>
      <InkBox flexDirection="column" paddingX={1}>
        <MetricGrid metrics={financialMetrics} columns={3} />
      </InkBox>

      {/* Balance Sheet Section */}
      <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text bold color={semantic.command}>Balance Sheet</Text>
      </InkBox>
      <InkBox flexDirection="column" paddingX={1}>
        <MetricGrid metrics={balanceSheetMetrics} columns={3} />
      </InkBox>

      {/* Dividends Section (if applicable) */}
      {profile.dividendYield && profile.dividendYield > 0 && (
        <>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox>
            <Text color={palette.border}>{borders.vertical} </Text>
            <Text bold color={semantic.command}>Dividends</Text>
          </InkBox>
          <InkBox flexDirection="column" paddingX={1}>
            <MetricGrid
              metrics={[
                { label: 'Dividend Yield', value: formatPercentValue(profile.dividendYield) },
                { label: 'Dividend Rate', value: profile.dividendRate ? formatCurrency(profile.dividendRate) : 'N/A' },
                { label: 'Payout Ratio', value: formatPercentValue(profile.payoutRatio) },
                { label: 'Ex-Dividend', value: profile.exDividendDate ?? 'N/A' },
              ]}
              columns={2}
            />
          </InkBox>
        </>
      )}

      {/* AI Quick Take Section */}
      {quickTake && (
        <>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox>
            <Text color={palette.border}>{borders.vertical} </Text>
            <Text color={quickTake.sentiment === 'bullish' ? semantic.positive : quickTake.sentiment === 'bearish' ? semantic.negative : semantic.warning}>
              {quickTake.sentiment === 'bullish' ? symbols.arrowUp : quickTake.sentiment === 'bearish' ? symbols.arrowDown : '-'}
            </Text>
            <Text> </Text>
            <Text bold color={palette.accent}>AI Quick Take</Text>
          </InkBox>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox paddingX={2}>
            <Text color={quickTake.sentiment === 'bullish' ? semantic.positive : quickTake.sentiment === 'bearish' ? semantic.negative : palette.text}>
              {quickTake.summary}
            </Text>
          </InkBox>
          <InkBox paddingX={2}>
            <Text color={palette.textTertiary}>Key: {quickTake.keyPoint}</Text>
          </InkBox>
        </>
      )}

      {/* Price Chart Section */}
      {profile.historicalPrices && profile.historicalPrices.length > 10 && (
        <>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox>
            <Text color={palette.border}>{borders.vertical} </Text>
            <Text bold color={semantic.command}>Price Chart (90 days)</Text>
          </InkBox>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox paddingX={1}>
            <PriceChart
              data={profile.historicalPrices}
              width={width - 12}
              height={8}
            />
          </InkBox>
        </>
      )}

      {/* Related Stocks Section */}
      {relatedStocks && relatedStocks.length > 0 && (
        <>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox>
            <Text color={palette.border}>{borders.vertical} </Text>
            <Text bold color={palette.info}>Related Stocks</Text>
          </InkBox>
          <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
          {relatedStocks.slice(0, 4).map((stock) => (
            <InkBox key={stock.symbol} paddingX={2}>
              <InkBox width={8}>
                <Text color={palette.text}>{stock.symbol}</Text>
              </InkBox>
              <InkBox width={20}>
                <Text color={palette.textTertiary}>{stock.name.substring(0, 18)}</Text>
              </InkBox>
              <InkBox width={10}>
                <Text color={palette.text}>${stock.price.toFixed(2)}</Text>
              </InkBox>
              <Text color={stock.changePercent >= 0 ? semantic.positive : semantic.negative}>
                {stock.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown}
                {Math.abs(stock.changePercent).toFixed(1)}%
              </Text>
            </InkBox>
          ))}
        </>
      )}

      {/* Footer with timestamp */}
      <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text color={palette.textTertiary}>
          As of {profile.asOfDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Text>
      </InkBox>

      {/* Bottom border */}
      <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default StockProfile;
