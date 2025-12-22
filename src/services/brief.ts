/**
 * Market Brief Service
 * Generates AI-powered daily market summaries
 */

import { complete } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import { buildMarketBriefPrompt } from '../ai/promptLibrary.js';
import { getMarketBriefData, type MarketBriefData } from './market.js';

export interface MarketNarrative {
  headline: string;
  summary: string;
  sectorAnalysis: string;
  keyThemes: string[];
  outlook: string;
}

export interface MarketBrief {
  data: MarketBriefData;
  narrative: MarketNarrative | null;
}

function formatDataForAI(data: MarketBriefData): string {
  const lines: string[] = [];

  // Indices
  lines.push('INDICES:');
  for (const idx of data.indices) {
    lines.push(
      `  ${idx.name}: ${idx.price.toFixed(2)} (${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}% today, ${idx.weekChange !== null ? `${idx.weekChange >= 0 ? '+' : ''}${idx.weekChange.toFixed(1)}% week` : 'n/a week'})`
    );
  }

  // Indicators
  lines.push('\nMARKET INDICATORS:');
  if (data.indicators.vix) {
    lines.push(
      `  VIX: ${data.indicators.vix.value.toFixed(2)} (${data.indicators.vix.changePercent >= 0 ? '+' : ''}${data.indicators.vix.changePercent.toFixed(1)}%)`
    );
  }
  if (data.indicators.treasury10Y) {
    lines.push(
      `  10Y Treasury: ${data.indicators.treasury10Y.value.toFixed(2)}% (${data.indicators.treasury10Y.change >= 0 ? '+' : ''}${(data.indicators.treasury10Y.change * 100).toFixed(0)}bps)`
    );
  }
  if (data.indicators.oil) {
    lines.push(
      `  Oil: $${data.indicators.oil.value.toFixed(2)} (${data.indicators.oil.changePercent >= 0 ? '+' : ''}${data.indicators.oil.changePercent.toFixed(1)}%)`
    );
  }
  if (data.indicators.gold) {
    lines.push(
      `  Gold: $${data.indicators.gold.value.toFixed(2)} (${data.indicators.gold.changePercent >= 0 ? '+' : ''}${data.indicators.gold.changePercent.toFixed(1)}%)`
    );
  }
  if (data.indicators.bitcoin) {
    lines.push(
      `  Bitcoin: $${data.indicators.bitcoin.value.toLocaleString()} (${data.indicators.bitcoin.changePercent >= 0 ? '+' : ''}${data.indicators.bitcoin.changePercent.toFixed(1)}%)`
    );
  }

  // Sectors
  lines.push('\nSECTOR PERFORMANCE (ranked):');
  for (const sec of data.sectors) {
    lines.push(`  ${sec.name}: ${sec.changePercent >= 0 ? '+' : ''}${sec.changePercent.toFixed(2)}%`);
  }

  // Top movers
  lines.push('\nTOP GAINERS:');
  for (const g of data.gainers.slice(0, 5)) {
    lines.push(`  ${g.symbol}: +${g.changePercent.toFixed(1)}% ($${g.price.toFixed(2)})`);
  }

  lines.push('\nTOP LOSERS:');
  for (const l of data.losers.slice(0, 5)) {
    lines.push(`  ${l.symbol}: ${l.changePercent.toFixed(1)}% ($${l.price.toFixed(2)})`);
  }

  // Breadth
  lines.push(
    `\nMARKET BREADTH: ${data.breadth.advancing} advancing, ${data.breadth.declining} declining (ratio: ${(data.breadth.advancing / Math.max(data.breadth.declining, 1)).toFixed(2)})`
  );

  // News
  lines.push('\nTOP NEWS:');
  for (const news of data.topNews.slice(0, 5)) {
    lines.push(`  - ${news.title} (${news.publisher})`);
  }

  return lines.join('\n');
}

function isMarketNarrative(obj: unknown): obj is MarketNarrative {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.headline === 'string' &&
    typeof o.summary === 'string' &&
    typeof o.sectorAnalysis === 'string' &&
    Array.isArray(o.keyThemes) &&
    typeof o.outlook === 'string'
  );
}

async function generateNarrative(data: MarketBriefData): Promise<MarketNarrative | null> {
  try {
    const marketData = formatDataForAI(data);
    const prompt = buildMarketBriefPrompt(marketData);

    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      },
      'summary'
    );

    if (!response.content) return null;

    const result = extractJson<MarketNarrative>(response.content, isMarketNarrative);
    if (!result.success) return null;

    return result.data;
  } catch {
    return null;
  }
}

export async function getMarketBrief(): Promise<MarketBrief> {
  // Fetch market data
  const data = await getMarketBriefData();

  // Generate AI narrative (if we have data)
  let narrative: MarketNarrative | null = null;
  if (data.indices.length > 0) {
    narrative = await generateNarrative(data);
  }

  return { data, narrative };
}
