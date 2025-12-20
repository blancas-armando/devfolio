/**
 * AI Quick Take Generator
 * Generates brief AI-powered stock assessments
 */

import Groq from 'groq-sdk';
import type { CompanyProfile } from './market.js';

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const MODEL = 'llama-3.3-70b-versatile';

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
    lines.push(`Analyst Target: $${profile.targetPrice.toFixed(2)} (${upside >= 0 ? '+' : ''}${upside.toFixed(1)}% upside)`);
  }
  if (profile.recommendationKey) {
    lines.push(`Analyst Rating: ${profile.recommendationKey.toUpperCase()}`);
  }
  if (profile.debtToEquity !== null) {
    lines.push(`Debt/Equity: ${profile.debtToEquity.toFixed(2)}`);
  }

  return lines.join('\n');
}

export async function getQuickTake(profile: CompanyProfile): Promise<QuickTake | null> {
  if (!process.env.GROQ_API_KEY) {
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

    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      sentiment: parsed.sentiment || 'neutral',
      summary: parsed.summary || '',
      keyPoint: parsed.keyPoint || '',
    };
  } catch {
    return null;
  }
}
