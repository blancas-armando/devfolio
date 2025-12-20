/**
 * Financial Statements Display
 * Income Statement, Balance Sheet, Cash Flow Statement views
 */

import chalk from 'chalk';
import type {
  FinancialStatements,
  IncomeStatementRow,
  BalanceSheetRow,
  CashFlowRow,
} from '../../services/financials.js';
import { stripAnsi } from '../ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Formatting Helpers
// ═══════════════════════════════════════════════════════════════════════════

function formatMoney(value: number | null, showSign: boolean = false): string {
  if (value === null) return chalk.dim('--');

  const absValue = Math.abs(value);
  let formatted: string;

  if (absValue >= 1e12) {
    formatted = (absValue / 1e12).toFixed(2) + 'T';
  } else if (absValue >= 1e9) {
    formatted = (absValue / 1e9).toFixed(2) + 'B';
  } else if (absValue >= 1e6) {
    formatted = (absValue / 1e6).toFixed(2) + 'M';
  } else if (absValue >= 1e3) {
    formatted = (absValue / 1e3).toFixed(2) + 'K';
  } else {
    formatted = absValue.toFixed(0);
  }

  if (value < 0) {
    return chalk.red(`(${formatted})`);
  } else if (showSign && value > 0) {
    return chalk.green(`+${formatted}`);
  }
  return formatted;
}

function formatYear(date: Date): string {
  return date.getFullYear().toString();
}

function formatFiscalPeriod(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Statement Row Rendering
// ═══════════════════════════════════════════════════════════════════════════

function renderRow(
  label: string,
  values: (number | null)[],
  labelWidth: number,
  colWidth: number,
  indent: number = 0,
  showSign: boolean = false,
  isTotal: boolean = false
): string {
  const indentStr = ' '.repeat(indent);
  const labelText = isTotal ? chalk.bold(label) : label;
  // Calculate visible length and pad manually (padEnd counts ANSI codes)
  const visibleLabelLen = indent + label.length;
  const labelPadding = ' '.repeat(Math.max(0, labelWidth - visibleLabelLen));
  const paddedLabel = indentStr + labelText + labelPadding;

  const formattedValues = values.map(v => {
    const formatted = formatMoney(v, showSign);
    const visibleLen = stripAnsi(formatted).length;
    const padding = Math.max(0, colWidth - visibleLen);
    return ' '.repeat(padding) + formatted;
  });

  return chalk.dim(paddedLabel) + formattedValues.join('');
}

function renderMarginRow(
  label: string,
  margins: (number | null)[],
  labelWidth: number,
  colWidth: number,
): string {
  const paddedLabel = ('  ' + label).padEnd(labelWidth);

  const formattedValues = margins.map(m => {
    const formatted = m !== null ? `${m.toFixed(1)}%` : '--';
    return formatted.padStart(colWidth);
  });

  return chalk.dim(paddedLabel + formattedValues.join(''));
}

function renderSectionHeader(title: string, width: number): string {
  return chalk.cyan.bold(title.padEnd(width));
}

function renderDivider(width: number): string {
  return chalk.dim('─'.repeat(width));
}

// ═══════════════════════════════════════════════════════════════════════════
// Income Statement Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayIncomeStatement(statements: FinancialStatements): void {
  const { incomeStatements, symbol, name, currency } = statements;

  if (incomeStatements.length === 0) {
    console.log(chalk.yellow(`  No income statement data available for ${symbol}`));
    return;
  }

  const labelWidth = 28;
  const colWidth = 14;
  const periods = incomeStatements.slice(0, 4); // Show up to 4 years
  const totalWidth = labelWidth + (colWidth * periods.length) + 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(totalWidth - 2) + '╮'));

  // Header
  const title = `${symbol} Income Statement`;
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim(`${name} | ${currency}`).padEnd(totalWidth - 4) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));

  // Period headers
  const periodHeader = ' '.repeat(labelWidth) + periods.map(p =>
    chalk.bold.white(formatFiscalPeriod(p.endDate).padStart(colWidth))
  ).join('');
  console.log(chalk.cyan('│') + ' ' + periodHeader + ' '.repeat(Math.max(0, totalWidth - 4 - stripAnsi(periodHeader).length)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));

  const printRow = (label: string, values: (number | null)[], indent = 0, showSign = false, isTotal = false) => {
    const row = renderRow(label, values, labelWidth, colWidth, indent, showSign, isTotal);
    console.log(chalk.cyan('│') + ' ' + row + ' '.repeat(Math.max(0, totalWidth - 4 - stripAnsi(row).length)) + ' ' + chalk.cyan('│'));
  };

  const printMargin = (label: string, margins: (number | null)[]) => {
    const row = renderMarginRow(label, margins, labelWidth, colWidth);
    console.log(chalk.cyan('│') + ' ' + row + ' '.repeat(Math.max(0, totalWidth - 4 - stripAnsi(row).length)) + ' ' + chalk.cyan('│'));
  };

  // Revenue section
  printRow('Total Revenue', periods.map(p => p.totalRevenue), 0, false, true);
  printRow('Cost of Revenue', periods.map(p => p.costOfRevenue), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Gross Profit', periods.map(p => p.grossProfit), 0, false, true);

  // Calculate and show gross margin
  const grossMargins = periods.map(p =>
    (p.grossProfit && p.totalRevenue) ? (p.grossProfit / p.totalRevenue * 100) : null
  );
  printMargin('Gross Margin', grossMargins);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));

  // Operating section
  printRow('Operating Expenses', periods.map(p => p.operatingExpenses), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Operating Income', periods.map(p => p.operatingIncome), 0, false, true);

  // Operating margin
  const opMargins = periods.map(p =>
    (p.operatingIncome && p.totalRevenue) ? (p.operatingIncome / p.totalRevenue * 100) : null
  );
  printMargin('Operating Margin', opMargins);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));

  // Below operating
  printRow('Interest Expense', periods.map(p => p.interestExpense), 2);
  printRow('Income Before Tax', periods.map(p => p.incomeBeforeTax), 2);
  printRow('Income Tax Expense', periods.map(p => p.incomeTaxExpense), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Net Income', periods.map(p => p.netIncome), 0, false, true);

  // Net margin
  const netMargins = periods.map(p =>
    (p.netIncome && p.totalRevenue) ? (p.netIncome / p.totalRevenue * 100) : null
  );
  printMargin('Net Margin', netMargins);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('EBITDA', periods.map(p => p.ebitda), 0, false, true);

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));
  const footer = `Fiscal Year End: ${statements.fiscalYearEnd}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(footer.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('╰' + '─'.repeat(totalWidth - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Balance Sheet Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayBalanceSheet(statements: FinancialStatements): void {
  const { balanceSheets, symbol, name, currency } = statements;

  if (balanceSheets.length === 0) {
    console.log(chalk.yellow(`  No balance sheet data available for ${symbol}`));
    return;
  }

  const labelWidth = 28;
  const colWidth = 14;
  const periods = balanceSheets.slice(0, 4);
  const totalWidth = labelWidth + (colWidth * periods.length) + 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(totalWidth - 2) + '╮'));

  // Header
  const title = `${symbol} Balance Sheet`;
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim(`${name} | ${currency}`).padEnd(totalWidth - 4) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));

  // Period headers
  const periodHeader = ' '.repeat(labelWidth) + periods.map(p =>
    chalk.bold.white(formatFiscalPeriod(p.endDate).padStart(colWidth))
  ).join('');
  console.log(chalk.cyan('│') + ' ' + periodHeader + ' '.repeat(Math.max(0, totalWidth - 4 - stripAnsi(periodHeader).length)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));

  const printRow = (label: string, values: (number | null)[], indent = 0, showSign = false, isTotal = false) => {
    const row = renderRow(label, values, labelWidth, colWidth, indent, showSign, isTotal);
    console.log(chalk.cyan('│') + ' ' + row + ' '.repeat(Math.max(0, totalWidth - 4 - stripAnsi(row).length)) + ' ' + chalk.cyan('│'));
  };

  const printSection = (title: string) => {
    console.log(chalk.cyan('│') + ' ' + renderSectionHeader(title, totalWidth - 4) + ' ' + chalk.cyan('│'));
  };

  // Assets
  printSection('ASSETS');
  console.log(chalk.cyan('│') + ' ' + chalk.dim('Current Assets'.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  printRow('Cash & Equivalents', periods.map(p => p.cash), 2);
  printRow('Short-term Investments', periods.map(p => p.shortTermInvestments), 2);
  printRow('Net Receivables', periods.map(p => p.netReceivables), 2);
  printRow('Inventory', periods.map(p => p.inventory), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Total Current Assets', periods.map(p => p.totalCurrentAssets), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim('Non-Current Assets'.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  printRow('Property, Plant & Equip.', periods.map(p => p.propertyPlantEquipment), 2);
  printRow('Goodwill', periods.map(p => p.goodwill), 2);
  printRow('Intangible Assets', periods.map(p => p.intangibleAssets), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Total Non-Current Assets', periods.map(p => p.totalNonCurrentAssets), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('TOTAL ASSETS', periods.map(p => p.totalAssets), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));

  // Liabilities
  printSection('LIABILITIES');
  console.log(chalk.cyan('│') + ' ' + chalk.dim('Current Liabilities'.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  printRow('Accounts Payable', periods.map(p => p.accountsPayable), 2);
  printRow('Short-term Debt', periods.map(p => p.shortTermDebt), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Total Current Liab.', periods.map(p => p.totalCurrentLiabilities), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim('Non-Current Liabilities'.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  printRow('Long-term Debt', periods.map(p => p.longTermDebt), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Total Non-Current Liab.', periods.map(p => p.totalNonCurrentLiabilities), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('TOTAL LIABILITIES', periods.map(p => p.totalLiabilities), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));

  // Equity
  printSection('STOCKHOLDERS EQUITY');
  printRow('Common Stock', periods.map(p => p.commonStock), 2);
  printRow('Retained Earnings', periods.map(p => p.retainedEarnings), 2);
  printRow('Treasury Stock', periods.map(p => p.treasuryStock), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('TOTAL EQUITY', periods.map(p => p.totalStockholderEquity), 0, false, true);

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));
  const footer = `Fiscal Year End: ${statements.fiscalYearEnd}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(footer.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('╰' + '─'.repeat(totalWidth - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Cash Flow Statement Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayCashFlowStatement(statements: FinancialStatements): void {
  const { cashFlows, symbol, name, currency } = statements;

  if (cashFlows.length === 0) {
    console.log(chalk.yellow(`  No cash flow data available for ${symbol}`));
    return;
  }

  const labelWidth = 28;
  const colWidth = 14;
  const periods = cashFlows.slice(0, 4);
  const totalWidth = labelWidth + (colWidth * periods.length) + 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(totalWidth - 2) + '╮'));

  // Header
  const title = `${symbol} Cash Flow Statement`;
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim(`${name} | ${currency}`).padEnd(totalWidth - 4) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));

  // Period headers
  const periodHeader = ' '.repeat(labelWidth) + periods.map(p =>
    chalk.bold.white(formatFiscalPeriod(p.endDate).padStart(colWidth))
  ).join('');
  console.log(chalk.cyan('│') + ' ' + periodHeader + ' '.repeat(Math.max(0, totalWidth - 4 - stripAnsi(periodHeader).length)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));

  const printRow = (label: string, values: (number | null)[], indent = 0, showSign = false, isTotal = false) => {
    const row = renderRow(label, values, labelWidth, colWidth, indent, showSign, isTotal);
    console.log(chalk.cyan('│') + ' ' + row + ' '.repeat(Math.max(0, totalWidth - 4 - stripAnsi(row).length)) + ' ' + chalk.cyan('│'));
  };

  const printSection = (title: string) => {
    console.log(chalk.cyan('│') + ' ' + renderSectionHeader(title, totalWidth - 4) + ' ' + chalk.cyan('│'));
  };

  // Operating Activities
  printSection('OPERATING ACTIVITIES');
  printRow('Net Income', periods.map(p => p.netIncome), 2);
  printRow('Depreciation', periods.map(p => p.depreciation), 2);
  printRow('Changes in Working Cap.', periods.map(p => p.changeInWorkingCapital), 2, true);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Cash from Operations', periods.map(p => p.operatingCashFlow), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));

  // Investing Activities
  printSection('INVESTING ACTIVITIES');
  printRow('Capital Expenditures', periods.map(p => p.capitalExpenditures), 2);
  printRow('Acquisitions', periods.map(p => p.acquisitions), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Cash from Investing', periods.map(p => p.investingCashFlow), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));

  // Financing Activities
  printSection('FINANCING ACTIVITIES');
  printRow('Dividends Paid', periods.map(p => p.dividendsPaid), 2);
  printRow('Stock Repurchased', periods.map(p => p.stockRepurchased), 2);
  printRow('Debt Repayment', periods.map(p => p.debtRepayment), 2);
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Cash from Financing', periods.map(p => p.financingCashFlow), 0, false, true);

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(totalWidth - 4) + ' ' + chalk.cyan('│'));

  // Summary
  console.log(chalk.cyan('│') + ' ' + renderDivider(totalWidth - 4) + ' ' + chalk.cyan('│'));
  printRow('Net Change in Cash', periods.map(p => p.netChangeInCash), 0, true, true);
  printRow('Free Cash Flow', periods.map(p => p.freeCashFlow), 0, false, true);

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(totalWidth - 2) + '┤'));
  const footer = `Fiscal Year End: ${statements.fiscalYearEnd}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(footer.padEnd(totalWidth - 4)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('╰' + '─'.repeat(totalWidth - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Combined Display (All Statements)
// ═══════════════════════════════════════════════════════════════════════════

export function displayFinancialStatements(
  statements: FinancialStatements,
  statementType?: 'income' | 'balance' | 'cashflow' | 'all'
): void {
  const type = statementType ?? 'all';

  if (type === 'all' || type === 'income') {
    displayIncomeStatement(statements);
  }

  if (type === 'all' || type === 'balance') {
    displayBalanceSheet(statements);
  }

  if (type === 'all' || type === 'cashflow') {
    displayCashFlowStatement(statements);
  }

  // Show hints
  console.log(chalk.dim('  Tip: Use specific statement types:'));
  console.log(chalk.dim('    fin <SYM> income    - Income statement only'));
  console.log(chalk.dim('    fin <SYM> balance   - Balance sheet only'));
  console.log(chalk.dim('    fin <SYM> cashflow  - Cash flow statement only'));
  console.log('');
}
