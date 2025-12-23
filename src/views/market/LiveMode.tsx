/**
 * LiveMode Component
 *
 * Enhanced real-time monitoring view with intraday charts,
 * volume analysis, and market context.
 * Uses the DevFolio design system for consistent UI.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box as InkBox, Text, useInput } from 'ink';
import {
  getIntradayData,
  getMarketContextQuick,
  setLiveMode,
  getRefreshMultiplier,
  getRateLimitStatus,
  type IntradayData,
  type MarketContext,
} from '../../services/market.js';
import { LIVE_MODE_INTERVAL_MS } from '../../constants/index.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette } from '../../design/tokens.js';
import { arrows, progress } from '../../design/symbols.js';
import { borders } from '../../design/borders.js';

interface LiveModeProps {
  symbols: string[];
}

// Format helpers
function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPriceCompact(price: number): string {
  if (price >= 10000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 1000) return `$${(price / 1000).toFixed(2)}k`;
  return `$${price.toFixed(2)}`;
}

function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}$${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + 'B';
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + 'M';
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + 'K';
  return vol.toString();
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? 'p' : 'a';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')}${suffix}`;
}

function getMarketStateInfo(state: string): { text: string; color: string } {
  switch (state) {
    case 'PRE': return { text: 'PRE-MARKET', color: palette.warning };
    case 'REGULAR': return { text: 'MARKET OPEN', color: palette.positive };
    case 'POST': return { text: 'AFTER-HOURS', color: palette.warning };
    default: return { text: 'MARKET CLOSED', color: palette.textTertiary };
  }
}

// ASCII chart renderer for intraday data
function IntradayChart({ bars, width = 54 }: { bars: { time: Date; price: number }[]; width?: number }): React.ReactElement {
  if (bars.length < 2) {
    return (
      <PanelRow>
        <Text color={palette.textTertiary}>No intraday data available</Text>
      </PanelRow>
    );
  }

  const height = 6;
  const prices = bars.map(b => b.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const midPrice = (minPrice + maxPrice) / 2;

  // Create chart grid
  const chart: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));

  // Plot prices
  for (let x = 0; x < width; x++) {
    const barIndex = Math.min(Math.floor(x * bars.length / width), bars.length - 1);
    const bar = bars[barIndex];
    const normalizedY = (bar.price - minPrice) / range;
    const y = Math.max(0, Math.min(height - 1, Math.floor((1 - normalizedY) * (height - 1))));
    chart[y][x] = progress.full;
    for (let fillY = y + 1; fillY < height; fillY++) {
      chart[fillY][x] = progress.empty;
    }
  }

  // Price labels (8 chars wide)
  const LABEL_WIDTH = 9;
  const formatLabel = (p: number) => formatPriceCompact(p).padStart(LABEL_WIDTH - 1);

  // Build chart rows
  const chartRows: React.ReactElement[] = [];
  for (let y = 0; y < height; y++) {
    let label: string;
    if (y === 0) label = formatLabel(maxPrice);
    else if (y === height - 1) label = formatLabel(minPrice);
    else if (y === Math.floor(height / 2)) label = formatLabel(midPrice);
    else label = ' '.repeat(LABEL_WIDTH - 1);

    chartRows.push(
      <PanelRow key={y} padding={0}>
        <Text color={palette.textTertiary}>{label}</Text>
        <Text color={palette.border}>{borders.vertical}</Text>
        <Text color={palette.accent}>{chart[y].join('')}</Text>
      </PanelRow>
    );
  }

  // Time axis
  const timeLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const idx = Math.min(Math.floor(pct * (bars.length - 1)), bars.length - 1);
    return formatTime(bars[idx].time);
  });

  // Build time axis string
  const axisWidth = width;
  const timeLine = new Array(axisWidth).fill(' ');
  const positions = [0, Math.floor(axisWidth * 0.25), Math.floor(axisWidth * 0.5), Math.floor(axisWidth * 0.75), axisWidth - 6];
  positions.forEach((pos, i) => {
    const label = timeLabels[i];
    for (let j = 0; j < label.length && pos + j < axisWidth; j++) {
      timeLine[pos + j] = label[j];
    }
  });

  return (
    <>
      {chartRows}
      <PanelRow padding={0}>
        <Text color={palette.textTertiary}>{' '.repeat(LABEL_WIDTH - 1)}</Text>
        <Text color={palette.border}>{borders.bottomLeft}</Text>
        <Text color={palette.border}>{borders.horizontal.repeat(width)}</Text>
      </PanelRow>
      <PanelRow padding={0}>
        <Text color={palette.textTertiary}>{' '.repeat(LABEL_WIDTH)}{timeLine.join('')}</Text>
      </PanelRow>
    </>
  );
}

// Day range progress bar component
function DayRangeBar({ current, low, high }: { current: number; low: number; high: number }): React.ReactElement {
  const width = 20;
  const range = high - low || 1;
  const position = Math.round(((current - low) / range) * width);
  const filled = Math.max(0, Math.min(width, position));

  const bar = progress.full.repeat(filled) + progress.empty.repeat(width - filled);
  const label = position > width * 0.8 ? 'Near High' : position < width * 0.2 ? 'Near Low' : 'Mid-Range';

  return (
    <InkBox>
      <Text color={palette.border}>[</Text>
      <Text color={palette.accent}>{bar}</Text>
      <Text color={palette.border}>]</Text>
      <Text color={palette.textSecondary}> {label}</Text>
    </InkBox>
  );
}

// Volume bar component
function VolumeBar({ relativeVolume }: { relativeVolume: number }): React.ReactElement {
  const width = 20;
  const capped = Math.min(relativeVolume, 3);
  const filled = Math.round((capped / 3) * width);
  const bar = progress.full.repeat(filled) + progress.empty.repeat(width - filled);

  let label = 'Normal';
  let labelColor: string = palette.textSecondary;
  if (relativeVolume >= 2) { label = 'Heavy'; labelColor = palette.warning; }
  else if (relativeVolume >= 1.5) { label = 'Above Avg'; labelColor = palette.positive; }
  else if (relativeVolume < 0.5) { label = 'Light'; labelColor = palette.textTertiary; }

  return (
    <InkBox>
      <Text color={palette.border}>[</Text>
      <Text color={palette.accent}>{bar}</Text>
      <Text color={palette.border}>]</Text>
      <Text color={palette.textSecondary}> {(relativeVolume * 100).toFixed(0)}% avg </Text>
      <Text color={labelColor}>{label}</Text>
    </InkBox>
  );
}

// Market context badge
function MarketBadge({ label, value, changePercent }: { label: string; value?: number; changePercent?: number }): React.ReactElement {
  const isPositive = (changePercent ?? 0) >= 0;
  const color = isPositive ? palette.positive : palette.negative;
  const arrow = isPositive ? arrows.up : arrows.down;

  if (changePercent !== undefined) {
    return (
      <InkBox marginRight={2}>
        <Text color={palette.textTertiary}>{label} </Text>
        <Text color={color}>{arrow}{Math.abs(changePercent).toFixed(2)}%</Text>
      </InkBox>
    );
  }

  // For VIX - value based coloring
  const vixColor = (value ?? 0) > 20 ? palette.negative : (value ?? 0) > 15 ? palette.warning : palette.positive;
  return (
    <InkBox marginRight={2}>
      <Text color={palette.textTertiary}>{label} </Text>
      <Text color={vixColor}>{value?.toFixed(1)}</Text>
    </InkBox>
  );
}

// 52-week range bar component
function YearRangeBar({ current, low, high }: { current: number; low: number; high: number }): React.ReactElement {
  const width = 16;
  const range = high - low || 1;
  const position = Math.round(((current - low) / range) * width);
  const filled = Math.max(0, Math.min(width, position));

  const bar = progress.full.repeat(filled) + progress.empty.repeat(width - filled);
  const pctFromHigh = high > 0 ? ((high - current) / high) * 100 : 0;
  const label = pctFromHigh < 5 ? 'Near High' : pctFromHigh > 40 ? 'Oversold?' : '';

  return (
    <InkBox>
      <Text color={palette.border}>[</Text>
      <Text color={palette.info}>{bar}</Text>
      <Text color={palette.border}>]</Text>
      {label && <Text color={pctFromHigh < 5 ? palette.warning : palette.positive}> {label}</Text>}
    </InkBox>
  );
}

// Format market cap
function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

// Performance badge component
function PerfBadge({ label, value }: { label: string; value: number | null }): React.ReactElement | null {
  if (value === null) return null;
  const isPositive = value >= 0;
  const color = isPositive ? palette.positive : palette.negative;
  const sign = isPositive ? '+' : '';

  return (
    <InkBox marginRight={2}>
      <Text color={palette.textTertiary}>{label} </Text>
      <Text color={color}>{sign}{value.toFixed(1)}%</Text>
    </InkBox>
  );
}

// Single symbol live view
function SymbolLiveView({ data, marketContext }: { data: IntradayData; marketContext: MarketContext }): React.ReactElement {
  const isPositive = data.changePercent >= 0;
  const priceColor = isPositive ? palette.positive : palette.negative;
  const arrow = isPositive ? arrows.up : arrows.down;
  const marketState = getMarketStateInfo(data.marketState);

  // Calculate relative performance vs market
  const spyChange = marketContext.spy?.changePercent ?? 0;
  const relativePerf = data.changePercent - spyChange;
  const perfLabel = relativePerf > 0.5 ? 'outperforming' : relativePerf < -0.5 ? 'underperforming' : 'tracking';
  const perfColor = relativePerf > 0.5 ? palette.positive : relativePerf < -0.5 ? palette.negative : palette.textSecondary;

  return (
    <Panel width={78} title={data.symbol} borderColor={palette.accent}>
      {/* Header row with status and key stats */}
      <PanelRow>
        <InkBox justifyContent="space-between" width={74}>
          <InkBox>
            <Text color={marketState.color}>{marketState.text}</Text>
            {data.marketCap > 0 && (
              <>
                <Text color={palette.textTertiary}> {borders.vertical} </Text>
                <Text color={palette.textSecondary}>{formatMarketCap(data.marketCap)}</Text>
              </>
            )}
            {data.peRatio && (
              <>
                <Text color={palette.textTertiary}> {borders.vertical} P/E </Text>
                <Text color={palette.textSecondary}>{data.peRatio.toFixed(1)}</Text>
              </>
            )}
          </InkBox>
          <Text color={palette.textSecondary}>Vol: {formatVolume(data.volume)}</Text>
        </InkBox>
      </PanelRow>

      {/* Price row */}
      <PanelRow>
        <InkBox>
          <Text bold color={palette.text}>${formatPrice(data.currentPrice)}  </Text>
          <Text color={priceColor}>{arrow} {formatChange(data.change, data.changePercent)}</Text>
        </InkBox>
      </PanelRow>

      {/* Day range */}
      <PanelRow>
        <InkBox>
          <Text color={palette.textTertiary}>Day:  </Text>
          <Text color={palette.textSecondary}>${formatPrice(data.dayLow)} - ${formatPrice(data.dayHigh)}  </Text>
          <DayRangeBar current={data.currentPrice} low={data.dayLow} high={data.dayHigh} />
        </InkBox>
      </PanelRow>

      {/* 52-week range */}
      {data.fiftyTwoWeekHigh > 0 && (
        <PanelRow>
          <InkBox>
            <Text color={palette.textTertiary}>52wk: </Text>
            <Text color={palette.textSecondary}>${formatPrice(data.fiftyTwoWeekLow)} - ${formatPrice(data.fiftyTwoWeekHigh)}  </Text>
            <YearRangeBar current={data.currentPrice} low={data.fiftyTwoWeekLow} high={data.fiftyTwoWeekHigh} />
          </InkBox>
        </PanelRow>
      )}

      {/* Intraday Chart Section */}
      <Section title="Intraday (5m)">
        <IntradayChart bars={data.bars} width={54} />
      </Section>

      {/* Performance Section - show if we have data */}
      {(data.performance.ytd !== null || data.performance.year !== null) && (
        <Section title="Performance">
          <PanelRow>
            <InkBox>
              <PerfBadge label="Today" value={data.changePercent} />
              <PerfBadge label="YTD" value={data.performance.ytd} />
              <PerfBadge label="52wk" value={data.performance.year} />
            </InkBox>
          </PanelRow>
        </Section>
      )}

      {/* Market Context Section */}
      <Section title="Market Context">
        <PanelRow>
          <InkBox>
            {marketContext.spy && (
              <MarketBadge label="SPY" changePercent={marketContext.spy.changePercent} />
            )}
            {marketContext.qqq && (
              <MarketBadge label="QQQ" changePercent={marketContext.qqq.changePercent} />
            )}
            {marketContext.vix && (
              <MarketBadge label="VIX" value={marketContext.vix.value} />
            )}
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox>
            <Text color={palette.textTertiary}>{data.symbol} is </Text>
            <Text color={perfColor}>{perfLabel}</Text>
            <Text color={palette.textTertiary}> the market by </Text>
            <Text color={perfColor}>{relativePerf >= 0 ? '+' : ''}{relativePerf.toFixed(2)}%</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Volume Analysis Section */}
      <Section title="Volume">
        <PanelRow>
          <InkBox>
            <VolumeBar relativeVolume={data.relativeVolume} />
            <Text color={palette.textTertiary}>  Avg: {formatVolume(data.avgVolume)}</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox>
            <Text color={palette.textTertiary}>VWAP: </Text>
            <Text color={data.currentPrice >= data.vwap ? palette.positive : palette.negative}>
              ${formatPrice(data.vwap)}
            </Text>
            <Text color={palette.textTertiary}> (Price {data.currentPrice >= data.vwap ? 'above' : 'below'} avg)</Text>
          </InkBox>
        </PanelRow>
      </Section>
    </Panel>
  );
}

export function LiveModeView({ symbols: watchSymbols }: LiveModeProps): React.ReactElement {
  const [dataMap, setDataMap] = useState<Map<string, IntradayData>>(new Map());
  const [marketContext, setMarketContext] = useState<MarketContext>({ spy: null, qqq: null, vix: null });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [nextRefresh, setNextRefresh] = useState<number>(LIVE_MODE_INTERVAL_MS / 1000);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exited, setExited] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [currentInterval, setCurrentInterval] = useState(LIVE_MODE_INTERVAL_MS);

  // Store interval refs for cleanup
  const dataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle keyboard input for exit (ESC key only to avoid typing 'q' in input)
  useInput((_input, key) => {
    if (key.escape) {
      setExited(true);
      setLiveMode(false);
    }
  });

  const fetchData = useCallback(async () => {
    try {
      // Check rate limit status and adjust refresh interval
      const rateStatus = getRateLimitStatus();
      const multiplier = getRefreshMultiplier();
      const newInterval = LIVE_MODE_INTERVAL_MS * multiplier;

      // Update warning message if throttling
      if (rateStatus.status === 'warning') {
        setRateLimitWarning(`API usage ${rateStatus.percentUsed}% - slowing refresh`);
      } else if (rateStatus.status === 'critical') {
        setRateLimitWarning(`High API usage ${rateStatus.percentUsed}% - refresh slowed 4x`);
      } else if (rateStatus.status === 'blocked') {
        setRateLimitWarning(`Rate limit reached - minimal refresh active`);
      } else {
        setRateLimitWarning(null);
      }

      // Update interval if it changed
      if (newInterval !== currentInterval) {
        setCurrentInterval(newInterval);
        setNextRefresh(newInterval / 1000);
      }

      const [intradayResults, context] = await Promise.all([
        Promise.all(watchSymbols.map(s => getIntradayData(s))),
        getMarketContextQuick(),
      ]);

      const newMap = new Map<string, IntradayData>();
      intradayResults.forEach((data, i) => {
        if (data) newMap.set(watchSymbols[i], data);
      });

      setDataMap(newMap);
      setMarketContext(context);
      setLastUpdate(new Date());
      setError(null);
      setLoading(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch data';
      // Check if it's a rate limit block
      if (msg.includes('Rate limit')) {
        setRateLimitWarning(msg);
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  }, [watchSymbols.join(','), currentInterval]);

  // Set up intervals with adaptive refresh
  useEffect(() => {
    if (exited) return;

    setLiveMode(true);
    fetchData();

    // Clear existing intervals
    if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Set up data fetch interval (adaptive)
    dataIntervalRef.current = setInterval(fetchData, currentInterval);

    // Set up countdown interval
    countdownIntervalRef.current = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) return currentInterval / 1000;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (dataIntervalRef.current) clearInterval(dataIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setLiveMode(false);
    };
  }, [fetchData, exited, currentInterval]);

  // Show exit message when user exits
  if (exited) {
    return (
      <InkBox paddingX={1} marginY={1}>
        <Text color={palette.textSecondary}>Live mode stopped. Last update: {lastUpdate.toLocaleTimeString()}</Text>
      </InkBox>
    );
  }

  if (loading) {
    return (
      <Panel width={78} title="Live Mode">
        <PanelRow>
          <Text color={palette.accent}>Loading live data...</Text>
        </PanelRow>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel width={78} title="Live Mode">
        <PanelRow>
          <Text color={palette.negative}>{error}</Text>
        </PanelRow>
      </Panel>
    );
  }

  return (
    <InkBox flexDirection="column">
      {/* Header */}
      <InkBox marginBottom={1} paddingX={1}>
        <Text bold color={palette.accent}>LIVE MODE</Text>
        <Text color={palette.textTertiary}> {borders.vertical} </Text>
        <Text color={palette.textSecondary}>{watchSymbols.join(', ')}</Text>
        <Text color={palette.textTertiary}> {borders.vertical} Next: </Text>
        <Text color={palette.warning}>{nextRefresh}s</Text>
        <Text color={palette.textTertiary}> {borders.vertical} </Text>
        <Text color={palette.textMuted}>Press </Text>
        <Text color={palette.accent}>ESC</Text>
        <Text color={palette.textMuted}> to exit</Text>
      </InkBox>

      {/* Rate limit warning banner */}
      {rateLimitWarning && (
        <InkBox paddingX={1} marginBottom={1}>
          <Text color={palette.warning}>{arrows.right} {rateLimitWarning}</Text>
        </InkBox>
      )}

      {/* Symbol views */}
      {watchSymbols.map(symbol => {
        const data = dataMap.get(symbol);
        if (!data) {
          return (
            <Panel key={symbol} width={78} title={symbol}>
              <PanelRow>
                <Text color={palette.warning}>No data available</Text>
              </PanelRow>
            </Panel>
          );
        }
        return <SymbolLiveView key={symbol} data={data} marketContext={marketContext} />;
      })}

      {/* Footer */}
      <InkBox paddingX={1} marginTop={1}>
        <Text color={palette.textTertiary}>Last update: {lastUpdate.toLocaleTimeString()}</Text>
      </InkBox>
    </InkBox>
  );
}

export default LiveModeView;
