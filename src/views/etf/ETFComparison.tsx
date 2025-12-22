/**
 * ETFComparison Component
 *
 * Side-by-side comparison of multiple ETFs with
 * expense ratios, yields, performance, and holdings.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ETFProfile } from '../../types/index.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';

export interface ETFComparisonProps {
  etfs: ETFProfile[];
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
function formatPct(num: number | null, decimals: number = 1): string {
  if (num === null) return '--';
  return `${num.toFixed(decimals)}%`;
}

// Format currency
function formatPrice(num: number): string {
  return `$${num.toFixed(2)}`;
}

// Comparison row
function CompRow({ label, values, format, highlightBest, etfCount }: {
  label: string;
  values: (string | number | null)[];
  format?: 'price' | 'pct' | 'pct2' | 'compact' | 'raw';
  highlightBest?: 'high' | 'low';
  etfCount: number;
}): React.ReactElement {
  const labelWidth = 16;
  const colWidth = Math.floor((72 - labelWidth) / Math.max(etfCount, 1));

  const formatValue = (val: string | number | null): string => {
    if (val === null) return '--';
    if (typeof val === 'string') return val;
    switch (format) {
      case 'price': return formatPrice(val);
      case 'pct': return formatPct(val, 1);
      case 'pct2': return formatPct(val, 2);
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

export function ETFComparisonView({ etfs }: ETFComparisonProps): React.ReactElement {
  const labelWidth = 16;
  const colWidth = Math.floor((72 - labelWidth) / Math.max(etfs.length, 1));

  if (etfs.length === 0) {
    return (
      <Panel width={78} title="ETF Comparison">
        <PanelRow>
          <Text color={palette.textTertiary}>No ETFs to compare</Text>
        </PanelRow>
      </Panel>
    );
  }

  // Get union of all sector names
  const allSectors = new Set<string>();
  etfs.forEach(e => Object.keys(e.sectorWeights).forEach(s => allSectors.add(s)));
  const sectorList = Array.from(allSectors).slice(0, 6);

  return (
    <Panel width={78} title="ETF Comparison">
      {/* Symbol row */}
      <PanelRow>
        <InkBox width={labelWidth}>
          <Text color={palette.textTertiary}>Symbol</Text>
        </InkBox>
        {etfs.map((e) => (
          <InkBox key={e.symbol} width={colWidth}>
            <Text bold color={palette.text}>{e.symbol}</Text>
          </InkBox>
        ))}
      </PanelRow>

      {/* Names */}
      <PanelRow>
        <InkBox width={labelWidth}>
          <Text color={palette.textTertiary}>Name</Text>
        </InkBox>
        {etfs.map((e) => (
          <InkBox key={e.symbol} width={colWidth}>
            <Text color={palette.textSecondary}>
              {e.name.length > colWidth - 2 ? e.name.substring(0, colWidth - 4) + '..' : e.name}
            </Text>
          </InkBox>
        ))}
      </PanelRow>

      {/* Category */}
      <PanelRow>
        <InkBox width={labelWidth}>
          <Text color={palette.textTertiary}>Category</Text>
        </InkBox>
        {etfs.map((e) => (
          <InkBox key={e.symbol} width={colWidth}>
            <Text color={palette.textSecondary}>
              {(e.category ?? '--').length > colWidth - 2 ? (e.category ?? '--').substring(0, colWidth - 4) + '..' : (e.category ?? '--')}
            </Text>
          </InkBox>
        ))}
      </PanelRow>

      {/* Price & Change */}
      <Section title="Price">
        <CompRow label="Price" values={etfs.map(e => e.price)} format="price" etfCount={etfs.length} />
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>Change</Text>
          </InkBox>
          {etfs.map((e) => (
            <InkBox key={e.symbol} width={colWidth}>
              <Text color={e.changePercent >= 0 ? semantic.positive : semantic.negative}>
                {e.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown} {e.changePercent >= 0 ? '+' : ''}{e.changePercent.toFixed(2)}%
              </Text>
            </InkBox>
          ))}
        </PanelRow>
      </Section>

      {/* Key Metrics */}
      <Section title="Key Metrics">
        <CompRow label="Expense Ratio" values={etfs.map(e => e.expenseRatio)} format="pct2" highlightBest="low" etfCount={etfs.length} />
        <CompRow label="Dividend Yield" values={etfs.map(e => e.yield)} format="pct2" highlightBest="high" etfCount={etfs.length} />
        <CompRow label="AUM" values={etfs.map(e => e.totalAssets)} format="compact" highlightBest="high" etfCount={etfs.length} />
        <CompRow label="Holdings" values={etfs.map(e => e.holdingsCount)} format="raw" etfCount={etfs.length} />
      </Section>

      {/* Performance */}
      <Section title="Performance">
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>YTD</Text>
          </InkBox>
          {etfs.map((e) => (
            <InkBox key={e.symbol} width={colWidth}>
              <Text color={e.ytdReturn !== null ? (e.ytdReturn >= 0 ? semantic.positive : semantic.negative) : palette.textTertiary}>
                {e.ytdReturn !== null ? `${e.ytdReturn >= 0 ? '+' : ''}${e.ytdReturn.toFixed(1)}%` : '--'}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>1 Year</Text>
          </InkBox>
          {etfs.map((e) => (
            <InkBox key={e.symbol} width={colWidth}>
              <Text color={e.oneYearReturn !== null ? (e.oneYearReturn >= 0 ? semantic.positive : semantic.negative) : palette.textTertiary}>
                {e.oneYearReturn !== null ? `${e.oneYearReturn >= 0 ? '+' : ''}${e.oneYearReturn.toFixed(1)}%` : '--'}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>3 Year</Text>
          </InkBox>
          {etfs.map((e) => (
            <InkBox key={e.symbol} width={colWidth}>
              <Text color={e.threeYearReturn !== null ? (e.threeYearReturn >= 0 ? semantic.positive : semantic.negative) : palette.textTertiary}>
                {e.threeYearReturn !== null ? `${e.threeYearReturn >= 0 ? '+' : ''}${e.threeYearReturn.toFixed(1)}%` : '--'}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
        <PanelRow>
          <InkBox width={labelWidth}>
            <Text color={palette.textTertiary}>5 Year</Text>
          </InkBox>
          {etfs.map((e) => (
            <InkBox key={e.symbol} width={colWidth}>
              <Text color={e.fiveYearReturn !== null ? (e.fiveYearReturn >= 0 ? semantic.positive : semantic.negative) : palette.textTertiary}>
                {e.fiveYearReturn !== null ? `${e.fiveYearReturn >= 0 ? '+' : ''}${e.fiveYearReturn.toFixed(1)}%` : '--'}
              </Text>
            </InkBox>
          ))}
        </PanelRow>
      </Section>

      {/* Risk */}
      <Section title="Risk">
        <CompRow label="Beta" values={etfs.map(e => e.beta)} format="raw" etfCount={etfs.length} />
        <CompRow label="Sharpe Ratio" values={etfs.map(e => e.sharpeRatio)} format="raw" highlightBest="high" etfCount={etfs.length} />
      </Section>

      {/* Asset Allocation */}
      <Section title="Asset Allocation">
        <CompRow label="Stocks" values={etfs.map(e => e.stockPosition)} format="pct" etfCount={etfs.length} />
        <CompRow label="Bonds" values={etfs.map(e => e.bondPosition)} format="pct" etfCount={etfs.length} />
        <CompRow label="Cash" values={etfs.map(e => e.cashPosition)} format="pct" etfCount={etfs.length} />
      </Section>

      {/* Sector Weights */}
      {sectorList.length > 0 && (
        <Section title="Top Sectors">
          {sectorList.map((sector) => (
            <CompRow
              key={sector}
              label={sector.length > 14 ? sector.substring(0, 12) + '..' : sector}
              values={etfs.map(e => e.sectorWeights[sector] ?? null)}
              format="pct"
              etfCount={etfs.length}
            />
          ))}
        </Section>
      )}

      {/* Top Holdings */}
      <Section title="Top 3 Holdings">
        {[0, 1, 2].map((idx) => (
          <PanelRow key={idx}>
            <InkBox width={labelWidth}>
              <Text color={palette.textTertiary}>#{idx + 1}</Text>
            </InkBox>
            {etfs.map((e) => {
              const holding = e.topHoldings[idx];
              return (
                <InkBox key={e.symbol} width={colWidth}>
                  {holding ? (
                    <Text color={palette.text}>
                      {holding.symbol} <Text color={palette.textTertiary}>{holding.weight.toFixed(1)}%</Text>
                    </Text>
                  ) : (
                    <Text color={palette.textTertiary}>--</Text>
                  )}
                </InkBox>
              );
            })}
          </PanelRow>
        ))}
      </Section>

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          Best values highlighted {symbols.bullet} Lower expense ratios are better
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default ETFComparisonView;
