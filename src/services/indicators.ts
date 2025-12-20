/**
 * Technical Indicators Service
 * Calculates RSI, MACD, Moving Averages, Bollinger Bands, and Volume Analysis
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface IndicatorData {
  sma20: number[];
  sma50: number[];
  sma200: number[];
  ema20: number[];
  rsi: number[];
  macd: MACDResult;
  bollingerBands: BollingerBandsResult;
  volumeMA: number[];
  volumeSpikes: boolean[];
  latestRSI: number | null;
  latestMACD: { macd: number; signal: number; histogram: number } | null;
  latestBB: { upper: number; middle: number; lower: number; price: number } | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Simple Moving Average (SMA)
// ═══════════════════════════════════════════════════════════════════════════

export function calculateSMA(data: number[], period: number): number[] {
  if (data.length < period) return [];

  const result: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Exponential Moving Average (EMA)
// ═══════════════════════════════════════════════════════════════════════════

export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) return [];

  const multiplier = 2 / (period + 1);
  const result: number[] = [];

  // First EMA value is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let ema = sum / period;
  result.push(ema);

  // Calculate remaining EMA values
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Relative Strength Index (RSI)
// ═══════════════════════════════════════════════════════════════════════════

export function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length < period + 1) return [];

  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const result: number[] = [];

  // First RSI - use simple average
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }

  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  if (avgLoss === 0) {
    result.push(100);
  } else {
    const rs = avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  // Subsequent RSI values using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MACD (Moving Average Convergence Divergence)
// ═══════════════════════════════════════════════════════════════════════════

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const emptyResult: MACDResult = { macd: [], signal: [], histogram: [] };

  if (closes.length < slowPeriod) return emptyResult;

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // MACD line = Fast EMA - Slow EMA
  // Need to align the arrays (slow EMA starts later)
  const offset = slowPeriod - fastPeriod;
  const macdLine: number[] = [];

  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }

  if (macdLine.length < signalPeriod) {
    return { macd: macdLine, signal: [], histogram: [] };
  }

  // Signal line = EMA of MACD line
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Histogram = MACD - Signal
  const histOffset = signalPeriod - 1;
  const histogram: number[] = [];

  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + histOffset] - signalLine[i]);
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Bollinger Bands
// ═══════════════════════════════════════════════════════════════════════════

export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
  if (closes.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const middle = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = period - 1; i < closes.length; i++) {
    // Calculate standard deviation for this window
    const window = closes.slice(i - period + 1, i + 1);
    const mean = middle[i - period + 1];

    let sumSquares = 0;
    for (const val of window) {
      sumSquares += Math.pow(val - mean, 2);
    }
    const std = Math.sqrt(sumSquares / period);

    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
  }

  return { upper, middle, lower };
}

// ═══════════════════════════════════════════════════════════════════════════
// Volume Analysis
// ═══════════════════════════════════════════════════════════════════════════

export function calculateVolumeMA(volumes: number[], period: number = 20): number[] {
  return calculateSMA(volumes, period);
}

export function detectVolumeSpikes(
  volumes: number[],
  period: number = 20,
  threshold: number = 2
): boolean[] {
  const ma = calculateVolumeMA(volumes, period);
  const spikes: boolean[] = [];

  // Pad with false for initial period
  for (let i = 0; i < period - 1; i++) {
    spikes.push(false);
  }

  // Detect spikes
  for (let i = 0; i < ma.length; i++) {
    const volume = volumes[i + period - 1];
    spikes.push(volume > ma[i] * threshold);
  }

  return spikes;
}

// ═══════════════════════════════════════════════════════════════════════════
// Calculate All Indicators
// ═══════════════════════════════════════════════════════════════════════════

export function calculateAllIndicators(
  data: OHLCV[],
  rsiPeriod: number = 14,
  bbPeriod: number = 20,
  bbStdDev: number = 2
): IndicatorData {
  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema20 = calculateEMA(closes, 20);
  const rsi = calculateRSI(closes, rsiPeriod);
  const macd = calculateMACD(closes);
  const bollingerBands = calculateBollingerBands(closes, bbPeriod, bbStdDev);
  const volumeMA = calculateVolumeMA(volumes);
  const volumeSpikes = detectVolumeSpikes(volumes);

  // Get latest values
  const latestRSI = rsi.length > 0 ? rsi[rsi.length - 1] : null;

  const latestMACD =
    macd.macd.length > 0 && macd.signal.length > 0 && macd.histogram.length > 0
      ? {
          macd: macd.macd[macd.macd.length - 1],
          signal: macd.signal[macd.signal.length - 1],
          histogram: macd.histogram[macd.histogram.length - 1],
        }
      : null;

  const latestBB =
    bollingerBands.upper.length > 0
      ? {
          upper: bollingerBands.upper[bollingerBands.upper.length - 1],
          middle: bollingerBands.middle[bollingerBands.middle.length - 1],
          lower: bollingerBands.lower[bollingerBands.lower.length - 1],
          price: closes[closes.length - 1],
        }
      : null;

  return {
    sma20,
    sma50,
    sma200,
    ema20,
    rsi,
    macd,
    bollingerBands,
    volumeMA,
    volumeSpikes,
    latestRSI,
    latestMACD,
    latestBB,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Signal Interpretation
// ═══════════════════════════════════════════════════════════════════════════

export type Signal = 'bullish' | 'bearish' | 'neutral';

export function interpretRSI(rsi: number | null, overbought = 70, oversold = 30): Signal {
  if (rsi === null) return 'neutral';
  if (rsi >= overbought) return 'bearish'; // Overbought
  if (rsi <= oversold) return 'bullish'; // Oversold
  return 'neutral';
}

export function interpretMACD(macd: { macd: number; signal: number; histogram: number } | null): Signal {
  if (!macd) return 'neutral';

  // Bullish if MACD above signal (positive histogram) and trending up
  if (macd.histogram > 0) return 'bullish';
  if (macd.histogram < 0) return 'bearish';
  return 'neutral';
}

export function interpretBollingerBands(
  bb: { upper: number; middle: number; lower: number; price: number } | null
): Signal {
  if (!bb) return 'neutral';

  // Price near upper band = overbought (bearish)
  // Price near lower band = oversold (bullish)
  const range = bb.upper - bb.lower;
  const position = (bb.price - bb.lower) / range;

  if (position >= 0.9) return 'bearish'; // Near upper band
  if (position <= 0.1) return 'bullish'; // Near lower band
  return 'neutral';
}

export interface TechnicalSummary {
  overall: Signal;
  rsiSignal: Signal;
  macdSignal: Signal;
  bbSignal: Signal;
  rsiValue: number | null;
  macdValue: { macd: number; signal: number; histogram: number } | null;
  bbPosition: 'upper' | 'middle' | 'lower' | null;
}

export function getTechnicalSummary(indicators: IndicatorData): TechnicalSummary {
  const rsiSignal = interpretRSI(indicators.latestRSI);
  const macdSignal = interpretMACD(indicators.latestMACD);
  const bbSignal = interpretBollingerBands(indicators.latestBB);

  // Determine BB position
  let bbPosition: 'upper' | 'middle' | 'lower' | null = null;
  if (indicators.latestBB) {
    const range = indicators.latestBB.upper - indicators.latestBB.lower;
    const position = (indicators.latestBB.price - indicators.latestBB.lower) / range;
    if (position >= 0.7) bbPosition = 'upper';
    else if (position <= 0.3) bbPosition = 'lower';
    else bbPosition = 'middle';
  }

  // Calculate overall signal (simple majority)
  const signals = [rsiSignal, macdSignal, bbSignal];
  const bullishCount = signals.filter(s => s === 'bullish').length;
  const bearishCount = signals.filter(s => s === 'bearish').length;

  let overall: Signal = 'neutral';
  if (bullishCount > bearishCount) overall = 'bullish';
  else if (bearishCount > bullishCount) overall = 'bearish';

  return {
    overall,
    rsiSignal,
    macdSignal,
    bbSignal,
    rsiValue: indicators.latestRSI,
    macdValue: indicators.latestMACD,
    bbPosition,
  };
}
