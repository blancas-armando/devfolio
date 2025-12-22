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
import type { AsciiLogo as AsciiLogoType } from '../../services/logo.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';
import { MetricGrid, type MetricItem } from '../../components/data/MetricGrid.js';
import { PriceWithChange } from '../../components/data/PriceChange.js';
import { ASCIIChart } from '../../components/data/ASCIIChart.js';
import { AsciiLogo } from '../../components/data/AsciiLogo.js';
import { formatLargeNumber, formatRatio, formatPercentValue } from '../../utils/format.js';

export interface StockProfileProps {
  profile: CompanyProfile;
  quickTake?: QuickTake | null;
  relatedStocks?: RelatedStock[];
  timeframe?: string;
  logo?: AsciiLogoType | null;
}

// Map timeframe to readable label
const TIMEFRAME_LABELS: Record<string, string> = {
  '1d': '1 day',
  '5d': '5 days',
  '1m': '1 month',
  '3m': '3 months',
  '6m': '6 months',
  '1y': '1 year',
  '5y': '5 years',
  '10y': '10 years',
  'max': 'all time',
  'all': 'all time',
};

// Helper to format currency
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return '$' + value.toFixed(2);
}

// Helper to format return percentage
function formatReturn(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function StockProfile({ profile, quickTake, relatedStocks, timeframe, logo }: StockProfileProps): React.ReactElement {
  const width = 72;
  const chartLabel = `Price Chart (${TIMEFRAME_LABELS[timeframe ?? '3m'] ?? '90 days'})`;

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

  const returnItems = [
    { label: '1M', value: profile.oneMonthReturn },
    { label: '3M', value: profile.threeMonthReturn },
    { label: '6M', value: profile.sixMonthReturn },
    { label: 'YTD', value: profile.ytdReturn },
    { label: '1Y', value: profile.oneYearReturn },
    { label: '3Y', value: profile.threeYearReturn },
    { label: '5Y', value: profile.fiveYearReturn },
    { label: '10Y', value: profile.tenYearReturn },
  ];

  return (
    <Panel width={width} title={profile.symbol}>
      {/* Header with logo */}
      {logo ? (
        <PanelRow>
          <InkBox flexDirection="row">
            <InkBox marginRight={2}>
              <AsciiLogo logo={logo} />
            </InkBox>
            <InkBox flexDirection="column">
              <Text color={palette.text}>{profile.name}</Text>
              <PriceWithChange
                price={profile.price}
                change={profile.change}
                changePercent={profile.changePercent}
                showArrow={true}
              />
              <Text color={palette.textTertiary}>{profile.sector} &gt; {profile.industry}</Text>
            </InkBox>
          </InkBox>
        </PanelRow>
      ) : (
        <>
          {/* Company name */}
          <PanelRow>
            <Text color={palette.text}>{profile.name}</Text>
          </PanelRow>

          {/* Price line */}
          <PanelRow>
            <PriceWithChange
              price={profile.price}
              change={profile.change}
              changePercent={profile.changePercent}
              showArrow={true}
            />
          </PanelRow>

          {/* Sector & Industry */}
          <PanelRow>
            <Text color={palette.textTertiary}>{profile.sector} &gt; {profile.industry}</Text>
          </PanelRow>
        </>
      )}

      {/* Description */}
      {profile.description && (
        <Section>
          <PanelRow>
            <InkBox width={width - 4}>
              <Text color={palette.textSecondary} wrap="truncate-end">
                {profile.description.substring(0, 200)}
                {profile.description.length > 200 ? '...' : ''}
              </Text>
            </InkBox>
          </PanelRow>
        </Section>
      )}

      {/* Market Data Section */}
      <Section title="Market Data">
        <PanelRow>
          <MetricGrid metrics={marketDataMetrics} columns={3} />
        </PanelRow>
      </Section>

      {/* Valuation Section */}
      <Section title="Valuation">
        <PanelRow>
          <MetricGrid metrics={valuationMetrics} columns={3} />
        </PanelRow>
      </Section>

      {/* Financials Section */}
      <Section title="Financials">
        <PanelRow>
          <MetricGrid metrics={financialMetrics} columns={3} />
        </PanelRow>
      </Section>

      {/* Balance Sheet Section */}
      <Section title="Balance Sheet">
        <PanelRow>
          <MetricGrid metrics={balanceSheetMetrics} columns={3} />
        </PanelRow>
      </Section>

      {/* Performance Section */}
      <Section title="Performance">
        <PanelRow>
          {returnItems.slice(0, 4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={palette.textTertiary}>{item.label}</Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          {returnItems.slice(0, 4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={item.value !== null && item.value >= 0 ? semantic.positive : semantic.negative}>
                {formatReturn(item.value)}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow><Text> </Text></PanelRow>
        <PanelRow>
          {returnItems.slice(4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={palette.textTertiary}>{item.label}</Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          {returnItems.slice(4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={item.value !== null && item.value >= 0 ? semantic.positive : semantic.negative}>
                {formatReturn(item.value)}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
      </Section>

      {/* Dividends Section (if applicable) */}
      {profile.dividendYield && profile.dividendYield > 0 && (
        <Section title="Dividends">
          <PanelRow>
            <MetricGrid
              metrics={[
                { label: 'Dividend Yield', value: formatPercentValue(profile.dividendYield) },
                { label: 'Dividend Rate', value: profile.dividendRate ? formatCurrency(profile.dividendRate) : 'N/A' },
                { label: 'Payout Ratio', value: formatPercentValue(profile.payoutRatio) },
                { label: 'Ex-Dividend', value: profile.exDividendDate ?? 'N/A' },
              ]}
              columns={2}
            />
          </PanelRow>
        </Section>
      )}

      {/* AI Quick Take Section */}
      {quickTake && (
        <Section title="AI Quick Take">
          <PanelRow>
            <Text color={quickTake.sentiment === 'bullish' ? semantic.positive : quickTake.sentiment === 'bearish' ? semantic.negative : semantic.warning}>
              {quickTake.sentiment === 'bullish' ? symbols.arrowUp : quickTake.sentiment === 'bearish' ? symbols.arrowDown : '-'}
            </Text>
            <Text> </Text>
            <Text color={quickTake.sentiment === 'bullish' ? semantic.positive : quickTake.sentiment === 'bearish' ? semantic.negative : palette.text}>
              {quickTake.summary}
            </Text>
          </PanelRow>
          <PanelRow>
            <Text color={palette.textTertiary}>Key: {quickTake.keyPoint}</Text>
          </PanelRow>
        </Section>
      )}

      {/* Price Chart Section */}
      {profile.historicalData && profile.historicalData.length > 10 && (
        <Section title={chartLabel}>
          <PanelRow padding={0}>
            <ASCIIChart
              data={profile.historicalData.map(d => ({ date: d.date, value: d.close }))}
              width={width - 4}
              height={8}
              showDateAxis={true}
            />
          </PanelRow>
        </Section>
      )}

      {/* Related Stocks Section */}
      {relatedStocks && relatedStocks.length > 0 && (
        <Section title="Related Stocks">
          {relatedStocks.slice(0, 4).map((stock) => (
            <PanelRow key={stock.symbol}>
              <InkBox width={8}>
                <Text color={palette.text}>{stock.symbol}</Text>
              </InkBox>
              <InkBox width={22}>
                <Text color={palette.textTertiary}>{stock.name.substring(0, 20)}</Text>
              </InkBox>
              <InkBox width={10}>
                <Text color={palette.text}>${stock.price.toFixed(2)}</Text>
              </InkBox>
              <Text color={stock.changePercent >= 0 ? semantic.positive : semantic.negative}>
                {stock.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown}
                {Math.abs(stock.changePercent).toFixed(1)}%
              </Text>
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Footer with timestamp */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          As of {profile.asOfDate.toLocaleString('en-US', {
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

export default StockProfile;
