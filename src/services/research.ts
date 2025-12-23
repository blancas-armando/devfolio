import YahooFinance from 'yahoo-finance2';
import { complete } from '../ai/client.js';
import { extractJson } from '../ai/json.js';
import { buildResearchPrompt } from '../ai/promptLibrary.js';
import { getCompanyProfile, type CompanyProfile } from './market.js';

// Initialize Yahoo Finance client
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
});

// ═══════════════════════════════════════════════════════════════════════════
// Extended Data Types
// ═══════════════════════════════════════════════════════════════════════════

export interface EarningsEvent {
  date: Date;
  quarter: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  surprise: number | null;
}

export interface AnalystTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface UpgradeDowngrade {
  date: Date;
  firm: string;
  toGrade: string;
  fromGrade: string;
  action: string;
}

export interface InsiderHolder {
  name: string;
  relation: string;
  shares: number;
  percentHeld: number | null;
}

export interface ExtendedCompanyData {
  profile: CompanyProfile;
  earningsHistory: EarningsEvent[];
  earningsDate: Date | null;
  analystTrends: AnalystTrend[];
  recentUpgrades: UpgradeDowngrade[];
  insiders: InsiderHolder[];
  institutionalOwnership: number | null;
  insiderOwnership: number | null;
}

export interface ResearchReport {
  symbol: string;
  companyName: string;
  generatedAt: Date;

  // Sections
  executiveSummary: string;
  businessOverview: string;
  keySegments: string[];
  competitivePosition: string;
  financialHighlights: string;
  catalysts: string[];
  risks: string[];
  bullCase: string;
  bearCase: string;
  conclusion: string;

  // Raw data for display
  data: ExtendedCompanyData;
}

interface ResearchReportResponse {
  executiveSummary: string;
  businessOverview: string;
  keySegments: string[];
  competitivePosition: string;
  financialHighlights: string;
  catalysts: string[];
  risks: string[];
  bullCase: string;
  bearCase: string;
  conclusion: string;
}

function isResearchReportResponse(obj: unknown): obj is ResearchReportResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.executiveSummary === 'string' &&
    typeof o.businessOverview === 'string' &&
    Array.isArray(o.keySegments) &&
    typeof o.competitivePosition === 'string' &&
    typeof o.financialHighlights === 'string' &&
    Array.isArray(o.catalysts) &&
    Array.isArray(o.risks) &&
    typeof o.bullCase === 'string' &&
    typeof o.bearCase === 'string' &&
    typeof o.conclusion === 'string'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Fetching
// ═══════════════════════════════════════════════════════════════════════════

export async function getExtendedCompanyData(symbol: string): Promise<ExtendedCompanyData | null> {
  try {
    // Get basic profile first
    const profile = await getCompanyProfile(symbol);
    if (!profile) return null;

    // Fetch extended data
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'earningsHistory',
        'earningsTrend',
        'recommendationTrend',
        'upgradeDowngradeHistory',
        'insiderHolders',
        'institutionOwnership',
        'majorHoldersBreakdown',
        'calendarEvents',
      ],
    });

    // Parse earnings history
    const earningsHistory: EarningsEvent[] = [];
    if (result.earningsHistory?.history) {
      for (const e of result.earningsHistory.history) {
        earningsHistory.push({
          date: e.quarter ? new Date(e.quarter) : new Date(),
          quarter: e.quarter?.toISOString().slice(0, 7) ?? 'N/A',
          epsEstimate: e.epsEstimate ?? null,
          epsActual: e.epsActual ?? null,
          revenueEstimate: null,
          revenueActual: null,
          surprise: e.surprisePercent ?? null,
        });
      }
    }

    // Parse analyst trends
    const analystTrends: AnalystTrend[] = [];
    if (result.recommendationTrend?.trend) {
      for (const t of result.recommendationTrend.trend) {
        analystTrends.push({
          period: t.period ?? 'N/A',
          strongBuy: t.strongBuy ?? 0,
          buy: t.buy ?? 0,
          hold: t.hold ?? 0,
          sell: t.sell ?? 0,
          strongSell: t.strongSell ?? 0,
        });
      }
    }

    // Parse upgrades/downgrades
    const recentUpgrades: UpgradeDowngrade[] = [];
    if (result.upgradeDowngradeHistory?.history) {
      const recent = result.upgradeDowngradeHistory.history.slice(0, 5);
      for (const u of recent) {
        recentUpgrades.push({
          date: typeof u.epochGradeDate === 'number' ? new Date(u.epochGradeDate * 1000) : new Date(),
          firm: u.firm ?? 'Unknown',
          toGrade: u.toGrade ?? 'N/A',
          fromGrade: u.fromGrade ?? 'N/A',
          action: u.action ?? 'N/A',
        });
      }
    }

    // Parse insider holders
    const insiders: InsiderHolder[] = [];
    if (result.insiderHolders?.holders) {
      for (const h of result.insiderHolders.holders.slice(0, 5)) {
        insiders.push({
          name: h.name ?? 'Unknown',
          relation: h.relation ?? 'N/A',
          shares: h.positionDirect ?? 0,
          percentHeld: null,
        });
      }
    }

    // Get ownership percentages
    const majorHolders = result.majorHoldersBreakdown;
    const institutionalOwnership = majorHolders?.institutionsPercentHeld ?? null;
    const insiderOwnership = majorHolders?.insidersPercentHeld ?? null;

    // Get next earnings date
    let earningsDate: Date | null = null;
    if (result.calendarEvents?.earnings?.earningsDate) {
      const dates = result.calendarEvents.earnings.earningsDate;
      if (dates.length > 0) {
        earningsDate = new Date(dates[0]);
      }
    }

    return {
      profile,
      earningsHistory,
      earningsDate,
      analystTrends,
      recentUpgrades,
      insiders,
      institutionalOwnership,
      insiderOwnership,
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Report Generation
// ═══════════════════════════════════════════════════════════════════════════

function formatDataForPrompt(data: ExtendedCompanyData): string {
  const p = data.profile;

  const financials = `
Revenue: ${p.revenue ? `$${(p.revenue / 1e9).toFixed(2)}B` : 'N/A'}
Revenue Growth: ${p.revenueGrowth ? `${(p.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}
Gross Margin: ${p.grossMargin ? `${(p.grossMargin * 100).toFixed(1)}%` : 'N/A'}
Operating Margin: ${p.operatingMargin ? `${(p.operatingMargin * 100).toFixed(1)}%` : 'N/A'}
Net Margin: ${p.profitMargin ? `${(p.profitMargin * 100).toFixed(1)}%` : 'N/A'}
EBITDA: ${p.ebitda ? `$${(p.ebitda / 1e9).toFixed(2)}B` : 'N/A'}
EPS: ${p.eps ? `$${p.eps.toFixed(2)}` : 'N/A'}
`;

  const valuation = `
Market Cap: ${p.marketCap ? `$${(p.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
Enterprise Value: ${p.enterpriseValue ? `$${(p.enterpriseValue / 1e9).toFixed(2)}B` : 'N/A'}
P/E Ratio: ${p.peRatio?.toFixed(2) ?? 'N/A'}
Forward P/E: ${p.forwardPE?.toFixed(2) ?? 'N/A'}
PEG Ratio: ${p.pegRatio?.toFixed(2) ?? 'N/A'}
P/S Ratio: ${p.priceToSales?.toFixed(2) ?? 'N/A'}
EV/EBITDA: ${p.evToEbitda?.toFixed(2) ?? 'N/A'}
`;

  const balance = `
Total Cash: ${p.totalCash ? `$${(p.totalCash / 1e9).toFixed(2)}B` : 'N/A'}
Total Debt: ${p.totalDebt ? `$${(p.totalDebt / 1e9).toFixed(2)}B` : 'N/A'}
Debt/Equity: ${p.debtToEquity?.toFixed(2) ?? 'N/A'}
Current Ratio: ${p.currentRatio?.toFixed(2) ?? 'N/A'}
`;

  const earnings = data.earningsHistory.length > 0
    ? data.earningsHistory.slice(0, 4).map(e =>
        `${e.quarter}: EPS ${e.epsActual?.toFixed(2) ?? 'N/A'} vs est ${e.epsEstimate?.toFixed(2) ?? 'N/A'} (${e.surprise ? `${e.surprise > 0 ? '+' : ''}${e.surprise.toFixed(1)}%` : 'N/A'} surprise)`
      ).join('\n')
    : 'No earnings history available';

  const analysts = data.analystTrends.length > 0
    ? `Current: ${data.analystTrends[0].strongBuy} Strong Buy, ${data.analystTrends[0].buy} Buy, ${data.analystTrends[0].hold} Hold, ${data.analystTrends[0].sell} Sell`
    : 'No analyst data';

  const upgrades = data.recentUpgrades.length > 0
    ? data.recentUpgrades.map(u => `${u.firm}: ${u.action} (${u.fromGrade} → ${u.toGrade})`).join('\n')
    : 'No recent upgrades/downgrades';

  const nextEarnings = data.earningsDate
    ? data.earningsDate.toLocaleDateString()
    : 'Not scheduled';

  return `
COMPANY: ${p.name} (${p.symbol})
SECTOR: ${p.sector}
INDUSTRY: ${p.industry}
EMPLOYEES: ${p.employees?.toLocaleString() ?? 'N/A'}

DESCRIPTION:
${p.description}

CURRENT PRICE: $${p.price.toFixed(2)} (${p.changePercent >= 0 ? '+' : ''}${p.changePercent.toFixed(2)}% today)
52-WEEK RANGE: $${p.low52w?.toFixed(2) ?? 'N/A'} - $${p.high52w?.toFixed(2) ?? 'N/A'}

FINANCIALS (TTM):
${financials}

VALUATION:
${valuation}

BALANCE SHEET:
${balance}

RECENT EARNINGS:
${earnings}

NEXT EARNINGS DATE: ${nextEarnings}

ANALYST RATINGS:
${analysts}
Target Price: $${p.targetPrice?.toFixed(2) ?? 'N/A'} (Range: $${p.targetLow?.toFixed(2) ?? 'N/A'} - $${p.targetHigh?.toFixed(2) ?? 'N/A'})
Recommendation: ${p.recommendationKey?.toUpperCase() ?? 'N/A'}

RECENT ANALYST ACTIONS:
${upgrades}

OWNERSHIP:
Institutional: ${data.institutionalOwnership ? `${(data.institutionalOwnership * 100).toFixed(1)}%` : 'N/A'}
Insider: ${data.insiderOwnership ? `${(data.insiderOwnership * 100).toFixed(1)}%` : 'N/A'}
`;
}

export async function generateResearchReport(symbol: string): Promise<ResearchReport | null> {
  // Fetch extended data
  const data = await getExtendedCompanyData(symbol);
  if (!data) return null;

  const dataContext = formatDataForPrompt(data);
  const prompt = buildResearchPrompt(dataContext);

  try {
    const response = await complete(
      {
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000,
        temperature: 0.3,
      },
      'research'
    );

    if (!response.content) return null;

    const result = extractJson<ResearchReportResponse>(response.content, isResearchReportResponse);
    if (!result.success || !result.data) return null;

    return {
      symbol: data.profile.symbol,
      companyName: data.profile.name,
      generatedAt: new Date(),
      executiveSummary: result.data.executiveSummary,
      businessOverview: result.data.businessOverview,
      keySegments: result.data.keySegments,
      competitivePosition: result.data.competitivePosition,
      financialHighlights: result.data.financialHighlights,
      catalysts: result.data.catalysts,
      risks: result.data.risks,
      bullCase: result.data.bullCase,
      bearCase: result.data.bearCase,
      conclusion: result.data.conclusion,
      data,
    };
  } catch {
    return null;
  }
}
