/**
 * Options Data Service
 * Fetches options chains and calculates Greeks using Yahoo Finance
 */

import YahooFinance from 'yahoo-finance2';

// Initialize Yahoo Finance client
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
});

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface OptionsContract {
  contractSymbol: string;
  strike: number;
  expiry: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  // Greeks (calculated)
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface OptionsExpiry {
  date: string;
  daysToExpiry: number;
  calls: OptionsContract[];
  puts: OptionsContract[];
}

export interface OptionsChain {
  symbol: string;
  underlyingPrice: number;
  expirations: string[];
  chains: Record<string, OptionsExpiry>;
}

export interface OptionsOverview {
  symbol: string;
  underlyingPrice: number;
  totalCallVolume: number;
  totalPutVolume: number;
  putCallRatio: number;
  avgImpliedVolatility: number;
  nearestExpiry: string;
  nextEarnings: string | null;
  unusualActivity: UnusualActivity[];
}

export interface UnusualActivity {
  contractSymbol: string;
  type: 'call' | 'put';
  strike: number;
  expiry: string;
  volume: number;
  openInterest: number;
  volumeOIRatio: number;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Greeks Calculation (Black-Scholes)
// ═══════════════════════════════════════════════════════════════════════════

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

interface GreeksInput {
  stockPrice: number;
  strikePrice: number;
  timeToExpiry: number; // in years
  riskFreeRate: number;
  impliedVolatility: number;
  optionType: 'call' | 'put';
}

interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

function calculateGreeks(input: GreeksInput): Greeks {
  const { stockPrice, strikePrice, timeToExpiry, riskFreeRate, impliedVolatility, optionType } = input;

  // Handle edge cases
  if (timeToExpiry <= 0 || impliedVolatility <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0 };
  }

  const sqrtT = Math.sqrt(timeToExpiry);
  const d1 = (Math.log(stockPrice / strikePrice) + (riskFreeRate + 0.5 * impliedVolatility * impliedVolatility) * timeToExpiry) /
             (impliedVolatility * sqrtT);
  const d2 = d1 - impliedVolatility * sqrtT;

  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const npd1 = normalPDF(d1);

  // Delta
  let delta: number;
  if (optionType === 'call') {
    delta = nd1;
  } else {
    delta = nd1 - 1;
  }

  // Gamma (same for call and put)
  const gamma = npd1 / (stockPrice * impliedVolatility * sqrtT);

  // Theta
  const expRT = Math.exp(-riskFreeRate * timeToExpiry);
  let theta: number;
  if (optionType === 'call') {
    theta = (-stockPrice * npd1 * impliedVolatility / (2 * sqrtT)) -
            (riskFreeRate * strikePrice * expRT * nd2);
  } else {
    theta = (-stockPrice * npd1 * impliedVolatility / (2 * sqrtT)) +
            (riskFreeRate * strikePrice * expRT * normalCDF(-d2));
  }
  theta = theta / 365; // Convert to daily

  // Vega (same for call and put)
  const vega = stockPrice * sqrtT * npd1 / 100; // Divide by 100 for 1% change

  return {
    delta: Math.round(delta * 1000) / 1000,
    gamma: Math.round(gamma * 10000) / 10000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Options Chain Fetching
// ═══════════════════════════════════════════════════════════════════════════

export async function getOptionsExpirations(symbol: string): Promise<string[]> {
  try {
    const data = await yahooFinance.options(symbol);
    return data.expirationDates?.map(d => d.toISOString().split('T')[0]) ?? [];
  } catch {
    return [];
  }
}

export async function getOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain | null> {
  try {
    // First get the quote for underlying price
    const quote = await yahooFinance.quote(symbol);
    const underlyingPrice = quote.regularMarketPrice ?? 0;

    // Get options data
    const optionsData = await yahooFinance.options(symbol, expiry ? { date: new Date(expiry) } : undefined);

    if (!optionsData.options || optionsData.options.length === 0) {
      return null;
    }

    const expirations = optionsData.expirationDates?.map(d => d.toISOString().split('T')[0]) ?? [];
    const chains: Record<string, OptionsExpiry> = {};

    const riskFreeRate = 0.05; // Approximate current rate
    const now = new Date();

    for (const chain of optionsData.options) {
      const expiryDate = chain.expirationDate?.toISOString().split('T')[0] ?? '';
      const expiryDateObj = new Date(expiryDate);
      const daysToExpiry = Math.max(0, Math.ceil((expiryDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const timeToExpiry = daysToExpiry / 365;

      const calls: OptionsContract[] = (chain.calls ?? []).map(c => {
        const iv = c.impliedVolatility ?? 0;
        const greeks = calculateGreeks({
          stockPrice: underlyingPrice,
          strikePrice: c.strike ?? 0,
          timeToExpiry,
          riskFreeRate,
          impliedVolatility: iv,
          optionType: 'call',
        });

        return {
          contractSymbol: c.contractSymbol ?? '',
          strike: c.strike ?? 0,
          expiry: expiryDate,
          type: 'call' as const,
          bid: c.bid ?? 0,
          ask: c.ask ?? 0,
          last: c.lastPrice ?? 0,
          change: c.change ?? 0,
          changePercent: c.percentChange ?? 0,
          volume: c.volume ?? 0,
          openInterest: c.openInterest ?? 0,
          impliedVolatility: iv,
          inTheMoney: c.inTheMoney ?? false,
          ...greeks,
        };
      });

      const puts: OptionsContract[] = (chain.puts ?? []).map(p => {
        const iv = p.impliedVolatility ?? 0;
        const greeks = calculateGreeks({
          stockPrice: underlyingPrice,
          strikePrice: p.strike ?? 0,
          timeToExpiry,
          riskFreeRate,
          impliedVolatility: iv,
          optionType: 'put',
        });

        return {
          contractSymbol: p.contractSymbol ?? '',
          strike: p.strike ?? 0,
          expiry: expiryDate,
          type: 'put' as const,
          bid: p.bid ?? 0,
          ask: p.ask ?? 0,
          last: p.lastPrice ?? 0,
          change: p.change ?? 0,
          changePercent: p.percentChange ?? 0,
          volume: p.volume ?? 0,
          openInterest: p.openInterest ?? 0,
          impliedVolatility: iv,
          inTheMoney: p.inTheMoney ?? false,
          ...greeks,
        };
      });

      chains[expiryDate] = {
        date: expiryDate,
        daysToExpiry,
        calls,
        puts,
      };
    }

    return {
      symbol: symbol.toUpperCase(),
      underlyingPrice,
      expirations,
      chains,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Options Overview
// ═══════════════════════════════════════════════════════════════════════════

export async function getOptionsOverview(symbol: string): Promise<OptionsOverview | null> {
  const chain = await getOptionsChain(symbol);

  if (!chain) {
    return null;
  }

  let totalCallVolume = 0;
  let totalPutVolume = 0;
  let totalIV = 0;
  let ivCount = 0;
  const unusualActivity: UnusualActivity[] = [];

  const expiryDates = Object.keys(chain.chains).sort();
  const nearestExpiry = expiryDates[0] ?? '';

  for (const expiry of expiryDates) {
    const exp = chain.chains[expiry];

    for (const call of exp.calls) {
      totalCallVolume += call.volume;
      if (call.impliedVolatility > 0) {
        totalIV += call.impliedVolatility;
        ivCount++;
      }

      // Check for unusual activity
      if (call.volume > 0 && call.openInterest > 0) {
        const voiRatio = call.volume / call.openInterest;
        if (voiRatio > 2 && call.volume > 1000) {
          unusualActivity.push({
            contractSymbol: call.contractSymbol,
            type: 'call',
            strike: call.strike,
            expiry: call.expiry,
            volume: call.volume,
            openInterest: call.openInterest,
            volumeOIRatio: voiRatio,
            reason: `High V/OI ratio (${voiRatio.toFixed(1)}x) with ${call.volume.toLocaleString()} volume`,
          });
        }
      }
    }

    for (const put of exp.puts) {
      totalPutVolume += put.volume;
      if (put.impliedVolatility > 0) {
        totalIV += put.impliedVolatility;
        ivCount++;
      }

      // Check for unusual activity
      if (put.volume > 0 && put.openInterest > 0) {
        const voiRatio = put.volume / put.openInterest;
        if (voiRatio > 2 && put.volume > 1000) {
          unusualActivity.push({
            contractSymbol: put.contractSymbol,
            type: 'put',
            strike: put.strike,
            expiry: put.expiry,
            volume: put.volume,
            openInterest: put.openInterest,
            volumeOIRatio: voiRatio,
            reason: `High V/OI ratio (${voiRatio.toFixed(1)}x) with ${put.volume.toLocaleString()} volume`,
          });
        }
      }
    }
  }

  // Sort unusual activity by volume
  unusualActivity.sort((a, b) => b.volume - a.volume);

  const putCallRatio = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0;
  const avgIV = ivCount > 0 ? totalIV / ivCount : 0;

  return {
    symbol: symbol.toUpperCase(),
    underlyingPrice: chain.underlyingPrice,
    totalCallVolume,
    totalPutVolume,
    putCallRatio: Math.round(putCallRatio * 100) / 100,
    avgImpliedVolatility: Math.round(avgIV * 10000) / 100, // Convert to percentage
    nearestExpiry,
    nextEarnings: null, // Could be enhanced with earnings calendar
    unusualActivity: unusualActivity.slice(0, 5),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

export function filterNearMoney(
  contracts: OptionsContract[],
  underlyingPrice: number,
  range = 0.1
): OptionsContract[] {
  const minStrike = underlyingPrice * (1 - range);
  const maxStrike = underlyingPrice * (1 + range);

  return contracts.filter(c => c.strike >= minStrike && c.strike <= maxStrike);
}

export function getStrikeRange(
  chain: OptionsExpiry,
  underlyingPrice: number,
  numStrikes = 5
): { calls: OptionsContract[]; puts: OptionsContract[] } {
  // Sort by distance from current price
  const sortByDistance = (a: OptionsContract, b: OptionsContract) =>
    Math.abs(a.strike - underlyingPrice) - Math.abs(b.strike - underlyingPrice);

  const nearCalls = [...chain.calls].sort(sortByDistance).slice(0, numStrikes);
  const nearPuts = [...chain.puts].sort(sortByDistance).slice(0, numStrikes);

  // Re-sort by strike for display
  nearCalls.sort((a, b) => a.strike - b.strike);
  nearPuts.sort((a, b) => a.strike - b.strike);

  return { calls: nearCalls, puts: nearPuts };
}
