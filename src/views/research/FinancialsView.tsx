/**
 * FinancialsView Component
 *
 * Displays financial statements (income, balance sheet, cash flow)
 * in a clean tabular format with proper bordered panels.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { FinancialStatements, IncomeStatementRow, BalanceSheetRow, CashFlowRow } from '../../services/financials.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';

export interface FinancialsViewProps {
  statements: FinancialStatements;
  statementType?: 'income' | 'balance' | 'cashflow' | 'all';
}

// Format large numbers
function formatNum(num: number | null): string {
  if (num === null) return '-';
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 1e12) return `${sign}$${(absNum / 1e12).toFixed(1)}T`;
  if (absNum >= 1e9) return `${sign}$${(absNum / 1e9).toFixed(1)}B`;
  if (absNum >= 1e6) return `${sign}$${(absNum / 1e6).toFixed(0)}M`;
  if (absNum >= 1e3) return `${sign}$${(absNum / 1e3).toFixed(0)}K`;
  return `${sign}$${absNum.toFixed(0)}`;
}

// Format date as fiscal year or quarter
function formatFY(date: Date, isQuarterly: boolean): string {
  if (isQuarterly) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter}'${String(date.getFullYear()).slice(-2)}`;
  }
  return `FY${date.getFullYear()}`;
}

// Row component for financial data
function FinRow({ label, values, highlight }: { label: string; values: (string | null)[]; highlight?: boolean }): React.ReactElement {
  const labelColor = highlight ? palette.text : palette.textTertiary;
  const valueColor = highlight ? palette.text : palette.textSecondary;

  return (
    <PanelRow>
      <InkBox width={22}>
        <Text color={labelColor}>{label}</Text>
      </InkBox>
      {values.map((v, i) => (
        <InkBox key={i} width={14}>
          <Text color={v && v.startsWith('-') ? palette.negative : valueColor}>{v ?? '-'}</Text>
        </InkBox>
      ))}
    </PanelRow>
  );
}

// Header row for fiscal years
function HeaderRow({ years }: { years: string[] }): React.ReactElement {
  return (
    <PanelRow>
      <InkBox width={22}>
        <Text color={palette.textTertiary}></Text>
      </InkBox>
      {years.map((y, i) => (
        <InkBox key={i} width={14}>
          <Text bold color={palette.accent}>{y}</Text>
        </InkBox>
      ))}
    </PanelRow>
  );
}

// Subsection label row
function SubsectionLabel({ label }: { label: string }): React.ReactElement {
  return (
    <PanelRow>
      <Text color={palette.textTertiary} bold>{label}</Text>
    </PanelRow>
  );
}

// Empty row for spacing
function EmptyRow(): React.ReactElement {
  return <PanelRow><Text> </Text></PanelRow>;
}

// Income Statement Section
function IncomeStatementSection({ data, isQuarterly }: { data: IncomeStatementRow[]; isQuarterly: boolean }): React.ReactElement {
  const years = data.slice(0, 4).map(d => formatFY(d.endDate, isQuarterly));

  return (
    <Section title="Income Statement">
      <HeaderRow years={years} />
      <FinRow label="Revenue" values={data.slice(0, 4).map(d => formatNum(d.totalRevenue))} highlight />
      <FinRow label="Cost of Revenue" values={data.slice(0, 4).map(d => formatNum(d.costOfRevenue))} />
      <FinRow label="Gross Profit" values={data.slice(0, 4).map(d => formatNum(d.grossProfit))} highlight />
      <FinRow label="Operating Expenses" values={data.slice(0, 4).map(d => formatNum(d.operatingExpenses))} />
      <FinRow label="Operating Income" values={data.slice(0, 4).map(d => formatNum(d.operatingIncome))} highlight />
      <FinRow label="Interest Expense" values={data.slice(0, 4).map(d => formatNum(d.interestExpense))} />
      <FinRow label="Pre-Tax Income" values={data.slice(0, 4).map(d => formatNum(d.incomeBeforeTax))} />
      <FinRow label="Tax Expense" values={data.slice(0, 4).map(d => formatNum(d.incomeTaxExpense))} />
      <FinRow label="Net Income" values={data.slice(0, 4).map(d => formatNum(d.netIncome))} highlight />
      <EmptyRow />
      <FinRow label="EBITDA" values={data.slice(0, 4).map(d => formatNum(d.ebitda))} highlight />
      <FinRow label="Basic EPS" values={data.slice(0, 4).map(d => d.basicEPS !== null ? `$${d.basicEPS.toFixed(2)}` : '-')} />
      <FinRow label="Diluted EPS" values={data.slice(0, 4).map(d => d.dilutedEPS !== null ? `$${d.dilutedEPS.toFixed(2)}` : '-')} />
    </Section>
  );
}

// Balance Sheet Section
function BalanceSheetSection({ data, isQuarterly }: { data: BalanceSheetRow[]; isQuarterly: boolean }): React.ReactElement {
  const years = data.slice(0, 4).map(d => formatFY(d.endDate, isQuarterly));

  return (
    <Section title="Balance Sheet">
      <HeaderRow years={years} />
      <SubsectionLabel label="Assets" />
      <FinRow label="  Cash & Equivalents" values={data.slice(0, 4).map(d => formatNum(d.cash))} />
      <FinRow label="  Short-Term Invest." values={data.slice(0, 4).map(d => formatNum(d.shortTermInvestments))} />
      <FinRow label="  Receivables" values={data.slice(0, 4).map(d => formatNum(d.netReceivables))} />
      <FinRow label="  Inventory" values={data.slice(0, 4).map(d => formatNum(d.inventory))} />
      <FinRow label="Total Current Assets" values={data.slice(0, 4).map(d => formatNum(d.totalCurrentAssets))} highlight />
      <FinRow label="  PP&E" values={data.slice(0, 4).map(d => formatNum(d.propertyPlantEquipment))} />
      <FinRow label="  Goodwill" values={data.slice(0, 4).map(d => formatNum(d.goodwill))} />
      <FinRow label="Total Assets" values={data.slice(0, 4).map(d => formatNum(d.totalAssets))} highlight />
      <EmptyRow />
      <SubsectionLabel label="Liabilities" />
      <FinRow label="  Accounts Payable" values={data.slice(0, 4).map(d => formatNum(d.accountsPayable))} />
      <FinRow label="  Short-Term Debt" values={data.slice(0, 4).map(d => formatNum(d.shortTermDebt))} />
      <FinRow label="Total Current Liab." values={data.slice(0, 4).map(d => formatNum(d.totalCurrentLiabilities))} highlight />
      <FinRow label="  Long-Term Debt" values={data.slice(0, 4).map(d => formatNum(d.longTermDebt))} />
      <FinRow label="Total Liabilities" values={data.slice(0, 4).map(d => formatNum(d.totalLiabilities))} highlight />
      <EmptyRow />
      <SubsectionLabel label="Equity" />
      <FinRow label="  Common Stock" values={data.slice(0, 4).map(d => formatNum(d.commonStock))} />
      <FinRow label="  Retained Earnings" values={data.slice(0, 4).map(d => formatNum(d.retainedEarnings))} />
      <FinRow label="  Treasury Stock" values={data.slice(0, 4).map(d => formatNum(d.treasuryStock))} />
      <FinRow label="Total Equity" values={data.slice(0, 4).map(d => formatNum(d.totalStockholderEquity))} highlight />
    </Section>
  );
}

// Cash Flow Section
function CashFlowSection({ data, isQuarterly }: { data: CashFlowRow[]; isQuarterly: boolean }): React.ReactElement {
  const years = data.slice(0, 4).map(d => formatFY(d.endDate, isQuarterly));

  return (
    <Section title="Cash Flow Statement">
      <HeaderRow years={years} />
      <SubsectionLabel label="Operating Activities" />
      <FinRow label="  Net Income" values={data.slice(0, 4).map(d => formatNum(d.netIncome))} />
      <FinRow label="  Depreciation" values={data.slice(0, 4).map(d => formatNum(d.depreciation))} />
      <FinRow label="  Working Capital Chg" values={data.slice(0, 4).map(d => formatNum(d.changeInWorkingCapital))} />
      <FinRow label="Operating Cash Flow" values={data.slice(0, 4).map(d => formatNum(d.operatingCashFlow))} highlight />
      <EmptyRow />
      <SubsectionLabel label="Investing Activities" />
      <FinRow label="  Capital Expenditures" values={data.slice(0, 4).map(d => formatNum(d.capitalExpenditures))} />
      <FinRow label="  Acquisitions" values={data.slice(0, 4).map(d => formatNum(d.acquisitions))} />
      <FinRow label="Investing Cash Flow" values={data.slice(0, 4).map(d => formatNum(d.investingCashFlow))} highlight />
      <EmptyRow />
      <SubsectionLabel label="Financing Activities" />
      <FinRow label="  Dividends Paid" values={data.slice(0, 4).map(d => formatNum(d.dividendsPaid))} />
      <FinRow label="  Stock Repurchased" values={data.slice(0, 4).map(d => formatNum(d.stockRepurchased))} />
      <FinRow label="  Debt Repayment" values={data.slice(0, 4).map(d => formatNum(d.debtRepayment))} />
      <FinRow label="Financing Cash Flow" values={data.slice(0, 4).map(d => formatNum(d.financingCashFlow))} highlight />
      <EmptyRow />
      <FinRow label="Free Cash Flow" values={data.slice(0, 4).map(d => formatNum(d.freeCashFlow))} highlight />
      <FinRow label="Net Change in Cash" values={data.slice(0, 4).map(d => formatNum(d.netChangeInCash))} />
    </Section>
  );
}

export function FinancialsView({ statements, statementType = 'all' }: FinancialsViewProps): React.ReactElement {
  const showIncome = statementType === 'all' || statementType === 'income';
  const showBalance = statementType === 'all' || statementType === 'balance';
  const showCashFlow = statementType === 'all' || statementType === 'cashflow';
  const isQuarterly = statements.period === 'quarterly';
  const periodLabel = isQuarterly ? 'Quarterly' : 'Annual';

  return (
    <Panel width={78} title={statements.symbol}>
      {/* Header info */}
      <PanelRow>
        <Text color={palette.text}>{statements.name}</Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Financial Statements ({periodLabel}, {statements.currency})</Text>
        <Text color={palette.textTertiary}> {borders.vertical} FY ends </Text>
        <Text color={palette.textSecondary}>{statements.fiscalYearEnd}</Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textMuted}>
          {isQuarterly ? "Use 'fin " + statements.symbol + "' for annual" : "Use 'fin " + statements.symbol + " q' for quarterly"}
        </Text>
      </PanelRow>

      {/* Income Statement */}
      {showIncome && statements.incomeStatements.length > 0 && (
        <IncomeStatementSection data={statements.incomeStatements} isQuarterly={isQuarterly} />
      )}

      {/* Balance Sheet */}
      {showBalance && statements.balanceSheets.length > 0 && (
        <BalanceSheetSection data={statements.balanceSheets} isQuarterly={isQuarterly} />
      )}

      {/* Cash Flow */}
      {showCashFlow && statements.cashFlows.length > 0 && (
        <CashFlowSection data={statements.cashFlows} isQuarterly={isQuarterly} />
      )}

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          Data as of {statements.asOfDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default FinancialsView;
