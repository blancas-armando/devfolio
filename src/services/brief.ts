import Groq from 'groq-sdk';
import {
  getMarketBriefData,
  type MarketBriefData,
} from './market.js';

// Lazy-load Groq client
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return _groq;
}

const MODEL = 'llama-3.3-70b-versatile';

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
    lines.push(`  ${idx.name}: ${idx.price.toFixed(2)} (${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}% today, ${idx.weekChange !== null ? `${idx.weekChange >= 0 ? '+' : ''}${idx.weekChange.toFixed(1)}% week` : 'n/a week'})`);
  }

  // Indicators
  lines.push('\nMARKET INDICATORS:');
  if (data.indicators.vix) {
    lines.push(`  VIX: ${data.indicators.vix.value.toFixed(2)} (${data.indicators.vix.changePercent >= 0 ? '+' : ''}${data.indicators.vix.changePercent.toFixed(1)}%)`);
  }
  if (data.indicators.treasury10Y) {
    lines.push(`  10Y Treasury: ${data.indicators.treasury10Y.value.toFixed(2)}% (${data.indicators.treasury10Y.change >= 0 ? '+' : ''}${(data.indicators.treasury10Y.change * 100).toFixed(0)}bps)`);
  }
  if (data.indicators.oil) {
    lines.push(`  Oil: $${data.indicators.oil.value.toFixed(2)} (${data.indicators.oil.changePercent >= 0 ? '+' : ''}${data.indicators.oil.changePercent.toFixed(1)}%)`);
  }
  if (data.indicators.gold) {
    lines.push(`  Gold: $${data.indicators.gold.value.toFixed(2)} (${data.indicators.gold.changePercent >= 0 ? '+' : ''}${data.indicators.gold.changePercent.toFixed(1)}%)`);
  }
  if (data.indicators.bitcoin) {
    lines.push(`  Bitcoin: $${data.indicators.bitcoin.value.toLocaleString()} (${data.indicators.bitcoin.changePercent >= 0 ? '+' : ''}${data.indicators.bitcoin.changePercent.toFixed(1)}%)`);
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
  lines.push(`\nMARKET BREADTH: ${data.breadth.advancing} advancing, ${data.breadth.declining} declining (ratio: ${(data.breadth.advancing / Math.max(data.breadth.declining, 1)).toFixed(2)})`);

  // News
  lines.push('\nTOP NEWS:');
  for (const news of data.topNews.slice(0, 5)) {
    lines.push(`  - ${news.title} (${news.publisher})`);
  }

  return lines.join('\n');
}

async function generateNarrative(data: MarketBriefData): Promise<MarketNarrative | null> {
  try {
    const prompt = `You are a professional market analyst. Based on the following market data, provide a brief but insightful market analysis.

${formatDataForAI(data)}

Respond in JSON format with these fields:
{
  "headline": "A single compelling headline summarizing today's market action (10-15 words)",
  "summary": "2-3 sentences explaining the key story of the day - what happened and why it matters",
  "sectorAnalysis": "1-2 sentences on sector rotation and what it signals",
  "keyThemes": ["theme1", "theme2", "theme3"] (3 key themes driving markets today),
  "outlook": "1-2 sentences on what to watch going forward"
}

Be specific, reference actual data points. No generic platitudes. Write like a Bloomberg terminal summary - concise and actionable.`;

    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      headline: parsed.headline || 'Market Update',
      summary: parsed.summary || '',
      sectorAnalysis: parsed.sectorAnalysis || '',
      keyThemes: parsed.keyThemes || [],
      outlook: parsed.outlook || '',
    };
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
