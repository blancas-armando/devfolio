/**
 * Why Service
 * Explains stock movements using AI analysis of news and market data
 */

import { complete } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import { buildWhyPrompt } from '../ai/promptLibrary.js';
import { getCompanyProfile, getNewsFeed, type NewsArticle } from './market.js';

export interface WhyExplanation {
  symbol: string;
  price: number;
  changePercent: number;
  headline: string;
  explanation: string;
  factors: string[];
  newsContext: string[];
}

interface WhyResponse {
  headline: string;
  explanation: string;
  factors: string[];
  newsContext: string[];
}

function isWhyResponse(obj: unknown): obj is WhyResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.headline === 'string' &&
    typeof o.explanation === 'string' &&
    Array.isArray(o.factors) &&
    Array.isArray(o.newsContext)
  );
}

export async function explainMovement(symbol: string): Promise<WhyExplanation | null> {
  const upperSymbol = symbol.toUpperCase();

  // Fetch profile and news in parallel
  const [profile, news] = await Promise.all([getCompanyProfile(upperSymbol), getNewsFeed([upperSymbol])]);

  if (!profile) return null;

  // Format news for AI
  const recentNews = news.slice(0, 5);
  const newsContext = recentNews.map((n: NewsArticle) => `- ${n.title} (${n.publisher})`).join('\n');

  // Format stock data for prompt
  const stockData = `- Current price: $${profile.price.toFixed(2)}
- Sector: ${profile.sector}
- Market Cap: $${((profile.marketCap ?? 0) / 1e9).toFixed(1)}B
- YTD Return: ${profile.ytdReturn !== null ? `${profile.ytdReturn >= 0 ? '+' : ''}${profile.ytdReturn.toFixed(1)}%` : 'N/A'}`;

  const prompt = buildWhyPrompt(
    profile.symbol,
    profile.name,
    profile.changePercent,
    stockData,
    newsContext
  );

  try {
    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 400,
        temperature: 0.3,
      },
      'quick'
    );

    if (!response.content) return null;

    const result = extractJson<WhyResponse>(response.content, isWhyResponse);
    if (!result.success || !result.data) return null;

    return {
      symbol: upperSymbol,
      price: profile.price,
      changePercent: profile.changePercent,
      headline: result.data.headline,
      explanation: result.data.explanation,
      factors: result.data.factors,
      newsContext: result.data.newsContext,
    };
  } catch {
    return null;
  }
}
