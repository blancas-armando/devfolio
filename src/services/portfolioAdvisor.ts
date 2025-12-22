/**
 * Portfolio Advisor Service
 * AI-powered portfolio analysis and recommendations
 */

import { complete } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import { getHoldings } from '../db/portfolio.js';
import { getQuotes } from './market.js';
import type { Quote } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface PortfolioInsight {
  score: number; // 0-100 overall health score
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  sectorBreakdown: Array<{ sector: string; weight: number }>;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  diversificationScore: number; // 0-100
}

interface PortfolioInsightResponse {
  score: number;
  grade: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  riskLevel: string;
  diversificationScore: number;
}

function isPortfolioInsightResponse(obj: unknown): obj is PortfolioInsightResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.score === 'number' &&
    typeof o.grade === 'string' &&
    typeof o.summary === 'string' &&
    Array.isArray(o.strengths) &&
    Array.isArray(o.concerns) &&
    Array.isArray(o.suggestions) &&
    typeof o.riskLevel === 'string' &&
    typeof o.diversificationScore === 'number'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Portfolio Analysis
// ═══════════════════════════════════════════════════════════════════════════

interface EnrichedHolding {
  symbol: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  value: number;
  gain: number;
  gainPercent: number;
  weight: number;
}

async function getEnrichedPortfolio(): Promise<{
  holdings: EnrichedHolding[];
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
}> {
  const holdings = getHoldings();

  if (holdings.length === 0) {
    return { holdings: [], totalValue: 0, totalGain: 0, totalGainPercent: 0 };
  }

  const symbols = holdings.map(h => h.symbol);
  const quotes = await getQuotes(symbols);
  const priceMap = new Map<string, Quote>();
  for (const q of quotes) {
    priceMap.set(q.symbol, q);
  }

  let totalValue = 0;
  let totalCost = 0;

  const enriched: EnrichedHolding[] = holdings.map(h => {
    const quote = priceMap.get(h.symbol);
    const currentPrice = quote?.price ?? 0;
    const value = currentPrice * h.shares;
    const cost = h.costBasis * h.shares;
    const gain = value - cost;
    const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

    totalValue += value;
    totalCost += cost;

    return {
      symbol: h.symbol,
      shares: h.shares,
      costBasis: h.costBasis,
      currentPrice,
      value,
      gain,
      gainPercent,
      weight: 0, // Will calculate after we have totalValue
    };
  });

  // Calculate weights
  for (const h of enriched) {
    h.weight = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
  }

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return { holdings: enriched, totalValue, totalGain, totalGainPercent };
}

function calculateSectorBreakdown(holdings: EnrichedHolding[]): Array<{ sector: string; weight: number }> {
  // Simplified sector mapping based on common symbols
  const sectorMap: Record<string, string> = {
    AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', GOOG: 'Technology',
    AMZN: 'Consumer', META: 'Technology', NVDA: 'Technology', TSLA: 'Consumer',
    JPM: 'Finance', BAC: 'Finance', GS: 'Finance', MS: 'Finance',
    JNJ: 'Healthcare', UNH: 'Healthcare', PFE: 'Healthcare', ABBV: 'Healthcare',
    XOM: 'Energy', CVX: 'Energy', COP: 'Energy',
    PG: 'Consumer', KO: 'Consumer', PEP: 'Consumer', WMT: 'Consumer',
    DIS: 'Communication', NFLX: 'Communication', VZ: 'Communication',
    V: 'Finance', MA: 'Finance', PYPL: 'Finance',
  };

  const sectorWeights = new Map<string, number>();

  for (const h of holdings) {
    const sector = sectorMap[h.symbol] ?? 'Other';
    const current = sectorWeights.get(sector) ?? 0;
    sectorWeights.set(sector, current + h.weight);
  }

  return Array.from(sectorWeights.entries())
    .map(([sector, weight]) => ({ sector, weight }))
    .sort((a, b) => b.weight - a.weight);
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Analysis
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzePortfolio(): Promise<PortfolioInsight | null> {
  const { holdings, totalValue, totalGain, totalGainPercent } = await getEnrichedPortfolio();

  if (holdings.length === 0) {
    return null;
  }

  const sectorBreakdown = calculateSectorBreakdown(holdings);

  const holdingsData = holdings
    .sort((a, b) => b.weight - a.weight)
    .map(h => `${h.symbol}: $${h.value.toFixed(0)} (${h.weight.toFixed(1)}%, ${h.gainPercent >= 0 ? '+' : ''}${h.gainPercent.toFixed(1)}%)`)
    .join('\n');

  const sectorsData = sectorBreakdown
    .map(s => `${s.sector}: ${s.weight.toFixed(1)}%`)
    .join(', ');

  const prompt = `You are a portfolio advisor. Analyze this portfolio and provide insights.

PORTFOLIO:
Total Value: $${totalValue.toFixed(2)}
Total Gain: ${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(1)}%
Holdings: ${holdings.length}

POSITIONS (by weight):
${holdingsData}

SECTOR ALLOCATION:
${sectorsData}

Provide analysis in JSON format:
{
  "score": 0-100 (overall health score),
  "grade": "A" or "B" or "C" or "D" or "F",
  "summary": "1-2 sentence portfolio assessment",
  "strengths": ["strength1", "strength2"] (2-3 positives),
  "concerns": ["concern1", "concern2"] (2-3 issues to watch),
  "suggestions": ["suggestion1", "suggestion2"] (2-3 actionable recommendations),
  "riskLevel": "conservative" or "moderate" or "aggressive",
  "diversificationScore": 0-100
}

Consider:
- Concentration risk (any position >20% is risky)
- Sector diversification
- Overall performance
- Risk-adjusted returns`;

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

    const result = extractJson<PortfolioInsightResponse>(response.content, isPortfolioInsightResponse);
    if (!result.success || !result.data) return null;

    return {
      score: Math.min(100, Math.max(0, result.data.score)),
      grade: (result.data.grade.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'F') || 'C',
      summary: result.data.summary,
      strengths: result.data.strengths.slice(0, 3),
      concerns: result.data.concerns.slice(0, 3),
      suggestions: result.data.suggestions.slice(0, 3),
      sectorBreakdown,
      riskLevel: result.data.riskLevel as 'conservative' | 'moderate' | 'aggressive',
      diversificationScore: Math.min(100, Math.max(0, result.data.diversificationScore)),
    };
  } catch {
    return null;
  }
}
