/**
 * AI Quick Take Generator
 * Generates brief AI-powered stock assessments
 */

import { complete, isAIAvailable } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import type { CompanyProfile } from './market.js';

export interface QuickTake {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  keyPoint: string;
}

function formatProfileForAI(profile: CompanyProfile): string {
  const lines: string[] = [
    `${profile.symbol} - ${profile.name}`,
    `Sector: ${profile.sector}, Industry: ${profile.industry}`,
    `Price: $${profile.price.toFixed(2)} (${profile.changePercent >= 0 ? '+' : ''}${profile.changePercent.toFixed(2)}% today)`,
  ];

  if (profile.marketCap) {
    lines.push(`Market Cap: $${(profile.marketCap / 1e9).toFixed(1)}B`);
  }
  if (profile.peRatio) {
    lines.push(`P/E: ${profile.peRatio.toFixed(1)}, Forward P/E: ${profile.forwardPE?.toFixed(1) ?? 'N/A'}`);
  }
  if (profile.revenueGrowth !== null) {
    lines.push(`Revenue Growth: ${(profile.revenueGrowth * 100).toFixed(1)}%`);
  }
  if (profile.profitMargin !== null) {
    lines.push(`Profit Margin: ${(profile.profitMargin * 100).toFixed(1)}%`);
  }
  if (profile.ytdReturn !== null) {
    lines.push(`YTD Return: ${profile.ytdReturn >= 0 ? '+' : ''}${profile.ytdReturn.toFixed(1)}%`);
  }
  if (profile.targetPrice) {
    const upside = ((profile.targetPrice - profile.price) / profile.price) * 100;
    lines.push(
      `Analyst Target: $${profile.targetPrice.toFixed(2)} (${upside >= 0 ? '+' : ''}${upside.toFixed(1)}% upside)`
    );
  }
  if (profile.recommendationKey) {
    lines.push(`Analyst Rating: ${profile.recommendationKey.toUpperCase()}`);
  }
  if (profile.debtToEquity !== null) {
    lines.push(`Debt/Equity: ${profile.debtToEquity.toFixed(2)}`);
  }

  return lines.join('\n');
}

function isQuickTakeResponse(obj: unknown): obj is QuickTake {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    (o.sentiment === 'bullish' || o.sentiment === 'bearish' || o.sentiment === 'neutral') &&
    typeof o.summary === 'string' &&
    typeof o.keyPoint === 'string'
  );
}

export async function getQuickTake(profile: CompanyProfile): Promise<QuickTake | null> {
  if (!isAIAvailable()) {
    return null;
  }

  try {
    const data = formatProfileForAI(profile);

    const prompt = `You are a concise equity analyst. Given this stock data, provide a quick take in JSON format.

${data}

Respond with ONLY this JSON (no other text):
{
  "sentiment": "bullish" or "bearish" or "neutral",
  "summary": "1 sentence (max 80 chars) summarizing the investment case",
  "keyPoint": "1 key metric or factor to watch (max 50 chars)"
}

Be specific and use actual numbers. No generic statements.`;

    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 150,
        temperature: 0.3,
      },
      'quick'
    );

    if (!response.content) return null;

    const result = extractJson<QuickTake>(response.content, isQuickTakeResponse);
    if (!result.success || !result.data) return null;

    return {
      sentiment: result.data.sentiment,
      summary: result.data.summary,
      keyPoint: result.data.keyPoint,
    };
  } catch {
    return null;
  }
}
