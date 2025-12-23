/**
 * Comparison Verdict Service
 * AI-powered stock and ETF comparison recommendations
 */

import { complete } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import { buildStockComparisonPrompt, buildETFComparisonPrompt } from '../ai/promptLibrary.js';
import { getCompanyProfile, type CompanyProfile } from './market.js';
import { getETFProfile } from './etf.js';
import type { ETFProfile, ETFHolding } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CategoryWinner {
  category: string;
  winner: string;
  reason: string;
}

export interface ComparisonVerdict {
  winner: string;
  winnerReason: string;
  confidence: 'high' | 'medium' | 'low';
  categoryWinners: CategoryWinner[];
  tradeoffs: string;
  recommendation: string;
  bestFor: Record<string, string>; // e.g., { "growth": "NVDA", "income": "MSFT" }
}

interface VerdictResponse {
  winner: string;
  winnerReason: string;
  confidence: string;
  categoryWinners: Array<{
    category: string;
    winner: string;
    reason: string;
  }>;
  tradeoffs: string;
  recommendation: string;
  bestFor: Record<string, string>;
}

function isVerdictResponse(obj: unknown): obj is VerdictResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.winner === 'string' &&
    typeof o.winnerReason === 'string' &&
    typeof o.confidence === 'string' &&
    Array.isArray(o.categoryWinners) &&
    typeof o.tradeoffs === 'string' &&
    typeof o.recommendation === 'string'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Stock Comparison
// ═══════════════════════════════════════════════════════════════════════════

function formatStockForComparison(profile: CompanyProfile): string {
  return `${profile.symbol} (${profile.name}):
- Price: $${profile.price.toFixed(2)} (${profile.changePercent >= 0 ? '+' : ''}${profile.changePercent.toFixed(2)}%)
- Market Cap: $${profile.marketCap ? (profile.marketCap / 1e9).toFixed(1) : 'N/A'}B
- P/E: ${profile.peRatio?.toFixed(1) ?? 'N/A'}, Forward P/E: ${profile.forwardPE?.toFixed(1) ?? 'N/A'}
- Revenue Growth: ${profile.revenueGrowth ? `${(profile.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}
- Profit Margin: ${profile.profitMargin ? `${(profile.profitMargin * 100).toFixed(1)}%` : 'N/A'}
- Div Yield: ${profile.dividendYield ? `${(profile.dividendYield * 100).toFixed(2)}%` : 'N/A'}
- YTD Return: ${profile.ytdReturn !== null ? `${profile.ytdReturn >= 0 ? '+' : ''}${profile.ytdReturn.toFixed(1)}%` : 'N/A'}
- Analyst Target: $${profile.targetPrice?.toFixed(2) ?? 'N/A'} (${profile.recommendationKey ?? 'N/A'})`;
}

export async function getStockComparisonVerdict(symbols: string[]): Promise<ComparisonVerdict | null> {
  if (symbols.length < 2) return null;

  const profiles = await Promise.all(symbols.map(s => getCompanyProfile(s)));
  const validProfiles = profiles.filter((p): p is CompanyProfile => p !== null);

  if (validProfiles.length < 2) return null;

  const stocksData = validProfiles.map(formatStockForComparison).join('\n\n');
  const prompt = buildStockComparisonPrompt(stocksData);

  try {
    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 500,
        temperature: 0.3,
      },
      'summary'
    );

    if (!response.content) return null;

    const result = extractJson<VerdictResponse>(response.content, isVerdictResponse);
    if (!result.success || !result.data) return null;

    const validConfidence = ['high', 'medium', 'low'];

    return {
      winner: result.data.winner.toUpperCase(),
      winnerReason: result.data.winnerReason,
      confidence: (validConfidence.includes(result.data.confidence)
        ? result.data.confidence
        : 'medium') as 'high' | 'medium' | 'low',
      categoryWinners: result.data.categoryWinners.map(c => ({
        category: c.category,
        winner: c.winner.toUpperCase(),
        reason: c.reason,
      })),
      tradeoffs: result.data.tradeoffs,
      recommendation: result.data.recommendation,
      bestFor: result.data.bestFor ?? {},
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ETF Comparison
// ═══════════════════════════════════════════════════════════════════════════

function formatETFForComparison(etf: ETFProfile): string {
  return `${etf.symbol} (${etf.name}):
- Price: $${etf.price.toFixed(2)} (${etf.changePercent >= 0 ? '+' : ''}${etf.changePercent.toFixed(2)}%)
- Expense Ratio: ${etf.expenseRatio !== null ? `${(etf.expenseRatio * 100).toFixed(2)}%` : 'N/A'}
- AUM: $${etf.totalAssets ? (etf.totalAssets / 1e9).toFixed(1) : 'N/A'}B
- Yield: ${etf.yield !== null ? `${(etf.yield * 100).toFixed(2)}%` : 'N/A'}
- 1Y Return: ${etf.oneYearReturn !== null ? `${etf.oneYearReturn >= 0 ? '+' : ''}${etf.oneYearReturn.toFixed(1)}%` : 'N/A'}
- 3Y Return: ${etf.threeYearReturn !== null ? `${etf.threeYearReturn >= 0 ? '+' : ''}${etf.threeYearReturn.toFixed(1)}%` : 'N/A'}
- Holdings: ${etf.holdingsCount ?? 'N/A'}
- Top Holdings: ${etf.topHoldings.slice(0, 5).map((h: ETFHolding) => `${h.symbol} (${h.weight.toFixed(1)}%)`).join(', ')}`;
}

export async function getETFComparisonVerdict(symbols: string[]): Promise<ComparisonVerdict | null> {
  if (symbols.length < 2) return null;

  const profiles = await Promise.all(symbols.map(s => getETFProfile(s)));
  const validProfiles = profiles.filter((p): p is ETFProfile => p !== null);

  if (validProfiles.length < 2) return null;

  const etfsData = validProfiles.map(formatETFForComparison).join('\n\n');
  const prompt = buildETFComparisonPrompt(etfsData);

  try {
    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 500,
        temperature: 0.3,
      },
      'summary'
    );

    if (!response.content) return null;

    const result = extractJson<VerdictResponse>(response.content, isVerdictResponse);
    if (!result.success || !result.data) return null;

    const validConfidence = ['high', 'medium', 'low'];

    return {
      winner: result.data.winner.toUpperCase(),
      winnerReason: result.data.winnerReason,
      confidence: (validConfidence.includes(result.data.confidence)
        ? result.data.confidence
        : 'medium') as 'high' | 'medium' | 'low',
      categoryWinners: result.data.categoryWinners.map(c => ({
        category: c.category,
        winner: c.winner.toUpperCase(),
        reason: c.reason,
      })),
      tradeoffs: result.data.tradeoffs,
      recommendation: result.data.recommendation,
      bestFor: result.data.bestFor ?? {},
    };
  } catch {
    return null;
  }
}
