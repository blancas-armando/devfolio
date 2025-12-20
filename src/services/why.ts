/**
 * Why Service
 * Explains stock movements using AI analysis of news and market data
 */

import Groq from 'groq-sdk';
import { getCompanyProfile, getNewsFeed, type NewsArticle } from './market.js';
import { extractJson } from '../utils/errors.js';

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const MODEL = 'llama-3.3-70b-versatile';

export interface WhyExplanation {
  symbol: string;
  price: number;
  changePercent: number;
  headline: string;
  explanation: string;
  factors: string[];
  newsContext: string[];
}

export async function explainMovement(symbol: string): Promise<WhyExplanation | null> {
  const upperSymbol = symbol.toUpperCase();

  // Fetch profile and news in parallel
  const [profile, news] = await Promise.all([
    getCompanyProfile(upperSymbol),
    getNewsFeed([upperSymbol]),
  ]);

  if (!profile) return null;

  // Format news for AI
  const recentNews = news.slice(0, 5);
  const newsContext = recentNews.map((n: NewsArticle) => `- ${n.title} (${n.publisher})`).join('\n');

  const direction = profile.changePercent >= 0 ? 'up' : 'down';
  const magnitude = Math.abs(profile.changePercent);
  const moveDesc = magnitude < 1 ? 'slightly' : magnitude < 3 ? 'moderately' : 'significantly';

  const prompt = `You are a stock market analyst. ${profile.symbol} (${profile.name}) is ${direction} ${moveDesc} today (${profile.changePercent >= 0 ? '+' : ''}${profile.changePercent.toFixed(2)}%).

Stock data:
- Current price: $${profile.price.toFixed(2)}
- Sector: ${profile.sector}
- Market Cap: $${((profile.marketCap ?? 0) / 1e9).toFixed(1)}B
- YTD Return: ${profile.ytdReturn !== null ? `${profile.ytdReturn >= 0 ? '+' : ''}${profile.ytdReturn.toFixed(1)}%` : 'N/A'}

Recent news:
${newsContext || 'No recent news available'}

Explain why this stock might be moving. Respond in JSON:
{
  "headline": "One-line summary (max 60 chars)",
  "explanation": "2-3 sentences explaining the movement",
  "factors": ["factor1", "factor2", "factor3"] (3 key factors, each max 40 chars),
  "newsContext": ["relevant headline 1", "relevant headline 2"] (1-2 most relevant news items if any)
}

Be specific. If news doesn't explain it, mention broader market or sector factors.`;

  try {
    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    interface WhyResponse {
      headline?: string;
      explanation?: string;
      factors?: string[];
      newsContext?: string[];
    }
    const parsed = extractJson<WhyResponse>(content);
    if (!parsed) return null;

    return {
      symbol: upperSymbol,
      price: profile.price,
      changePercent: profile.changePercent,
      headline: parsed.headline || '',
      explanation: parsed.explanation || '',
      factors: parsed.factors || [],
      newsContext: parsed.newsContext || [],
    };
  } catch {
    return null;
  }
}
