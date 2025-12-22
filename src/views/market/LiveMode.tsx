/**
 * LiveMode Component
 *
 * Enhanced real-time monitoring view with intraday charts,
 * volume analysis, and market context.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text } from 'ink';
import {
  getIntradayData,
  getMarketContextQuick,
  setLiveMode,
  type IntradayData,
  type MarketContext,
} from '../../services/market.js';
import { LIVE_MODE_INTERVAL_MS } from '../../constants/index.js';

interface LiveModeProps {
  symbols: string[];
}

// ASCII chart renderer for intraday data
function renderIntradayChart(bars: { time: Date; price: number }[], width: number = 50, height: number = 6): string[] {
  if (bars.length < 2) return ['  No intraday data available'];

  const prices = bars.map(b => b.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  // Create chart grid
  const chart: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));

  // Plot prices
  const step = Math.max(1, Math.floor(bars.length / width));
  for (let x = 0; x < width && x * step < bars.length; x++) {
    const bar = bars[x * step];
    const normalizedY = (bar.price - minPrice) / range;
    const y = Math.floor((1 - normalizedY) * (height - 1));
    chart[y][x] = '█';

    // Fill below for area effect
    for (let fillY = y + 1; fillY < height; fillY++) {
      chart[fillY][x] = '░';
    }
  }

  // Format price labels
  const formatPrice = (p: number) => p >= 1000 ? `$${(p/1000).toFixed(1)}k` : `$${p.toFixed(2)}`;
  const maxLabel = formatPrice(maxPrice).padStart(8);
  const minLabel = formatPrice(minPrice).padStart(8);

  // Build output lines
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    const label = y === 0 ? maxLabel : y === height - 1 ? minLabel : '        ';
    lines.push(`${label} │${chart[y].join('')}`);
  }

  // Time axis
  const times = bars.filter((_, i) => i % Math.floor(bars.length / 4) === 0).slice(0, 4);
  const timeLabels = times.map(b => {
    const h = b.time.getHours();
    const m = b.time.getMinutes();
    const suffix = h >= 12 ? 'p' : 'a';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')}${suffix}`;
  });

  const spacing = Math.floor(width / 4);
  let timeAxis = '         └' + '─'.repeat(width);
  let timeLine = '          ';
  timeLabels.forEach((label, i) => {
    const pos = i * spacing;
    timeLine = timeLine.substring(0, 10 + pos) + label + timeLine.substring(10 + pos + label.length);
  });

  lines.push(timeAxis);
  lines.push(timeLine);

  return lines;
}

// Day range progress bar
function renderDayRange(current: number, low: number, high: number, width: number = 20): string {
  const range = high - low || 1;
  const position = Math.round(((current - low) / range) * width);
  const filled = Math.max(0, Math.min(width, position));

  const bar = '▓'.repeat(filled) + '░'.repeat(width - filled);
  const label = position > width * 0.8 ? 'Near High' : position < width * 0.2 ? 'Near Low' : 'Mid-Range';

  return `[${bar}] ${label}`;
}

// Volume bar
function renderVolumeBar(relativeVolume: number, width: number = 24): string {
  const capped = Math.min(relativeVolume, 3); // Cap at 3x for display
  const filled = Math.round((capped / 3) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);

  let label = 'Normal';
  if (relativeVolume >= 2) label = 'Heavy';
  else if (relativeVolume >= 1.5) label = 'Above Avg';
  else if (relativeVolume < 0.5) label = 'Light';

  return `[${bar}] ${(relativeVolume * 100).toFixed(0)}% avg  ${label}`;
}

// Format helpers
function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function formatMarketState(state: string): { text: string; color: string } {
  switch (state) {
    case 'PRE': return { text: 'PRE-MARKET', color: 'yellow' };
    case 'REGULAR': return { text: 'MARKET OPEN', color: 'green' };
    case 'POST': return { text: 'AFTER-HOURS', color: 'yellow' };
    default: return { text: 'MARKET CLOSED', color: 'gray' };
  }
}

// Single symbol live view
function SymbolLiveView({ data, marketContext }: { data: IntradayData; marketContext: MarketContext }): React.ReactElement {
  const isPositive = data.changePercent >= 0;
  const priceColor = isPositive ? 'green' : 'red';
  const arrow = isPositive ? '▲' : '▼';
  const marketState = formatMarketState(data.marketState);

  // Calculate relative performance vs market
  const spyChange = marketContext.spy?.changePercent ?? 0;
  const relativePerf = data.changePercent - spyChange;
  const perfLabel = relativePerf > 0 ? 'outperforming' : relativePerf < 0 ? 'underperforming' : 'matching';

  const chartLines = renderIntradayChart(data.bars, 48, 5);

  return (
    <Box flexDirection="column">
      {/* Header with price */}
      <Box borderStyle="single" borderColor="cyan" flexDirection="column" paddingX={1}>
        <Box justifyContent="space-between">
          <Box>
            <Text bold color="cyan">{data.symbol}</Text>
            <Text color="gray"> - </Text>
            <Text color={marketState.color as any}>{marketState.text}</Text>
          </Box>
          <Text color="gray">Vol: {formatVolume(data.volume)}</Text>
        </Box>

        {/* Price line */}
        <Box marginY={1}>
          <Text bold color="white" wrap="truncate">
            {'  '}${formatPrice(data.currentPrice)}{'  '}
          </Text>
          <Text color={priceColor}>
            {arrow} {formatChange(data.change, data.changePercent)}
          </Text>
        </Box>

        {/* Day range */}
        <Box>
          <Text color="gray">Day: ${formatPrice(data.dayLow)} - ${formatPrice(data.dayHigh)}  </Text>
          <Text>{renderDayRange(data.currentPrice, data.dayLow, data.dayHigh, 16)}</Text>
        </Box>
      </Box>

      {/* Intraday Chart */}
      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1} marginTop={0}>
        <Text bold color="white">Intraday (5m)</Text>
        {chartLines.map((line, i) => (
          <Text key={i} color={i < chartLines.length - 2 ? 'cyan' : 'gray'}>{line}</Text>
        ))}
      </Box>

      {/* Market Context */}
      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1} marginTop={0}>
        <Text bold color="white">Market Context</Text>
        <Box marginTop={1}>
          {marketContext.spy && (
            <Box marginRight={2}>
              <Text color="gray">SPY </Text>
              <Text color={marketContext.spy.changePercent >= 0 ? 'green' : 'red'}>
                {marketContext.spy.changePercent >= 0 ? '▲' : '▼'}
                {marketContext.spy.changePercent.toFixed(2)}%
              </Text>
            </Box>
          )}
          {marketContext.qqq && (
            <Box marginRight={2}>
              <Text color="gray">QQQ </Text>
              <Text color={marketContext.qqq.changePercent >= 0 ? 'green' : 'red'}>
                {marketContext.qqq.changePercent >= 0 ? '▲' : '▼'}
                {marketContext.qqq.changePercent.toFixed(2)}%
              </Text>
            </Box>
          )}
          {marketContext.vix && (
            <Box marginRight={2}>
              <Text color="gray">VIX </Text>
              <Text color={marketContext.vix.value > 20 ? 'red' : marketContext.vix.value > 15 ? 'yellow' : 'green'}>
                {marketContext.vix.value.toFixed(1)}
              </Text>
            </Box>
          )}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">{data.symbol} is </Text>
          <Text color={relativePerf >= 0 ? 'green' : 'red'}>{perfLabel}</Text>
          <Text color="gray"> the market by </Text>
          <Text color={relativePerf >= 0 ? 'green' : 'red'}>
            {relativePerf >= 0 ? '+' : ''}{relativePerf.toFixed(2)}%
          </Text>
        </Box>
      </Box>

      {/* Volume Analysis */}
      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1} marginTop={0}>
        <Text bold color="white">Volume Analysis</Text>
        <Box marginTop={1}>
          <Text>{renderVolumeBar(data.relativeVolume, 20)}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">VWAP: </Text>
          <Text color={data.currentPrice >= data.vwap ? 'green' : 'red'}>
            ${formatPrice(data.vwap)}
          </Text>
          <Text color="gray"> (Price {data.currentPrice >= data.vwap ? 'above' : 'below'} avg)</Text>
        </Box>
      </Box>
    </Box>
  );
}

export function LiveModeView({ symbols }: LiveModeProps): React.ReactElement {
  const [dataMap, setDataMap] = useState<Map<string, IntradayData>>(new Map());
  const [marketContext, setMarketContext] = useState<MarketContext>({ spy: null, qqq: null, vix: null });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [nextRefresh, setNextRefresh] = useState<number>(LIVE_MODE_INTERVAL_MS / 1000);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [intradayResults, context] = await Promise.all([
        Promise.all(symbols.map(s => getIntradayData(s))),
        getMarketContextQuick(),
      ]);

      const newMap = new Map<string, IntradayData>();
      intradayResults.forEach((data, i) => {
        if (data) newMap.set(symbols[i], data);
      });

      setDataMap(newMap);
      setMarketContext(context);
      setLastUpdate(new Date());
      setError(null);
      setLoading(false);
    } catch (e) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  }, [symbols.join(',')]);

  useEffect(() => {
    // Enable live mode (bypasses cache)
    setLiveMode(true);

    // Initial fetch
    fetchData();

    // Set up refresh interval
    const dataInterval = setInterval(fetchData, LIVE_MODE_INTERVAL_MS);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) return LIVE_MODE_INTERVAL_MS / 1000;
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(dataInterval);
      clearInterval(countdownInterval);
      setLiveMode(false);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="cyan">Loading live data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1} paddingX={1}>
        <Text bold color="cyan">LIVE MODE</Text>
        <Text color="gray"> - {symbols.join(', ')}</Text>
        <Text color="gray"> - Next refresh: </Text>
        <Text color="yellow">{nextRefresh}s</Text>
        <Text color="gray"> - Ctrl+C to stop</Text>
      </Box>

      {/* Symbol views */}
      {symbols.map(symbol => {
        const data = dataMap.get(symbol);
        if (!data) {
          return (
            <Box key={symbol} paddingX={1} marginBottom={1}>
              <Text color="yellow">{symbol}: No data available</Text>
            </Box>
          );
        }
        return (
          <Box key={symbol} marginBottom={1}>
            <SymbolLiveView data={data} marketContext={marketContext} />
          </Box>
        );
      })}

      {/* Footer */}
      <Box paddingX={1} marginTop={1}>
        <Text color="gray">Last update: {lastUpdate.toLocaleTimeString()}</Text>
      </Box>
    </Box>
  );
}
