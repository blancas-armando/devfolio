import Groq from 'groq-sdk';
import { getMarketOverview, type MarketOverview, type IndexQuote, type SectorPerformance, type MarketMover } from './market.js';
import { getPulseConfig, type PulseConfig } from '../db/config.js';

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

// ═══════════════════════════════════════════════════════════════════════════
// Pulse Alert Types
// ═══════════════════════════════════════════════════════════════════════════

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'positive';

export interface PulseAlert {
  severity: AlertSeverity;
  category: 'index' | 'volatility' | 'sector' | 'mover';
  title: string;
  detail: string;
}

export interface MarketPulse {
  alerts: PulseAlert[];
  indices: IndexQuote[];
  topSectors: SectorPerformance[];
  bottomSectors: SectorPerformance[];
  bigMovers: MarketMover[];
  vix: number | null;
  aiTake: string | null;
  asOfDate: Date;
  config: PulseConfig;
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Detection
// ═══════════════════════════════════════════════════════════════════════════

function detectAlerts(overview: MarketOverview, config: PulseConfig): PulseAlert[] {
  const alerts: PulseAlert[] = [];

  // Check index movements
  for (const index of overview.indices) {
    if (index.changePercent <= -config.indexDropThreshold) {
      alerts.push({
        severity: index.changePercent <= -3 ? 'critical' : 'warning',
        category: 'index',
        title: `${index.name} down ${Math.abs(index.changePercent).toFixed(1)}%`,
        detail: `Trading at ${index.price.toLocaleString()}`,
      });
    } else if (index.changePercent >= config.indexRiseThreshold) {
      alerts.push({
        severity: 'positive',
        category: 'index',
        title: `${index.name} up ${index.changePercent.toFixed(1)}%`,
        detail: `Trading at ${index.price.toLocaleString()}`,
      });
    }
  }

  // Check VIX
  if (overview.vix !== null && overview.vix >= config.vixThreshold) {
    const severity: AlertSeverity = overview.vix >= 30 ? 'critical' : overview.vix >= 25 ? 'warning' : 'info';
    alerts.push({
      severity,
      category: 'volatility',
      title: `VIX at ${overview.vix.toFixed(1)}`,
      detail: `Above your ${config.vixThreshold} threshold`,
    });
  }

  // Check sector rotation (biggest divergence)
  if (config.showSectors && overview.sectors.length >= 2) {
    const topSector = overview.sectors[0];
    const bottomSector = overview.sectors[overview.sectors.length - 1];
    const spread = topSector.changePercent - bottomSector.changePercent;

    if (spread >= 2) {
      alerts.push({
        severity: 'info',
        category: 'sector',
        title: 'Sector rotation detected',
        detail: `${topSector.name} (+${topSector.changePercent.toFixed(1)}%) vs ${bottomSector.name} (${bottomSector.changePercent.toFixed(1)}%)`,
      });
    }
  }

  // Check big movers
  const allMovers = [...overview.gainers, ...overview.losers];
  for (const mover of allMovers) {
    if (Math.abs(mover.changePercent) >= config.moverThreshold) {
      alerts.push({
        severity: mover.changePercent > 0 ? 'positive' : 'warning',
        category: 'mover',
        title: `${mover.symbol} ${mover.changePercent > 0 ? '+' : ''}${mover.changePercent.toFixed(1)}%`,
        detail: mover.name,
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    positive: 3,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Analysis
// ═══════════════════════════════════════════════════════════════════════════

function formatPulseDataForAI(pulse: Omit<MarketPulse, 'aiTake'>): string {
  const lines: string[] = [];

  lines.push('CURRENT MARKET STATE:');

  // Indices
  lines.push('\nIndices:');
  for (const idx of pulse.indices) {
    lines.push(`  ${idx.name}: ${idx.price.toLocaleString()} (${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%)`);
  }

  // VIX
  if (pulse.vix !== null) {
    lines.push(`\nVIX: ${pulse.vix.toFixed(1)}`);
  }

  // Sectors
  if (pulse.topSectors.length > 0) {
    lines.push('\nTop Sectors:');
    for (const sec of pulse.topSectors) {
      lines.push(`  ${sec.name}: ${sec.changePercent >= 0 ? '+' : ''}${sec.changePercent.toFixed(2)}%`);
    }
  }
  if (pulse.bottomSectors.length > 0) {
    lines.push('\nBottom Sectors:');
    for (const sec of pulse.bottomSectors) {
      lines.push(`  ${sec.name}: ${sec.changePercent >= 0 ? '+' : ''}${sec.changePercent.toFixed(2)}%`);
    }
  }

  // Notable movers
  if (pulse.bigMovers.length > 0) {
    lines.push('\nNotable Movers:');
    for (const m of pulse.bigMovers) {
      lines.push(`  ${m.symbol}: ${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(1)}%`);
    }
  }

  // Alerts summary
  if (pulse.alerts.length > 0) {
    lines.push('\nActive Alerts:');
    for (const alert of pulse.alerts.slice(0, 5)) {
      lines.push(`  [${alert.severity.toUpperCase()}] ${alert.title}`);
    }
  }

  return lines.join('\n');
}

const PULSE_PROMPT = `You are a concise market analyst. Given the current market state, provide a 1-2 sentence "AI Take" that:
- Identifies the dominant market theme or narrative driving today's action
- Notes any concerning signals or opportunities
- Uses plain language a developer/casual investor would understand

Be direct and opinionated. No hedging or "it depends." Start with the most important insight.`;

async function generateAITake(pulse: Omit<MarketPulse, 'aiTake'>): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  try {
    const marketData = formatPulseDataForAI(pulse);

    const response = await getGroq().chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: PULSE_PROMPT },
        { role: 'user', content: marketData },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Pulse Function
// ═══════════════════════════════════════════════════════════════════════════

export async function getMarketPulse(): Promise<MarketPulse> {
  const config = getPulseConfig();
  const overview = await getMarketOverview();

  // Detect alerts based on user config
  const alerts = detectAlerts(overview, config);

  // Get top/bottom sectors
  const topSectors = overview.sectors.slice(0, 3);
  const bottomSectors = overview.sectors.slice(-3).reverse();

  // Get big movers (above threshold)
  const bigMovers = [...overview.gainers, ...overview.losers]
    .filter(m => Math.abs(m.changePercent) >= config.moverThreshold)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, config.topMoversCount);

  const pulseWithoutAI: Omit<MarketPulse, 'aiTake'> = {
    alerts,
    indices: overview.indices,
    topSectors,
    bottomSectors,
    bigMovers,
    vix: overview.vix,
    asOfDate: overview.asOfDate,
    config,
  };

  // Generate AI take
  const aiTake = await generateAITake(pulseWithoutAI);

  return {
    ...pulseWithoutAI,
    aiTake,
  };
}
