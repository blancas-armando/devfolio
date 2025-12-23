/**
 * Watchlist Curator Service
 * AI-powered watchlist analysis and recommendations
 */

import { complete } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import { buildWatchlistPrompt } from '../ai/promptLibrary.js';
import { getWatchlist } from '../db/watchlist.js';
import { getQuotes } from './market.js';
import type { Quote } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type StockSignal = 'hot' | 'caution' | 'neutral' | 'watch';

export interface WatchlistItemInsight {
  symbol: string;
  signal: StockSignal;
  reason: string;
}

export interface WatchlistCuration {
  summary: string;
  marketContext: string;
  items: WatchlistItemInsight[];
  topPick: string | null;
  topPickReason: string | null;
  removeCandidate: string | null;
  removeCandidateReason: string | null;
}

interface CurationResponse {
  summary: string;
  marketContext: string;
  items: Array<{
    symbol: string;
    signal: string;
    reason: string;
  }>;
  topPick: string | null;
  topPickReason: string | null;
  removeCandidate: string | null;
  removeCandidateReason: string | null;
}

function isCurationResponse(obj: unknown): obj is CurationResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.summary === 'string' &&
    typeof o.marketContext === 'string' &&
    Array.isArray(o.items)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Watchlist Analysis
// ═══════════════════════════════════════════════════════════════════════════

export async function curateWatchlist(): Promise<WatchlistCuration | null> {
  const watchlist = getWatchlist();

  if (watchlist.length === 0) {
    return null;
  }

  // Get current quotes
  const quotes = await getQuotes(watchlist);
  const quoteMap = new Map<string, Quote>();
  for (const q of quotes) {
    quoteMap.set(q.symbol, q);
  }

  // Build data for AI
  const stocksData = watchlist.map(symbol => {
    const quote = quoteMap.get(symbol);
    if (!quote) return `${symbol}: No data available`;

    return `${symbol}: $${quote.price.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}% today)`;
  }).join('\n');

  const prompt = buildWatchlistPrompt(stocksData);

  try {
    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 600,
        temperature: 0.3,
      },
      'summary'
    );

    if (!response.content) return null;

    const result = extractJson<CurationResponse>(response.content, isCurationResponse);
    if (!result.success || !result.data) return null;

    const validSignals = ['hot', 'caution', 'neutral', 'watch'];
    const items: WatchlistItemInsight[] = result.data.items.map(item => ({
      symbol: item.symbol.toUpperCase(),
      signal: (validSignals.includes(item.signal) ? item.signal : 'neutral') as StockSignal,
      reason: item.reason,
    }));

    return {
      summary: result.data.summary,
      marketContext: result.data.marketContext,
      items,
      topPick: result.data.topPick?.toUpperCase() ?? null,
      topPickReason: result.data.topPickReason ?? null,
      removeCandidate: result.data.removeCandidate?.toUpperCase() ?? null,
      removeCandidateReason: result.data.removeCandidateReason ?? null,
    };
  } catch {
    return null;
  }
}
