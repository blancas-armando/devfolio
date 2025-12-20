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
    const result = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
      modules: [
        'price',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'assetProfile',
      ],
    });

    const price = result.price;
    const profile = result.assetProfile;
    const incomeHistory = result.incomeStatementHistory?.incomeStatementHistory ?? [];
    const balanceHistory = result.balanceSheetHistory?.balanceSheetStatements ?? [];
    const cashFlowHistory = result.cashflowStatementHistory?.cashflowStatements ?? [];

    if (!price) return null;

    // Parse income statements (use any to access dynamic properties)
    const incomeStatements: IncomeStatementRow[] = incomeHistory.map(stmt => {
      const s = stmt as unknown as Record<string, unknown>;
      return {
        endDate: new Date(stmt.endDate),
        totalRevenue: getNum(s, 'totalRevenue'),
        costOfRevenue: getNum(s, 'costOfRevenue'),
        grossProfit: getNum(s, 'grossProfit'),
        operatingExpenses: getNum(s, 'totalOperatingExpenses'),
        operatingIncome: getNum(s, 'operatingIncome'),
        interestExpense: getNum(s, 'interestExpense'),
        incomeBeforeTax: getNum(s, 'incomeBeforeTax'),
        incomeTaxExpense: getNum(s, 'incomeTaxExpense'),
        netIncome: getNum(s, 'netIncome'),
        ebitda: getNum(s, 'ebit'), // Use ebit as fallback
        basicEPS: null,
        dilutedEPS: null,
      };
    });

    // Parse balance sheets
    const balanceSheets: BalanceSheetRow[] = balanceHistory.map(stmt => {
      const s = stmt as unknown as Record<string, unknown>;
      const totalAssets = getNum(s, 'totalAssets');
      const totalCurrentAssets = getNum(s, 'totalCurrentAssets');
      const totalLiab = getNum(s, 'totalLiab');
      const totalCurrentLiabilities = getNum(s, 'totalCurrentLiabilities');

      return {
        endDate: new Date(stmt.endDate),
        // Assets
        totalAssets,
        totalCurrentAssets,
        cash: getNum(s, 'cash'),
        shortTermInvestments: getNum(s, 'shortTermInvestments'),
        netReceivables: getNum(s, 'netReceivables'),
        inventory: getNum(s, 'inventory'),
        totalNonCurrentAssets: (totalAssets !== null && totalCurrentAssets !== null)
          ? totalAssets - totalCurrentAssets
          : null,
        propertyPlantEquipment: getNum(s, 'propertyPlantEquipmentNet'),
        goodwill: getNum(s, 'goodWill'),
        intangibleAssets: getNum(s, 'intangibleAssets'),
        // Liabilities
        totalLiabilities: totalLiab,
        totalCurrentLiabilities,
        accountsPayable: getNum(s, 'accountsPayable'),
        shortTermDebt: getNum(s, 'shortLongTermDebt'),
        totalNonCurrentLiabilities: (totalLiab !== null && totalCurrentLiabilities !== null)
          ? totalLiab - totalCurrentLiabilities
          : null,
        longTermDebt: getNum(s, 'longTermDebt'),
        // Equity
        totalStockholderEquity: getNum(s, 'totalStockholderEquity'),
        commonStock: getNum(s, 'commonStock'),
        retainedEarnings: getNum(s, 'retainedEarnings'),
        treasuryStock: getNum(s, 'treasuryStock'),
      };
    });

    // Parse cash flow statements
    const cashFlows: CashFlowRow[] = cashFlowHistory.map(stmt => {
      const s = stmt as unknown as Record<string, unknown>;
      const opCashFlow = getNum(s, 'totalCashFromOperatingActivities');
      const capex = getNum(s, 'capitalExpenditures');
      const fcf = (opCashFlow !== null && capex !== null)
        ? opCashFlow + capex // capex is negative
        : null;

      return {
        endDate: new Date(stmt.endDate),
        // Operating
        operatingCashFlow: opCashFlow,
        netIncome: getNum(s, 'netIncome'),
        depreciation: getNum(s, 'depreciation'),
        changeInWorkingCapital: getNum(s, 'changeToNetincome'),
        // Investing
        investingCashFlow: getNum(s, 'totalCashflowsFromInvestingActivities'),
        capitalExpenditures: capex,
        acquisitions: getNum(s, 'acquisitions'),
        // Financing
        financingCashFlow: getNum(s, 'totalCashFromFinancingActivities'),
        dividendsPaid: getNum(s, 'dividendsPaid'),
        stockRepurchased: getNum(s, 'repurchaseOfStock'),
        debtRepayment: getNum(s, 'repaymentOfDebt'),
        // Summary
        freeCashFlow: fcf,
        netChangeInCash: getNum(s, 'changeInCash'),
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
