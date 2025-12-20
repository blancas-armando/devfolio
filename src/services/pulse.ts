import Groq from 'groq-sdk';
import YahooFinance from 'yahoo-finance2';
import { getMarketOverview, getNewsFeed, getQuotes, type MarketOverview, type IndexQuote, type SectorPerformance, type MarketMover, type NewsArticle } from './market.js';
import { getPulseConfig, type PulseConfig } from '../db/config.js';
import { getWatchlist } from '../db/watchlist.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'], versionCheck: false });

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

export type MarketStatus = 'pre-market' | 'open' | 'after-hours' | 'closed';

export interface FuturesQuote {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export interface WatchlistItem {
  symbol: string;
  price: number;
  changePercent: number;
}

export interface MarketPulse {
  // Market status
  marketStatus: MarketStatus;

  // Core market data
  indices: IndexQuote[];
  vix: number | null;
  breadth: { advancing: number; declining: number };

  // Sectors
  topSectors: SectorPerformance[];
  bottomSectors: SectorPerformance[];

  // Movers
  topMovers: MarketMover[];

  // Context
  topHeadline: string | null;
  futures: FuturesQuote[] | null;  // Only shown pre-market
  dxy: { price: number; changePercent: number } | null;

  // Personalization
  watchlistSnapshot: WatchlistItem[];  // Empty if no watchlist
  alerts: PulseAlert[];

  // AI
  aiTake: string | null;

  // Meta
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

  lines.push(`CURRENT MARKET STATE (${pulse.marketStatus}):`);

  // Indices
  lines.push('\nIndices:');
  for (const idx of pulse.indices) {
    lines.push(`  ${idx.name}: ${idx.price.toLocaleString()} (${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%)`);
  }

  // Futures (pre-market)
  if (pulse.futures && pulse.futures.length > 0) {
    lines.push('\nFutures:');
    for (const f of pulse.futures) {
      lines.push(`  ${f.name}: ${f.changePercent >= 0 ? '+' : ''}${f.changePercent.toFixed(2)}%`);
    }
  }

  // VIX and DXY
  if (pulse.vix !== null) {
    lines.push(`\nVIX: ${pulse.vix.toFixed(1)}`);
  }
  if (pulse.dxy) {
    lines.push(`DXY (Dollar): ${pulse.dxy.price.toFixed(2)} (${pulse.dxy.changePercent >= 0 ? '+' : ''}${pulse.dxy.changePercent.toFixed(2)}%)`);
  }

  // Breadth
  lines.push(`\nBreadth: ${pulse.breadth.advancing} advancing, ${pulse.breadth.declining} declining`);

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

  // Top movers
  if (pulse.topMovers.length > 0) {
    lines.push('\nTop Movers:');
    for (const m of pulse.topMovers) {
      lines.push(`  ${m.symbol}: ${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(1)}%`);
    }
  }

  // Top headline
  if (pulse.topHeadline) {
    lines.push(`\nTop Headline: ${pulse.topHeadline}`);
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
// Market Status
// ═══════════════════════════════════════════════════════════════════════════

function getMarketStatus(): MarketStatus {
  const now = new Date();
  const etOffset = -5; // EST (adjust for EDT if needed)
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const etHours = (utcHours + 24 + etOffset) % 24;
  const etMinutes = utcMinutes;
  const etTime = etHours * 60 + etMinutes;

  const day = now.getUTCDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) return 'closed';

  // Pre-market: 4:00 AM - 9:30 AM ET
  if (etTime >= 240 && etTime < 570) return 'pre-market';
  // Market open: 9:30 AM - 4:00 PM ET
  if (etTime >= 570 && etTime < 960) return 'open';
  // After-hours: 4:00 PM - 8:00 PM ET
  if (etTime >= 960 && etTime < 1200) return 'after-hours';

  return 'closed';
}

// ═══════════════════════════════════════════════════════════════════════════
// Fetch Additional Data
// ═══════════════════════════════════════════════════════════════════════════

async function getFutures(): Promise<FuturesQuote[]> {
  try {
    const data = await yahooFinance.quote(['ES=F', 'NQ=F']);
    const futuresArray = Array.isArray(data) ? data : [data];
    return futuresArray.map(f => ({
      symbol: f.symbol === 'ES=F' ? 'ES' : 'NQ',
      name: f.symbol === 'ES=F' ? 'S&P Futures' : 'Nasdaq Futures',
      price: f.regularMarketPrice ?? 0,
      changePercent: f.regularMarketChangePercent ?? 0,
    }));
  } catch {
    return [];
  }
}

async function getDXY(): Promise<{ price: number; changePercent: number } | null> {
  try {
    const data = await yahooFinance.quote('DX-Y.NYB');
    const quote = Array.isArray(data) ? data[0] : data;
    if (!quote?.regularMarketPrice) return null;
    return {
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent ?? 0,
    };
  } catch {
    return null;
  }
}

async function getWatchlistSnapshot(): Promise<WatchlistItem[]> {
  try {
    const watchlist = getWatchlist();
    if (watchlist.length === 0) return [];

    // Get quotes for first 3 watchlist items
    const symbols = watchlist.slice(0, 3);
    const quotes = await getQuotes(symbols);

    return quotes.map(q => ({
      symbol: q.symbol,
      price: q.price,
      changePercent: q.changePercent,
    }));
  } catch {
    return [];
  }
}

async function getTopHeadline(): Promise<string | null> {
  try {
    const news = await getNewsFeed();
    if (news.length === 0) return null;
    return news[0].title;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Pulse Function
// ═══════════════════════════════════════════════════════════════════════════

export async function getMarketPulse(): Promise<MarketPulse> {
  const config = getPulseConfig();
  const marketStatus = getMarketStatus();

  // Fetch all data in parallel
  const [overview, topHeadline, dxy, watchlistSnapshot, futures] = await Promise.all([
    getMarketOverview(),
    getTopHeadline(),
    getDXY(),
    getWatchlistSnapshot(),
    marketStatus === 'pre-market' ? getFutures() : Promise.resolve(null),
  ]);

  // Detect alerts based on user config
  const alerts = detectAlerts(overview, config);

  // Get top/bottom sectors
  const topSectors = overview.sectors.slice(0, 3);
  const bottomSectors = overview.sectors.slice(-3).reverse();

  // Get top movers by magnitude (always shown, not threshold-gated)
  const topMovers = [...overview.gainers, ...overview.losers]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, config.topMoversCount);

  const pulseWithoutAI: Omit<MarketPulse, 'aiTake'> = {
    marketStatus,
    indices: overview.indices,
    vix: overview.vix,
    breadth: overview.breadth,
    topSectors,
    bottomSectors,
    topMovers,
    topHeadline,
    futures,
    dxy,
    watchlistSnapshot,
    alerts,
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
