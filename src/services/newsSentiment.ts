/**
 * News Sentiment Service
 * AI-powered aggregate sentiment analysis of news
 */

import { complete } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import { getNewsFeed, type NewsArticle } from './market.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type SentimentLevel = 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';

export interface NewsSentimentAnalysis {
  overallSentiment: SentimentLevel;
  sentimentScore: number; // -100 to +100
  dominantThemes: string[];
  summary: string;
  topBullish: string | null;
  topBearish: string | null;
  marketMood: string;
  newsCount: number;
}

interface SentimentResponse {
  overallSentiment: string;
  sentimentScore: number;
  dominantThemes: string[];
  summary: string;
  topBullish: string | null;
  topBearish: string | null;
  marketMood: string;
}

function isSentimentResponse(obj: unknown): obj is SentimentResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.overallSentiment === 'string' &&
    typeof o.sentimentScore === 'number' &&
    Array.isArray(o.dominantThemes) &&
    typeof o.summary === 'string' &&
    typeof o.marketMood === 'string'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sentiment Analysis
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzeNewsSentiment(symbols?: string[]): Promise<NewsSentimentAnalysis | null> {
  const news = await getNewsFeed(symbols);

  if (news.length === 0) {
    return null;
  }

  // Take top 10 recent articles
  const recentNews = news.slice(0, 10);

  const newsData = recentNews.map((n: NewsArticle, i: number) =>
    `${i + 1}. ${n.title} (${n.publisher})`
  ).join('\n');

  const context = symbols && symbols.length > 0
    ? `for ${symbols.join(', ')}`
    : 'for the general market';

  const prompt = `You are a financial news analyst. Analyze the sentiment of these recent headlines ${context}.

RECENT NEWS:
${newsData}

Provide sentiment analysis in JSON format:
{
  "overallSentiment": "very_bullish" or "bullish" or "neutral" or "bearish" or "very_bearish",
  "sentimentScore": -100 to +100 (negative = bearish, positive = bullish),
  "dominantThemes": ["theme1", "theme2", "theme3"] (3 key themes),
  "summary": "1-2 sentences summarizing the news sentiment",
  "topBullish": "Most positive headline" or null,
  "topBearish": "Most concerning headline" or null,
  "marketMood": "Brief 2-3 word mood descriptor (e.g., 'cautiously optimistic', 'risk-off', 'bullish momentum')"
}

Consider:
- Headline tone and language
- Market implications
- Sector/company specific vs broad market news
- Recent trends vs one-off events`;

  try {
    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 400,
        temperature: 0.3,
      },
      'summary'
    );

    if (!response.content) return null;

    const result = extractJson<SentimentResponse>(response.content, isSentimentResponse);
    if (!result.success || !result.data) return null;

    const validSentiments = ['very_bullish', 'bullish', 'neutral', 'bearish', 'very_bearish'];
    const sentiment = validSentiments.includes(result.data.overallSentiment)
      ? result.data.overallSentiment as SentimentLevel
      : 'neutral';

    return {
      overallSentiment: sentiment,
      sentimentScore: Math.min(100, Math.max(-100, result.data.sentimentScore)),
      dominantThemes: result.data.dominantThemes.slice(0, 5),
      summary: result.data.summary,
      topBullish: result.data.topBullish ?? null,
      topBearish: result.data.topBearish ?? null,
      marketMood: result.data.marketMood,
      newsCount: recentNews.length,
    };
  } catch {
    return null;
  }
}
