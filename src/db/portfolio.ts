import { getDb } from './index.js';
import { getQuotes } from '../services/market.js';
import type { Holding, Portfolio } from '../types/index.js';

interface HoldingRow {
  id: number;
  symbol: string;
  shares: number;
  cost_basis: number;
}

export function getHoldings(): Holding[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, symbol, shares, cost_basis FROM holdings ORDER BY symbol')
    .all() as HoldingRow[];

  return rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    shares: r.shares,
    costBasis: r.cost_basis,
  }));
}

export function addHolding(
  symbol: string,
  shares: number,
  costBasis: number
): Holding {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO holdings (symbol, shares, cost_basis) VALUES (?, ?, ?)')
    .run(symbol.toUpperCase(), shares, costBasis);

  return {
    id: result.lastInsertRowid as number,
    symbol: symbol.toUpperCase(),
    shares,
    costBasis,
  };
}

export function removeHolding(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM holdings WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateHolding(
  id: number,
  shares: number,
  costBasis: number
): boolean {
  const db = getDb();
  const result = db
    .prepare('UPDATE holdings SET shares = ?, cost_basis = ? WHERE id = ?')
    .run(shares, costBasis, id);
  return result.changes > 0;
}

export async function getPortfolio(): Promise<Portfolio> {
  const holdings = getHoldings();

  if (holdings.length === 0) {
    return {
      holdings: [],
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPercent: 0,
    };
  }

  // Fetch current prices
  const symbols = [...new Set(holdings.map((h) => h.symbol))];
  const quotes = await getQuotes(symbols);
  const priceMap = new Map(quotes.map((q) => [q.symbol, q.price]));

  // Calculate values
  let totalValue = 0;
  let totalCost = 0;

  const enrichedHoldings = holdings.map((h) => {
    const price = priceMap.get(h.symbol) || 0;
    const value = price * h.shares;
    const cost = h.costBasis * h.shares;
    const gain = value - cost;
    const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

    totalValue += value;
    totalCost += cost;

    return {
      ...h,
      currentPrice: price,
      value,
      gain,
      gainPercent,
    };
  });

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return {
    holdings: enrichedHoldings,
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
  };
}
