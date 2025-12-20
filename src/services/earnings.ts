/**
 * Earnings Analysis Service
 * Combines Yahoo Finance earnings data with SEC filings
 */

import Groq from 'groq-sdk';
import YahooFinance from 'yahoo-finance2';
import {
  getRecentFilings,
  getFilingText,
  extractKeySections,
  identify8KItems,
  getCompanyInfo,
  type SECFiling,
  type FilingSection,
  type CompanyInfo,
} from './sec.js';
import { getCompanyProfile, type CompanyProfile } from './market.js';

// Initialize clients
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'], versionCheck: false });

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface QuarterlyMetric {
  actual: number | null;
  consensus: number | null;
  diff: number | null;      // Percentage difference
  comment: string | null;   // Beat/Miss/In-line
}

export interface QuarterlyResults {
  quarter: string;          // e.g., "Q3 2024"
  fiscalQuarter: string;    // e.g., "FY24 Q3"
  reportDate: string;

  // Core Financials
  revenue: QuarterlyMetric;
  operatingIncome: QuarterlyMetric;
  operatingMargin: QuarterlyMetric;
  eps: QuarterlyMetric;
  netIncome: QuarterlyMetric;
}

export interface KPIMetric {
  name: string;
  actual: number | string | null;
  consensus: number | string | null;
  diff: number | null;
  comment: string | null;
  unit: string;             // e.g., "%", "$B", "M users"
}

export interface GuidanceMetric {
  metric: string;
  current: number | string | null;
  guidance: number | string | null;
  priorGuidance: number | string | null;
  change: string | null;    // Raised/Lowered/Maintained
  unit: string;
}

export interface EarningsEstimates {
  currentQuarterEps: number | null;
  currentYearEps: number | null;
  nextQuarterEps: number | null;
  nextYearEps: number | null;
  currentQuarterRevenue: number | null;
  currentYearRevenue: number | null;
  numberOfAnalysts: number | null;
  epsGrowth5Year: number | null;
}

export interface EarningsReport {
  symbol: string;
  companyName: string;
  generatedAt: Date;

  // Company Info
  profile: CompanyProfile | null;
  secInfo: CompanyInfo | null;

  // Earnings Data
  nextEarningsDate: Date | null;
  quarterlyResults: QuarterlyResults[];
  estimates: EarningsEstimates;

  // KPIs
  kpis: KPIMetric[];

  // Guidance
  guidance: GuidanceMetric[];

  // Beat/Miss Analysis
  beatRate: number;
  avgSurprise: number;
  consecutiveBeats: number;

  // SEC Filings
  recentFilings: SECFiling[];
  latestEarningsRelease: SECFiling | null;
  keySections: FilingSection[];
  recent8KItems: string[];

  // AI Analysis
  earningsSummary: string;
  performanceTrend: string;
  guidanceAnalysis: string;
  keyTakeaways: string[];
  outlook: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Earnings Data Fetching
// ═══════════════════════════════════════════════════════════════════════════

function getQuarterLabel(date: Date): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${year}`;
}

function getFiscalQuarterLabel(date: Date): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  const quarter = Math.floor(month / 3) + 1;
  return `FY${String(year).slice(-2)} Q${quarter}`;
}

function calculateDiff(actual: number | null, consensus: number | null): number | null {
  if (actual === null || consensus === null || consensus === 0) return null;
  return ((actual - consensus) / Math.abs(consensus)) * 100;
}

function getComment(diff: number | null): string | null {
  if (diff === null) return null;
  if (diff > 2) return 'Beat';
  if (diff < -2) return 'Miss';
  return 'In-line';
}

async function getEarningsData(symbol: string): Promise<{
  quarterlyResults: QuarterlyResults[];
  estimates: EarningsEstimates;
  nextEarningsDate: Date | null;
}> {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'earnings',
        'earningsHistory',
        'earningsTrend',
        'calendarEvents',
        'incomeStatementHistory',
        'incomeStatementHistoryQuarterly',
      ],
    });

    // Parse quarterly income statements for detailed metrics
    const quarterlyResults: QuarterlyResults[] = [];
    const quarterlyStatements = result.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? [];
    const earningsHistory = result.earningsHistory?.history ?? [];

    for (let i = 0; i < Math.min(quarterlyStatements.length, 4); i++) {
      const stmt = quarterlyStatements[i];
      const earnings = earningsHistory[i];

      const endDate = stmt.endDate ? new Date(stmt.endDate) : new Date();
      const revenue = typeof stmt.totalRevenue === 'number' ? stmt.totalRevenue : null;
      const operatingIncome = typeof stmt.operatingIncome === 'number' ? stmt.operatingIncome : null;
      const netIncome = typeof stmt.netIncome === 'number' ? stmt.netIncome : null;
      const operatingMargin = revenue && operatingIncome ? (operatingIncome / revenue) * 100 : null;

      // EPS data from earnings history
      const epsActual = earnings?.epsActual ?? null;
      const epsEstimate = earnings?.epsEstimate ?? null;
      const epsDiff = calculateDiff(epsActual, epsEstimate);

      // For revenue consensus, we'll estimate based on available data
      // Yahoo doesn't provide historical revenue consensus directly
      const revenueDiff = null; // Would need external data source

      quarterlyResults.push({
        quarter: getQuarterLabel(endDate),
        fiscalQuarter: getFiscalQuarterLabel(endDate),
        reportDate: endDate.toLocaleDateString(),
        revenue: {
          actual: revenue,
          consensus: null,  // Not available from Yahoo
          diff: revenueDiff,
          comment: null,
        },
        operatingIncome: {
          actual: operatingIncome,
          consensus: null,
          diff: null,
          comment: null,
        },
        operatingMargin: {
          actual: operatingMargin,
          consensus: null,
          diff: null,
          comment: null,
        },
        eps: {
          actual: epsActual,
          consensus: epsEstimate,
          diff: epsDiff,
          comment: getComment(epsDiff),
        },
        netIncome: {
          actual: netIncome,
          consensus: null,
          diff: null,
          comment: null,
        },
      });
    }

    // Parse forward estimates
    const trend = result.earningsTrend?.trend ?? [];
    const estimates: EarningsEstimates = {
      currentQuarterEps: trend[0]?.earningsEstimate?.avg ?? null,
      currentYearEps: trend[2]?.earningsEstimate?.avg ?? null,
      nextQuarterEps: trend[1]?.earningsEstimate?.avg ?? null,
      nextYearEps: trend[3]?.earningsEstimate?.avg ?? null,
      currentQuarterRevenue: trend[0]?.revenueEstimate?.avg ?? null,
      currentYearRevenue: trend[2]?.revenueEstimate?.avg ?? null,
      numberOfAnalysts: trend[0]?.earningsEstimate?.numberOfAnalysts ?? null,
      epsGrowth5Year: trend[0]?.growth ?? null,
    };

    // Get next earnings date
    let nextEarningsDate: Date | null = null;
    if (result.calendarEvents?.earnings?.earningsDate?.[0]) {
      nextEarningsDate = new Date(result.calendarEvents.earnings.earningsDate[0]);
    }

    return { quarterlyResults, estimates, nextEarningsDate };
  } catch {
    return {
      quarterlyResults: [],
      estimates: {
        currentQuarterEps: null,
        currentYearEps: null,
        nextQuarterEps: null,
        nextYearEps: null,
        currentQuarterRevenue: null,
        currentYearRevenue: null,
        numberOfAnalysts: null,
        epsGrowth5Year: null,
      },
      nextEarningsDate: null,
    };
  }
}

function analyzeBeatsAndMisses(results: QuarterlyResults[]): {
  beatRate: number;
  avgSurprise: number;
  consecutiveBeats: number;
} {
  const withEps = results.filter(r => r.eps.actual !== null && r.eps.consensus !== null);

  if (withEps.length === 0) {
    return { beatRate: 0, avgSurprise: 0, consecutiveBeats: 0 };
  }

  const beats = withEps.filter(r => r.eps.comment === 'Beat');
  const beatRate = (beats.length / withEps.length) * 100;

  const surprises = withEps
    .map(r => r.eps.diff)
    .filter((d): d is number => d !== null);
  const avgSurprise = surprises.length > 0
    ? surprises.reduce((a, b) => a + b, 0) / surprises.length
    : 0;

  // Count consecutive beats from most recent
  let consecutiveBeats = 0;
  for (const r of withEps) {
    if (r.eps.comment === 'Beat') {
      consecutiveBeats++;
    } else {
      break;
    }
  }

  return { beatRate, avgSurprise, consecutiveBeats };
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Analysis Generation
// ═══════════════════════════════════════════════════════════════════════════

async function generateEarningsAnalysis(
  symbol: string,
  companyName: string,
  profile: CompanyProfile | null,
  quarterlyResults: QuarterlyResults[],
  estimates: EarningsEstimates,
  beatRate: number,
  avgSurprise: number,
  filings: SECFiling[],
  keySections: FilingSection[],
): Promise<{
  earningsSummary: string;
  performanceTrend: string;
  guidanceAnalysis: string;
  keyTakeaways: string[];
  outlook: string;
  kpis: KPIMetric[];
  guidance: GuidanceMetric[];
}> {
  const prompt = `You are a senior equity analyst. Analyze earnings data for ${companyName} (${symbol}).

COMPANY PROFILE:
${profile ? `
- Price: $${profile.price.toFixed(2)} (${profile.changePercent >= 0 ? '+' : ''}${profile.changePercent.toFixed(2)}%)
- Market Cap: $${profile.marketCap ? (profile.marketCap / 1e9).toFixed(2) : 'N/A'}B
- P/E: ${profile.peRatio?.toFixed(2) ?? 'N/A'}
- Revenue TTM: $${profile.revenue ? (profile.revenue / 1e9).toFixed(2) : 'N/A'}B
- Operating Margin: ${profile.operatingMargin ? (profile.operatingMargin * 100).toFixed(1) : 'N/A'}%
- Profit Margin: ${profile.profitMargin ? (profile.profitMargin * 100).toFixed(1) : 'N/A'}%
` : 'Not available'}

QUARTERLY RESULTS (Last 4 Quarters):
${quarterlyResults.slice(0, 4).map(q => `
${q.fiscalQuarter} (${q.reportDate}):
- Revenue: $${q.revenue.actual ? (q.revenue.actual / 1e9).toFixed(2) : 'N/A'}B
- Operating Income: $${q.operatingIncome.actual ? (q.operatingIncome.actual / 1e9).toFixed(2) : 'N/A'}B
- Operating Margin: ${q.operatingMargin.actual?.toFixed(1) ?? 'N/A'}%
- EPS: $${q.eps.actual?.toFixed(2) ?? 'N/A'} vs Est $${q.eps.consensus?.toFixed(2) ?? 'N/A'} (${q.eps.comment ?? 'N/A'})`).join('\n')}

TRACK RECORD: ${beatRate.toFixed(0)}% beat rate, ${avgSurprise >= 0 ? '+' : ''}${avgSurprise.toFixed(1)}% avg surprise

FORWARD ESTIMATES:
- Current Q EPS: $${estimates.currentQuarterEps?.toFixed(2) ?? 'N/A'}
- Current Y EPS: $${estimates.currentYearEps?.toFixed(2) ?? 'N/A'}
- Current Q Rev: $${estimates.currentQuarterRevenue ? (estimates.currentQuarterRevenue / 1e9).toFixed(2) : 'N/A'}B
- 5Y Growth: ${estimates.epsGrowth5Year ? (estimates.epsGrowth5Year * 100).toFixed(1) : 'N/A'}%

SEC FILINGS:
${filings.slice(0, 5).map(f => `- ${f.form} (${f.filingDate}): ${f.description}`).join('\n')}

${keySections.length > 0 ? `FILING EXCERPTS:\n${keySections.map(s => `${s.title}: ${s.content.substring(0, 300)}...`).join('\n')}` : ''}

Provide analysis in this exact JSON format:
{
  "earningsSummary": "2-3 sentence summary of earnings performance",
  "performanceTrend": "Analysis of trajectory with specific numbers",
  "guidanceAnalysis": "What estimates suggest about future performance",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "outlook": "2-3 sentence outlook for upcoming earnings",
  "kpis": [
    {"name": "Gross Margin", "actual": 45.2, "consensus": 44.8, "diff": 0.9, "comment": "Beat", "unit": "%"},
    {"name": "Free Cash Flow", "actual": 25.1, "consensus": 24.0, "diff": 4.6, "comment": "Beat", "unit": "$B"}
  ],
  "guidance": [
    {"metric": "FY Revenue", "current": 400, "guidance": 410, "priorGuidance": 405, "change": "Raised", "unit": "$B"},
    {"metric": "FY Operating Margin", "current": 32.5, "guidance": 33.0, "priorGuidance": 32.5, "change": "Maintained", "unit": "%"},
    {"metric": "FY EPS", "current": 6.50, "guidance": 6.80, "priorGuidance": 6.70, "change": "Raised", "unit": "$"}
  ]
}

For KPIs, include 3-5 relevant metrics based on the company's sector.
For guidance, include Rev, OP, OPM, EPS and any other relevant metrics.
Use actual numbers from the data. If not available, use reasonable estimates based on sector.`;

  try {
    const response = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      earningsSummary: parsed.earningsSummary ?? '',
      performanceTrend: parsed.performanceTrend ?? '',
      guidanceAnalysis: parsed.guidanceAnalysis ?? '',
      keyTakeaways: parsed.keyTakeaways ?? [],
      outlook: parsed.outlook ?? '',
      kpis: parsed.kpis ?? [],
      guidance: parsed.guidance ?? [],
    };
  } catch {
    return {
      earningsSummary: 'Unable to generate analysis',
      performanceTrend: 'Data analysis unavailable',
      guidanceAnalysis: 'Forward estimates analysis unavailable',
      keyTakeaways: [],
      outlook: 'Outlook analysis unavailable',
      kpis: [],
      guidance: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Earnings Report Generator
// ═══════════════════════════════════════════════════════════════════════════

export async function generateEarningsReport(symbol: string): Promise<EarningsReport | null> {
  const upperSymbol = symbol.toUpperCase();

  try {
    // Fetch all data in parallel
    const [profile, secInfo, earningsData, filings] = await Promise.all([
      getCompanyProfile(upperSymbol),
      getCompanyInfo(upperSymbol),
      getEarningsData(upperSymbol),
      getRecentFilings(upperSymbol, ['10-K', '10-Q', '8-K'], 10),
    ]);

    if (!profile && !secInfo) {
      return null;
    }

    // Analyze beat/miss patterns
    const { beatRate, avgSurprise, consecutiveBeats } = analyzeBeatsAndMisses(earningsData.quarterlyResults);

    // Find latest 8-K (earnings release) and extract key sections
    const latest8K = filings.find(f => f.form === '8-K');
    let keySections: FilingSection[] = [];
    let recent8KItems: string[] = [];

    if (latest8K) {
      const filingText = await getFilingText(latest8K, 30000);
      if (filingText) {
        keySections = extractKeySections(filingText);
        recent8KItems = identify8KItems(filingText);
      }
    }

    // Also try to get sections from latest 10-Q
    const latest10Q = filings.find(f => f.form === '10-Q');
    if (latest10Q && keySections.length < 3) {
      const filingText = await getFilingText(latest10Q, 30000);
      if (filingText) {
        const tenQSections = extractKeySections(filingText);
        keySections = [...keySections, ...tenQSections].slice(0, 5);
      }
    }

    // Generate AI analysis
    const analysis = await generateEarningsAnalysis(
      upperSymbol,
      profile?.name ?? secInfo?.name ?? upperSymbol,
      profile,
      earningsData.quarterlyResults,
      earningsData.estimates,
      beatRate,
      avgSurprise,
      filings,
      keySections,
    );

    return {
      symbol: upperSymbol,
      companyName: profile?.name ?? secInfo?.name ?? upperSymbol,
      generatedAt: new Date(),
      profile,
      secInfo,
      nextEarningsDate: earningsData.nextEarningsDate,
      quarterlyResults: earningsData.quarterlyResults,
      estimates: earningsData.estimates,
      kpis: analysis.kpis,
      guidance: analysis.guidance,
      beatRate,
      avgSurprise,
      consecutiveBeats,
      recentFilings: filings,
      latestEarningsRelease: latest8K ?? null,
      keySections,
      recent8KItems,
      earningsSummary: analysis.earningsSummary,
      performanceTrend: analysis.performanceTrend,
      guidanceAnalysis: analysis.guidanceAnalysis,
      keyTakeaways: analysis.keyTakeaways,
      outlook: analysis.outlook,
    };
  } catch {
    return null;
  }
}
