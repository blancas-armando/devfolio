/**
 * HistoryView Component
 *
 * Comprehensive historical analysis display with
 * revenue/EPS trends, margins, and price milestones.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { HistoricalAnalysis, HistoricalMetric } from '../../services/history.js';
import { getMetricLabel } from '../../services/history.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { generateSparkline } from '../../design/symbols.js';

export interface HistoryViewProps {
  analysis: HistoricalAnalysis;
}

// Format large numbers
function formatNum(num: number | null): string {
  if (num === null) return '-';
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 1e12) return `${sign}$${(absNum / 1e12).toFixed(1)}T`;
  if (absNum >= 1e9) return `${sign}$${(absNum / 1e9).toFixed(1)}B`;
  if (absNum >= 1e6) return `${sign}$${(absNum / 1e6).toFixed(0)}M`;
  return `${sign}$${absNum.toFixed(0)}`;
}

// Format percentage
function formatPct(num: number | null, showSign = true): string {
  if (num === null) return '-';
  const sign = showSign && num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

// Generate sparkline from historical metrics (reversed to show oldest -> newest)
function metricSparkline(metrics: HistoricalMetric[]): string {
  const values = metrics
    .filter(m => m.value !== null)
    .map(m => m.value!)
    .reverse();
  if (values.length < 2) return '';
  return generateSparkline(values);
}

// Metric trend row with sparkline
function MetricTrendRow({
  label,
  metrics,
  formatter = formatNum,
  growthRate,
}: {
  label: string;
  metrics: HistoricalMetric[];
  formatter?: (n: number | null) => string;
  growthRate?: number | null;
}): React.ReactElement {
  const sparkline = metricSparkline(metrics);
  const current = metrics[0]?.value ?? null;
  const oldest = metrics[metrics.length - 1]?.value ?? null;
  const trend = current !== null && oldest !== null ? current - oldest : null;
  const trendColor = trend !== null && trend >= 0 ? semantic.gain : semantic.loss;

  return (
    <PanelRow>
      <InkBox width={18}>
        <Text color={palette.textTertiary}>{label}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={palette.text}>{formatter(current)}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={trendColor}>{sparkline}</Text>
      </InkBox>
      {growthRate !== undefined && (
        <InkBox width={12}>
          <Text color={growthRate !== null && growthRate >= 0 ? semantic.positive : semantic.negative}>
            {growthRate !== null ? `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%/yr` : '-'}
          </Text>
        </InkBox>
      )}
    </PanelRow>
  );
}

export function HistoryView({ analysis }: HistoryViewProps): React.ReactElement {
  const isQuarterly = analysis.period === 'quarterly';
  const periodLabel = isQuarterly ? '8 Quarters' : '5 Years';
  const periodShort = isQuarterly ? '8Q' : '5Y';

  const items = [
    { label: '1M', value: analysis.returns.oneMonth },
    { label: '3M', value: analysis.returns.threeMonth },
    { label: '6M', value: analysis.returns.sixMonth },
    { label: 'YTD', value: analysis.returns.ytd },
    { label: '1Y', value: analysis.returns.oneYear },
    { label: '3Y', value: analysis.returns.threeYear },
    { label: '5Y', value: analysis.returns.fiveYear },
    { label: '10Y', value: analysis.returns.tenYear },
  ];

  return (
    <Panel width={78} title={analysis.symbol}>
      {/* Header */}
      <PanelRow>
        <Text color={palette.text}>{analysis.name}</Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Historical Analysis ({periodLabel})</Text>
        {isQuarterly && (
          <Text color={palette.textMuted}>  Use 'hist {analysis.symbol}' for annual</Text>
        )}
        {!isQuarterly && (
          <Text color={palette.textMuted}>  Use 'hist {analysis.symbol} q' for quarterly</Text>
        )}
      </PanelRow>

      {/* Performance Returns */}
      <Section title="Performance">
        <PanelRow>
          {items.slice(0, 4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={palette.textTertiary}>{item.label}</Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          {items.slice(0, 4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={item.value !== null && item.value >= 0 ? semantic.positive : semantic.negative}>
                {formatPct(item.value)}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow><Text> </Text></PanelRow>
        <PanelRow>
          {items.slice(4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={palette.textTertiary}>{item.label}</Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          {items.slice(4).map(item => (
            <InkBox key={item.label} width={12}>
              <Text color={item.value !== null && item.value >= 0 ? semantic.positive : semantic.negative}>
                {formatPct(item.value)}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
      </Section>

      {/* Price Milestones */}
      <Section title="Price Milestones">
        <PanelRow>
          <InkBox width={20}>
            <Text color={palette.textTertiary}>All-Time High</Text>
          </InkBox>
          <InkBox width={15}>
            <Text color={palette.text}>
              {analysis.priceMilestones.allTimeHigh !== null
                ? `$${analysis.priceMilestones.allTimeHigh.toFixed(2)}`
                : '-'}
            </Text>
          </InkBox>
          <Text color={palette.textMuted}>
            {analysis.priceMilestones.allTimeHighDate
              ? analysis.priceMilestones.allTimeHighDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : ''}
          </Text>
        </PanelRow>
        <PanelRow>
          <InkBox width={20}>
            <Text color={palette.textTertiary}>All-Time Low</Text>
          </InkBox>
          <InkBox width={15}>
            <Text color={palette.text}>
              {analysis.priceMilestones.allTimeLow !== null
                ? `$${analysis.priceMilestones.allTimeLow.toFixed(2)}`
                : '-'}
            </Text>
          </InkBox>
          <Text color={palette.textMuted}>
            {analysis.priceMilestones.allTimeLowDate
              ? analysis.priceMilestones.allTimeLowDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : ''}
          </Text>
        </PanelRow>
        <PanelRow>
          <InkBox width={20}>
            <Text color={palette.textTertiary}>52-Week Range</Text>
          </InkBox>
          <Text color={palette.text}>
            {analysis.priceMilestones.fiftyTwoWeekLow !== null && analysis.priceMilestones.fiftyTwoWeekHigh !== null
              ? `$${analysis.priceMilestones.fiftyTwoWeekLow.toFixed(2)} - $${analysis.priceMilestones.fiftyTwoWeekHigh.toFixed(2)}`
              : '-'}
          </Text>
        </PanelRow>
      </Section>

      {/* Financial Trends */}
      <Section title={`Financial Trends (${periodShort})`}>
        <PanelRow>
          <InkBox width={18}><Text color={palette.textTertiary}>Metric</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>Latest</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>Trend</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>{isQuarterly ? 'QoQ' : 'CAGR'}</Text></InkBox>
        </PanelRow>
        <MetricTrendRow label="Revenue" metrics={analysis.revenueHistory} growthRate={analysis.revenueGrowthRate} />
        <MetricTrendRow label="EPS" metrics={analysis.epsHistory} formatter={(n) => n !== null ? `$${n.toFixed(2)}` : '-'} growthRate={analysis.epsGrowthRate} />
        <MetricTrendRow label="Free Cash Flow" metrics={analysis.fcfHistory} />
      </Section>

      {/* Margin Trends */}
      <Section title={`Margin Trends (${periodShort})`}>
        <PanelRow>
          <InkBox width={18}><Text color={palette.textTertiary}>Margin</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>Latest</Text></InkBox>
          <InkBox width={12}><Text color={palette.textTertiary}>Trend</Text></InkBox>
        </PanelRow>
        <MetricTrendRow label="Gross Margin" metrics={analysis.grossMarginHistory} formatter={(n) => formatPct(n, false)} />
        <MetricTrendRow label="Operating Margin" metrics={analysis.operatingMarginHistory} formatter={(n) => formatPct(n, false)} />
        <MetricTrendRow label="Net Margin" metrics={analysis.netMarginHistory} formatter={(n) => formatPct(n, false)} />
      </Section>

      {/* Valuation */}
      <Section title="Valuation">
        <PanelRow>
          <InkBox width={16}><Text color={palette.textTertiary}>P/E</Text></InkBox>
          <InkBox width={12}>
            <Text color={palette.text}>{analysis.peRatio.current !== null ? analysis.peRatio.current.toFixed(1) : '-'}</Text>
          </InkBox>
          <InkBox width={16}><Text color={palette.textTertiary}>EV/Rev</Text></InkBox>
          <InkBox width={12}>
            <Text color={palette.text}>{analysis.evRevenue !== null ? analysis.evRevenue.toFixed(1) : '-'}</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={16}><Text color={palette.textTertiary}>P/S</Text></InkBox>
          <InkBox width={12}>
            <Text color={palette.text}>{analysis.psRatio.current !== null ? analysis.psRatio.current.toFixed(1) : '-'}</Text>
          </InkBox>
          <InkBox width={16}><Text color={palette.textTertiary}>EV/EBITDA</Text></InkBox>
          <InkBox width={12}>
            <Text color={palette.text}>{analysis.evEbitda !== null ? analysis.evEbitda.toFixed(1) : '-'}</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={16}><Text color={palette.textTertiary}></Text></InkBox>
          <InkBox width={12}><Text color={palette.text}></Text></InkBox>
          <InkBox width={16}><Text color={palette.textTertiary}>EV/FCF</Text></InkBox>
          <InkBox width={12}>
            <Text color={palette.text}>{analysis.evFcf !== null ? analysis.evFcf.toFixed(1) : '-'}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Dividends (if applicable) */}
      {analysis.dividendHistory && (
        <Section title="Dividend History">
          <PanelRow>
            <InkBox width={20}><Text color={palette.textTertiary}>Current Yield</Text></InkBox>
            <Text color={palette.text}>
              {analysis.dividendHistory.currentYield !== null
                ? `${analysis.dividendHistory.currentYield.toFixed(2)}%`
                : '-'}
            </Text>
          </PanelRow>
          {analysis.dividendHistory.fiveYearAvgYield !== null && (
            <PanelRow>
              <InkBox width={20}><Text color={palette.textTertiary}>5Y Avg Yield</Text></InkBox>
              <Text color={palette.text}>{analysis.dividendHistory.fiveYearAvgYield.toFixed(2)}%</Text>
            </PanelRow>
          )}
          {analysis.dividendHistory.payoutRatio !== null && (
            <PanelRow>
              <InkBox width={20}><Text color={palette.textTertiary}>Payout Ratio</Text></InkBox>
              <Text color={palette.text}>{analysis.dividendHistory.payoutRatio.toFixed(0)}%</Text>
            </PanelRow>
          )}
        </Section>
      )}

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          Data as of {analysis.asOfDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default HistoryView;
