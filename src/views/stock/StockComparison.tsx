/**
 * StockComparison Component
 *
 * Side-by-side comparison of multiple stocks with
 * key metrics, valuation, and performance.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { CompanyProfile } from '../../services/market.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';

export interface StockComparisonProps {
  stocks: CompanyProfile[];
}

// Format large numbers compactly
function formatCompact(num: number | null): string {
  if (num === null) return '--';
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(0)}M`;
  return num.toLocaleString();
}

// Format percent
function formatPct(num: number | null): string {
  if (num === null) return '--';
  return `${num.toFixed(1)}%`;
}

// Format ratio
function formatRatio(num: number | null): string {
  if (num === null) return '--';
  return num.toFixed(1);
}

// Format currency
function formatPrice(num: number): string {
  return `$${num.toFixed(2)}`;
}

// Comparison row
function CompRow({ label, values, format, highlightBest, stockCount }: {
  label: string;
  values: (string | number | null)[];
  format?: 'price' | 'pct' | 'ratio' | 'compact' | 'raw';
  highlightBest?: 'high' | 'low';
  stockCount: number;
}): React.ReactElement {
  const labelWidth = 16;
  const colWidth = Math.floor((72 - labelWidth) / Math.max(stockCount, 1));

  const formatValue = (val: string | number | null): string => {
    if (val === null) return '--';
    if (typeof val === 'string') return val;
    switch (format) {
      case 'price': return formatPrice(val);
      case 'pct': return formatPct(val);
      case 'ratio': return formatRatio(val);
      case 'compact': return formatCompact(val);
      default: return String(val);
    }
  };

  // Find best value for highlighting
  let bestIndex = -1;
  if (highlightBest) {
    const nums = values.map(v => typeof v === 'number' ? v : null);
    const validNums = nums.filter((n): n is number => n !== null);
    if (validNums.length > 0) {
      const best = highlightBest === 'high' ? Math.max(...validNums) : Math.min(...validNums);
      bestIndex = nums.indexOf(best);
    }
  }

  return (
    <PanelRow>
      <InkBox width={labelWidth}>
        <Text color={palette.textTertiary}>{label}</Text>
      </InkBox>
      {values.map((val, i) => (
        <InkBox key={i} width={colWidth}>
          <Text color={i === bestIndex ? palette.accent : palette.text}>
            {formatValue(val)}
          </Text>
        </InkBox>
      ))}
    </PanelRow>
  );
}

export function StockComparisonView({ stocks }: StockComparisonProps): React.ReactElement {
  const labelWidth = 16;
  const colWidth = Math.floor((72 - labelWidth) / Math.max(stocks.length, 1));

  if (stocks.length === 0) {
    return (
      <Panel width={78} title="Stock Comparison">
        <PanelRow>
          <Text color={palette.textTertiary}>No stocks to compare</Text>
        </PanelRow>
      </Panel>
    );
  }

  return (
    <Panel width={78} title="Stock Comparison">
      {/* Symbol row */}
      <PanelRow>
        <InkBox width={labelWidth}>
          <Text color={palette.textTertiary}>Symbol</Text>
        </InkBox>
        {stocks.map((s) => (
          <InkBox key={s.symbol} width={colWidth}>
            <Text bold color={palette.text}>{s.symbol}</Text>
          </InkBox>
        ))}
      </PanelRow>

      {/* Company names */}
      <PanelRow>
        <InkBox width={labelWidth}>
          <Text color={palette.textTertiary}>Name</Text>
        </InkBox>
        {stocks.map((s) => (
          <InkBox key={s.symbol} width={colWidth}>
            <Text color={palette.textSecondary}>
              {s.name.length > colWidth - 2 ? s.name.substring(0, colWidth - 4) + '..' : s.name}
            </Text>
          </InkBox>
        ))}
      </PanelRow>

      {/* Price & Change */}
      <Section title="Price">
        <CompRow label="Price" values={stocks.map(s => s.price)} format="price" stockCount={stocks.length} />
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>Change</Text>
          </InkBox>
          {stocks.map((s) => (
            <InkBox key={s.symbol} width={colWidth}>
              <Text color={s.changePercent >= 0 ? semantic.positive : semantic.negative}>
                {s.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown} {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <CompRow label="52W High" values={stocks.map(s => s.high52w)} format="price" stockCount={stocks.length} />
        <CompRow label="52W Low" values={stocks.map(s => s.low52w)} format="price" stockCount={stocks.length} />
      </Section>

      {/* Valuation */}
      <Section title="Valuation">
        <CompRow label="Market Cap" values={stocks.map(s => s.marketCap)} format="compact" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="P/E Ratio" values={stocks.map(s => s.peRatio)} format="ratio" highlightBest="low" stockCount={stocks.length} />
        <CompRow label="Forward P/E" values={stocks.map(s => s.forwardPE)} format="ratio" highlightBest="low" stockCount={stocks.length} />
        <CompRow label="PEG Ratio" values={stocks.map(s => s.pegRatio)} format="ratio" highlightBest="low" stockCount={stocks.length} />
        <CompRow label="P/S Ratio" values={stocks.map(s => s.priceToSales)} format="ratio" highlightBest="low" stockCount={stocks.length} />
        <CompRow label="EV/EBITDA" values={stocks.map(s => s.evToEbitda)} format="ratio" highlightBest="low" stockCount={stocks.length} />
      </Section>

      {/* Financials */}
      <Section title="Financials">
        <CompRow label="Revenue" values={stocks.map(s => s.revenue)} format="compact" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="Rev Growth" values={stocks.map(s => s.revenueGrowth ? s.revenueGrowth * 100 : null)} format="pct" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="Gross Margin" values={stocks.map(s => s.grossMargin ? s.grossMargin * 100 : null)} format="pct" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="Op Margin" values={stocks.map(s => s.operatingMargin ? s.operatingMargin * 100 : null)} format="pct" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="Net Margin" values={stocks.map(s => s.profitMargin ? s.profitMargin * 100 : null)} format="pct" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="EPS" values={stocks.map(s => s.eps)} format="price" highlightBest="high" stockCount={stocks.length} />
      </Section>

      {/* Balance Sheet */}
      <Section title="Balance Sheet">
        <CompRow label="Total Cash" values={stocks.map(s => s.totalCash)} format="compact" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="Total Debt" values={stocks.map(s => s.totalDebt)} format="compact" highlightBest="low" stockCount={stocks.length} />
        <CompRow label="Debt/Equity" values={stocks.map(s => s.debtToEquity)} format="ratio" highlightBest="low" stockCount={stocks.length} />
        <CompRow label="Current Ratio" values={stocks.map(s => s.currentRatio)} format="ratio" highlightBest="high" stockCount={stocks.length} />
      </Section>

      {/* Dividends */}
      <Section title="Dividends">
        <CompRow label="Div Yield" values={stocks.map(s => s.dividendYield ? s.dividendYield * 100 : null)} format="pct" highlightBest="high" stockCount={stocks.length} />
        <CompRow label="Payout Ratio" values={stocks.map(s => s.payoutRatio ? s.payoutRatio * 100 : null)} format="pct" stockCount={stocks.length} />
      </Section>

      {/* Performance */}
      <Section title="Performance">
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>3M Return</Text>
          </InkBox>
          {stocks.map((s) => (
            <InkBox key={s.symbol} width={colWidth}>
              <Text color={s.threeMonthReturn !== null ? (s.threeMonthReturn >= 0 ? semantic.positive : semantic.negative) : palette.textTertiary}>
                {s.threeMonthReturn !== null ? `${s.threeMonthReturn >= 0 ? '+' : ''}${s.threeMonthReturn.toFixed(1)}%` : '--'}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>YTD Return</Text>
          </InkBox>
          {stocks.map((s) => (
            <InkBox key={s.symbol} width={colWidth}>
              <Text color={s.ytdReturn !== null ? (s.ytdReturn >= 0 ? semantic.positive : semantic.negative) : palette.textTertiary}>
                {s.ytdReturn !== null ? `${s.ytdReturn >= 0 ? '+' : ''}${s.ytdReturn.toFixed(1)}%` : '--'}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <CompRow label="Beta" values={stocks.map(s => s.beta)} format="ratio" stockCount={stocks.length} />
      </Section>

      {/* Analyst Targets */}
      <Section title="Analyst View">
        <CompRow label="Target Price" values={stocks.map(s => s.targetPrice)} format="price" stockCount={stocks.length} />
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>Upside</Text>
          </InkBox>
          {stocks.map((s) => {
            const upside = s.targetPrice ? ((s.targetPrice - s.price) / s.price) * 100 : null;
            return (
              <InkBox key={s.symbol} width={colWidth}>
                <Text color={upside !== null ? (upside >= 0 ? semantic.positive : semantic.negative) : palette.textTertiary}>
                  {upside !== null ? `${upside >= 0 ? '+' : ''}${upside.toFixed(1)}%` : '--'}
                </Text>
              </InkBox>
            );
          })}
        </PanelRow>
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>Rating</Text>
          </InkBox>
          {stocks.map((s) => (
            <InkBox key={s.symbol} width={colWidth}>
              <Text color={palette.accent}>{s.recommendationKey?.toUpperCase() ?? '--'}</Text>
            </InkBox>
          ))}
        </PanelRow>
      </Section>

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          Best values highlighted {symbols.bullet} Data as of {new Date().toLocaleDateString()}
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default StockComparisonView;
