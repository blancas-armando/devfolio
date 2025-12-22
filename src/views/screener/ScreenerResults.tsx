/**
 * ScreenerResults Component
 *
 * Display stock screener results with context-sensitive columns
 * based on the screen type (momentum vs value vs sector).
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ScreenerResponse, ScreenerResult } from '../../services/screener.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';

export interface ScreenerResultsProps {
  screener: ScreenerResponse;
}

// Determine screen type from ID - each investor type has different priorities
type ScreenType = 'momentum' | 'value' | 'growth' | 'dividend' | 'sector';

function getScreenType(id: string): ScreenType {
  // Momentum screens - Volume confirms price action
  if (['gainers', 'losers', 'active', 'trending'].includes(id)) {
    return 'momentum';
  }
  // Value screen - P/E is the classic value metric
  if (id === 'value') {
    return 'value';
  }
  // Growth screen - Market cap matters (we lack growth rate data)
  if (id === 'growth') {
    return 'growth';
  }
  // Dividend screen - Yield is what income investors care about
  if (id === 'dividend') {
    return 'dividend';
  }
  // Sector screens - market cap shows weight in sector
  return 'sector';
}

// Format large numbers
function formatCompact(num: number | null): string {
  if (num === null) return '--';
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(0)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return num.toLocaleString();
}

// Format volume (always in M/K for readability)
function formatVolume(num: number | null): string {
  if (num === null) return '--';
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return num.toLocaleString();
}

// Format dividend yield as percentage
function formatYield(num: number | null): string {
  if (num === null) return '--';
  return `${(num * 100).toFixed(2)}%`;
}

// Momentum row - emphasizes volume
function MomentumRow({ result, rank }: { result: ScreenerResult; rank: number }): React.ReactElement {
  const isUp = result.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const changeColor = isUp ? semantic.positive : semantic.negative;

  // Volume significance indicator
  const volStr = formatVolume(result.volume);

  return (
    <PanelRow>
      <InkBox width={4}>
        <Text color={palette.textTertiary}>{rank}.</Text>
      </InkBox>
      <InkBox width={7}>
        <Text bold color={palette.text}>{result.symbol}</Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.text}>${result.price.toFixed(2)}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={changeColor}>
          {arrow} {isUp ? '+' : ''}{result.changePercent.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.accent}>{volStr}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={palette.textTertiary}>{formatCompact(result.marketCap)}</Text>
      </InkBox>
      <Text color={palette.textSecondary}>
        {result.name.length > 20 ? result.name.substring(0, 17) + '...' : result.name}
      </Text>
    </PanelRow>
  );
}

// Value row - shows P/E
function ValueRow({ result, rank }: { result: ScreenerResult; rank: number }): React.ReactElement {
  const isUp = result.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const changeColor = isUp ? semantic.positive : semantic.negative;

  // P/E coloring - low is better for value
  const peColor = result.peRatio !== null
    ? result.peRatio < 15 ? semantic.positive
      : result.peRatio < 25 ? palette.text
      : semantic.warning
    : palette.textTertiary;

  return (
    <PanelRow>
      <InkBox width={4}>
        <Text color={palette.textTertiary}>{rank}.</Text>
      </InkBox>
      <InkBox width={7}>
        <Text bold color={palette.text}>{result.symbol}</Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.text}>${result.price.toFixed(2)}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={changeColor}>
          {arrow} {isUp ? '+' : ''}{result.changePercent.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={peColor}>
          {result.peRatio !== null ? result.peRatio.toFixed(1) : '--'}
        </Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.textTertiary}>{formatCompact(result.marketCap)}</Text>
      </InkBox>
      <Text color={palette.textSecondary}>
        {result.name.length > 20 ? result.name.substring(0, 17) + '...' : result.name}
      </Text>
    </PanelRow>
  );
}

// Dividend row - yield is the key metric for income investors
function DividendRow({ result, rank }: { result: ScreenerResult; rank: number }): React.ReactElement {
  const isUp = result.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const changeColor = isUp ? semantic.positive : semantic.negative;

  // Yield coloring - higher is better for income investors
  const yieldColor = result.dividendYield !== null
    ? result.dividendYield >= 0.04 ? semantic.positive  // 4%+ is good
      : result.dividendYield >= 0.02 ? palette.text     // 2-4% is average
      : palette.textTertiary                             // <2% is low
    : palette.textTertiary;

  return (
    <PanelRow>
      <InkBox width={4}>
        <Text color={palette.textTertiary}>{rank}.</Text>
      </InkBox>
      <InkBox width={7}>
        <Text bold color={palette.text}>{result.symbol}</Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.text}>${result.price.toFixed(2)}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={changeColor}>
          {arrow} {isUp ? '+' : ''}{result.changePercent.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={yieldColor}>{formatYield(result.dividendYield)}</Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.textTertiary}>{formatCompact(result.marketCap)}</Text>
      </InkBox>
      <Text color={palette.textSecondary}>
        {result.name.length > 20 ? result.name.substring(0, 17) + '...' : result.name}
      </Text>
    </PanelRow>
  );
}

// Growth row - market cap shows company stage (we lack growth rate data)
function GrowthRow({ result, rank }: { result: ScreenerResult; rank: number }): React.ReactElement {
  const isUp = result.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const changeColor = isUp ? semantic.positive : semantic.negative;

  return (
    <PanelRow>
      <InkBox width={4}>
        <Text color={palette.textTertiary}>{rank}.</Text>
      </InkBox>
      <InkBox width={7}>
        <Text bold color={palette.text}>{result.symbol}</Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.text}>${result.price.toFixed(2)}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={changeColor}>
          {arrow} {isUp ? '+' : ''}{result.changePercent.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.accent}>{formatCompact(result.marketCap)}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={palette.textTertiary}>
          {result.peRatio !== null ? result.peRatio.toFixed(1) : '--'}
        </Text>
      </InkBox>
      <Text color={palette.textSecondary}>
        {result.name.length > 20 ? result.name.substring(0, 17) + '...' : result.name}
      </Text>
    </PanelRow>
  );
}

// Sector row - market cap prominent (shows weight)
function SectorRow({ result, rank }: { result: ScreenerResult; rank: number }): React.ReactElement {
  const isUp = result.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const changeColor = isUp ? semantic.positive : semantic.negative;

  return (
    <PanelRow>
      <InkBox width={4}>
        <Text color={palette.textTertiary}>{rank}.</Text>
      </InkBox>
      <InkBox width={7}>
        <Text bold color={palette.text}>{result.symbol}</Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.text}>${result.price.toFixed(2)}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={changeColor}>
          {arrow} {isUp ? '+' : ''}{result.changePercent.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={palette.accent}>{formatCompact(result.marketCap)}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={palette.textTertiary}>
          {result.peRatio !== null ? result.peRatio.toFixed(1) : '--'}
        </Text>
      </InkBox>
      <Text color={palette.textSecondary}>
        {result.name.length > 20 ? result.name.substring(0, 17) + '...' : result.name}
      </Text>
    </PanelRow>
  );
}

// Column headers based on screen type
function ColumnHeaders({ screenType }: { screenType: ScreenType }): React.ReactElement {
  if (screenType === 'momentum') {
    return (
      <PanelRow>
        <InkBox width={4}><Text color={palette.textTertiary}>#</Text></InkBox>
        <InkBox width={7}><Text color={palette.textTertiary}>Symbol</Text></InkBox>
        <InkBox width={9}><Text color={palette.textTertiary}>Price</Text></InkBox>
        <InkBox width={10}><Text color={palette.textTertiary}>Change</Text></InkBox>
        <InkBox width={9}><Text color={palette.accent}>Volume</Text></InkBox>
        <InkBox width={8}><Text color={palette.textTertiary}>Mkt Cap</Text></InkBox>
        <Text color={palette.textTertiary}>Name</Text>
      </PanelRow>
    );
  }

  if (screenType === 'value') {
    return (
      <PanelRow>
        <InkBox width={4}><Text color={palette.textTertiary}>#</Text></InkBox>
        <InkBox width={7}><Text color={palette.textTertiary}>Symbol</Text></InkBox>
        <InkBox width={9}><Text color={palette.textTertiary}>Price</Text></InkBox>
        <InkBox width={10}><Text color={palette.textTertiary}>Change</Text></InkBox>
        <InkBox width={8}><Text color={palette.accent}>P/E</Text></InkBox>
        <InkBox width={9}><Text color={palette.textTertiary}>Mkt Cap</Text></InkBox>
        <Text color={palette.textTertiary}>Name</Text>
      </PanelRow>
    );
  }

  if (screenType === 'dividend') {
    return (
      <PanelRow>
        <InkBox width={4}><Text color={palette.textTertiary}>#</Text></InkBox>
        <InkBox width={7}><Text color={palette.textTertiary}>Symbol</Text></InkBox>
        <InkBox width={9}><Text color={palette.textTertiary}>Price</Text></InkBox>
        <InkBox width={10}><Text color={palette.textTertiary}>Change</Text></InkBox>
        <InkBox width={8}><Text color={palette.accent}>Yield</Text></InkBox>
        <InkBox width={9}><Text color={palette.textTertiary}>Mkt Cap</Text></InkBox>
        <Text color={palette.textTertiary}>Name</Text>
      </PanelRow>
    );
  }

  if (screenType === 'growth') {
    return (
      <PanelRow>
        <InkBox width={4}><Text color={palette.textTertiary}>#</Text></InkBox>
        <InkBox width={7}><Text color={palette.textTertiary}>Symbol</Text></InkBox>
        <InkBox width={9}><Text color={palette.textTertiary}>Price</Text></InkBox>
        <InkBox width={10}><Text color={palette.textTertiary}>Change</Text></InkBox>
        <InkBox width={9}><Text color={palette.accent}>Mkt Cap</Text></InkBox>
        <InkBox width={8}><Text color={palette.textTertiary}>P/E</Text></InkBox>
        <Text color={palette.textTertiary}>Name</Text>
      </PanelRow>
    );
  }

  // Sector
  return (
    <PanelRow>
      <InkBox width={4}><Text color={palette.textTertiary}>#</Text></InkBox>
      <InkBox width={7}><Text color={palette.textTertiary}>Symbol</Text></InkBox>
      <InkBox width={9}><Text color={palette.textTertiary}>Price</Text></InkBox>
      <InkBox width={10}><Text color={palette.textTertiary}>Change</Text></InkBox>
      <InkBox width={9}><Text color={palette.accent}>Mkt Cap</Text></InkBox>
      <InkBox width={8}><Text color={palette.textTertiary}>P/E</Text></InkBox>
      <Text color={palette.textTertiary}>Name</Text>
    </PanelRow>
  );
}

export function ScreenerResultsView({ screener }: ScreenerResultsProps): React.ReactElement {
  const screenType = getScreenType(screener.id);

  if (screener.results.length === 0) {
    return (
      <Panel width={78} title={screener.title}>
        <PanelRow>
          <Text color={palette.textTertiary}>No results found</Text>
        </PanelRow>
      </Panel>
    );
  }

  // Row component based on screen type - each optimized for investor journey
  const RowComponent = screenType === 'momentum' ? MomentumRow
    : screenType === 'value' ? ValueRow
    : screenType === 'dividend' ? DividendRow
    : screenType === 'growth' ? GrowthRow
    : SectorRow;

  return (
    <Panel width={78} title={screener.title}>
      {/* Description */}
      <PanelRow>
        <Text color={palette.textTertiary}>{screener.description}</Text>
      </PanelRow>

      {/* Column headers - context-sensitive */}
      <Section>
        <ColumnHeaders screenType={screenType} />
      </Section>

      {/* Results */}
      {screener.results.map((result, i) => (
        <RowComponent key={result.symbol} result={result} rank={i + 1} />
      ))}

      {/* Footer with context-specific hints */}
      <Section>
        <PanelRow>
          <Text color={palette.textTertiary}>
            {screener.total} results {symbols.bullet} Type 's SYMBOL' to view stock profile
          </Text>
        </PanelRow>
        {screenType === 'momentum' && (
          <PanelRow>
            <Text color={palette.textTertiary}>
              {symbols.bullet} High volume confirms price action {symbols.bullet} Watch for unusual spikes
            </Text>
          </PanelRow>
        )}
        {screenType === 'value' && (
          <PanelRow>
            <Text color={palette.textTertiary}>
              {symbols.bullet} Lower P/E may indicate value {symbols.bullet} Compare within sector
            </Text>
          </PanelRow>
        )}
        {screenType === 'dividend' && (
          <PanelRow>
            <Text color={palette.textTertiary}>
              {symbols.bullet} Higher yield = more income {symbols.bullet} Check payout sustainability
            </Text>
          </PanelRow>
        )}
        {screenType === 'growth' && (
          <PanelRow>
            <Text color={palette.textTertiary}>
              {symbols.bullet} Large caps = more stable {symbols.bullet} P/E less relevant for growth
            </Text>
          </PanelRow>
        )}
        <PanelRow>
          <Text color={palette.textTertiary}>
            Presets: gainers, losers, active, value, growth, dividend, tech, healthcare, finance
          </Text>
        </PanelRow>
      </Section>
    </Panel>
  );
}

export default ScreenerResultsView;
