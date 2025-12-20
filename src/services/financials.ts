/**
 * Financial Statements Service
 * Fetches income statement, balance sheet, and cash flow data
 */

import YahooFinance from 'yahoo-finance2';
import { CACHE_TTL } from '../constants/index.js';

// Initialize Yahoo Finance client
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  versionCheck: false,
});

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface IncomeStatementRow {
  endDate: Date;
  totalRevenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  incomeBeforeTax: number | null;
  incomeTaxExpense: number | null;
  netIncome: number | null;
  ebitda: number | null;
  basicEPS: number | null;
  dilutedEPS: number | null;
}

export interface BalanceSheetRow {
  endDate: Date;
  // Assets
  totalAssets: number | null;
  totalCurrentAssets: number | null;
  cash: number | null;
  shortTermInvestments: number | null;
  netReceivables: number | null;
  inventory: number | null;
  totalNonCurrentAssets: number | null;
  propertyPlantEquipment: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  // Liabilities
  totalLiabilities: number | null;
  totalCurrentLiabilities: number | null;
  accountsPayable: number | null;
  shortTermDebt: number | null;
  totalNonCurrentLiabilities: number | null;
  longTermDebt: number | null;
  // Equity
  totalStockholderEquity: number | null;
  commonStock: number | null;
  retainedEarnings: number | null;
  treasuryStock: number | null;
}

export interface CashFlowRow {
  endDate: Date;
  // Operating
  operatingCashFlow: number | null;
  netIncome: number | null;
  depreciation: number | null;
  changeInWorkingCapital: number | null;
  // Investing
  investingCashFlow: number | null;
  capitalExpenditures: number | null;
  acquisitions: number | null;
  // Financing
  financingCashFlow: number | null;
  dividendsPaid: number | null;
  stockRepurchased: number | null;
  debtRepayment: number | null;
  // Summary
  freeCashFlow: number | null;
  netChangeInCash: number | null;
}

export interface FinancialStatements {
  symbol: string;
  name: string;
  currency: string;
  fiscalYearEnd: string;
  incomeStatements: IncomeStatementRow[];
  balanceSheets: BalanceSheetRow[];
  cashFlows: CashFlowRow[];
  asOfDate: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Function
// ═══════════════════════════════════════════════════════════════════════════

// Type helper for accessing dynamic properties
function getNum(obj: Record<string, unknown>, key: string): number | null {
  const val = obj[key];
  return typeof val === 'number' ? val : null;
}

export async function getFinancialStatements(symbol: string): Promise<FinancialStatements | null> {
  const cacheKey = `financials:${symbol}`;
  const cached = getCached<FinancialStatements>(cacheKey);
  if (cached) return cached;

  try {
    // Get basic info from quoteSummary (price and profile still work)
    const [summaryResult, timeSeriesResult] = await Promise.all([
      yahooFinance.quoteSummary(symbol.toUpperCase(), {
        modules: ['price', 'assetProfile'],
      }),
      // Use fundamentalsTimeSeries for financial statements (quoteSummary deprecated since Nov 2024)
      yahooFinance.fundamentalsTimeSeries(symbol.toUpperCase(), {
        period1: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
        type: 'annual',
        module: 'all',
      }),
    ]);

    const price = summaryResult.price;
    const profile = summaryResult.assetProfile;

    if (!price) return null;

    // Group time series results by date
    const dataByDate = new Map<string, Record<string, unknown>>();
    for (const item of timeSeriesResult) {
      const dateKey = item.date.toISOString().split('T')[0];
      const existing = dataByDate.get(dateKey) || { date: item.date };
      // Merge all fields from this item into the date entry
      const itemData = item as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(itemData)) {
        if (key !== 'date' && value !== null && value !== undefined) {
          existing[key] = value;
        }
      }
      dataByDate.set(dateKey, existing);
    }

    // Convert to sorted array (most recent first)
    const sortedData = Array.from(dataByDate.values())
      .sort((a, b) => new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime());

    // Parse income statements from fundamentalsTimeSeries data
    const incomeStatements: IncomeStatementRow[] = sortedData.map(s => {
      const grossProfit = getNum(s, 'grossProfit');
      const operatingIncome = getNum(s, 'operatingIncome');
      const operatingExpenses = (grossProfit !== null && operatingIncome !== null)
        ? grossProfit - operatingIncome
        : null;

      return {
        endDate: new Date(s.date as Date),
        totalRevenue: getNum(s, 'totalRevenue'),
        costOfRevenue: getNum(s, 'costOfRevenue'),
        grossProfit,
        operatingExpenses,
        operatingIncome,
        interestExpense: getNum(s, 'interestExpense'),
        incomeBeforeTax: getNum(s, 'pretaxIncome'),
        incomeTaxExpense: getNum(s, 'taxProvision'),
        netIncome: getNum(s, 'netIncome'),
        ebitda: getNum(s, 'EBITDA') ?? getNum(s, 'normalizedEBITDA'),
        basicEPS: getNum(s, 'basicEPS'),
        dilutedEPS: getNum(s, 'dilutedEPS'),
      };
    });

    // Parse balance sheets from fundamentalsTimeSeries data
    const balanceSheets: BalanceSheetRow[] = sortedData.map(s => {
      const totalAssets = getNum(s, 'totalAssets');
      const totalCurrentAssets = getNum(s, 'currentAssets');
      const totalLiab = getNum(s, 'totalLiabilitiesNetMinorityInterest') ?? getNum(s, 'totalLiabilities');
      const totalCurrentLiabilities = getNum(s, 'currentLiabilities');

      return {
        endDate: new Date(s.date as Date),
        // Assets
        totalAssets,
        totalCurrentAssets,
        cash: getNum(s, 'cashAndCashEquivalents') ?? getNum(s, 'cashCashEquivalentsAndShortTermInvestments'),
        shortTermInvestments: getNum(s, 'otherShortTermInvestments'),
        netReceivables: getNum(s, 'receivables') ?? getNum(s, 'accountsReceivable'),
        inventory: getNum(s, 'inventory'),
        totalNonCurrentAssets: (totalAssets !== null && totalCurrentAssets !== null)
          ? totalAssets - totalCurrentAssets
          : null,
        propertyPlantEquipment: getNum(s, 'netPpe') ?? getNum(s, 'grossPpe'),
        goodwill: getNum(s, 'goodwill'),
        intangibleAssets: getNum(s, 'goodwillAndOtherIntangibleAssets'),
        // Liabilities
        totalLiabilities: totalLiab,
        totalCurrentLiabilities,
        accountsPayable: getNum(s, 'accountsPayable') ?? getNum(s, 'payables'),
        shortTermDebt: getNum(s, 'currentDebt') ?? getNum(s, 'currentDebtAndCapitalLeaseObligation'),
        totalNonCurrentLiabilities: (totalLiab !== null && totalCurrentLiabilities !== null)
          ? totalLiab - totalCurrentLiabilities
          : null,
        longTermDebt: getNum(s, 'longTermDebt') ?? getNum(s, 'longTermDebtAndCapitalLeaseObligation'),
        // Equity
        totalStockholderEquity: getNum(s, 'stockholdersEquity') ?? getNum(s, 'totalEquityGrossMinorityInterest'),
        commonStock: getNum(s, 'commonStock') ?? getNum(s, 'commonStockEquity'),
        retainedEarnings: getNum(s, 'retainedEarnings'),
        treasuryStock: getNum(s, 'treasuryStock'),
      };
    });

    // Parse cash flow statements from fundamentalsTimeSeries data
    const cashFlows: CashFlowRow[] = sortedData.map(s => {
      const opCashFlow = getNum(s, 'operatingCashFlow');
      const capex = getNum(s, 'capitalExpenditure');
      const fcf = getNum(s, 'freeCashFlow') ?? (
        (opCashFlow !== null && capex !== null) ? opCashFlow + capex : null
      );

      return {
        endDate: new Date(s.date as Date),
        // Operating
        operatingCashFlow: opCashFlow,
        netIncome: getNum(s, 'netIncome') ?? getNum(s, 'netIncomeFromContinuingOperations'),
        depreciation: getNum(s, 'depreciationAndAmortization'),
        changeInWorkingCapital: getNum(s, 'changeInWorkingCapital'),
        // Investing
        investingCashFlow: getNum(s, 'investingCashFlow'),
        capitalExpenditures: capex,
        acquisitions: getNum(s, 'netBusinessPurchaseAndSale'),
        // Financing
        financingCashFlow: getNum(s, 'financingCashFlow'),
        dividendsPaid: getNum(s, 'cashDividendsPaid') ?? getNum(s, 'commonStockDividendPaid'),
        stockRepurchased: getNum(s, 'repurchaseOfCapitalStock'),
        debtRepayment: getNum(s, 'repaymentOfDebt'),
        // Summary
        freeCashFlow: fcf,
        netChangeInCash: getNum(s, 'changesInCash') ?? getNum(s, 'endCashPosition'),
      };
    });

    // fiscalYearEnd can be an object when empty, so check type
    const fiscalYearEnd = typeof profile?.fiscalYearEnd === 'string'
      ? profile.fiscalYearEnd
      : 'December';

    const statements: FinancialStatements = {
      symbol: price.symbol ?? symbol.toUpperCase(),
      name: price.shortName ?? price.longName ?? symbol,
      currency: price.currency ?? 'USD',
      fiscalYearEnd,
      incomeStatements,
      balanceSheets,
      cashFlows,
      asOfDate: new Date(),
    };

    setCache(cacheKey, statements, CACHE_TTL.quote * 4); // Cache longer for statements
    return statements;
  } catch {
    return null;
  }
}
