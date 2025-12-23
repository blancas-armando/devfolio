/**
 * Export Service
 *
 * Exports watchlist, portfolio, preferences, and history
 * in CSV and JSON formats.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { getWatchlist } from '../db/watchlist.js';
import { getPortfolioRaw } from '../db/portfolio.js';
import { getAllPreferences } from '../db/preferences.js';
import { getHistory } from '../db/history.js';

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  recordCount: number;
}

/**
 * Export watchlist to CSV
 */
export function exportWatchlistCSV(outputDir = '.'): ExportResult {
  try {
    const symbols = getWatchlist();
    if (symbols.length === 0) {
      return { success: false, error: 'Watchlist is empty', recordCount: 0 };
    }

    const header = 'symbol';
    const rows = symbols.join('\n');
    const csv = `${header}\n${rows}`;

    const filePath = join(outputDir, `watchlist_${formatDate()}.csv`);
    writeFileSync(filePath, csv, 'utf-8');

    return { success: true, filePath, recordCount: symbols.length };
  } catch (error) {
    return { success: false, error: (error as Error).message, recordCount: 0 };
  }
}

/**
 * Export portfolio to CSV
 */
export function exportPortfolioCSV(outputDir = '.'): ExportResult {
  try {
    const holdings = getPortfolioRaw();
    if (holdings.length === 0) {
      return { success: false, error: 'Portfolio is empty', recordCount: 0 };
    }

    const header = 'symbol,shares,cost_basis,added_at';
    const rows = holdings
      .map(h => `${h.symbol},${h.shares},${h.costBasis},${h.addedAt.toISOString()}`)
      .join('\n');
    const csv = `${header}\n${rows}`;

    const filePath = join(outputDir, `portfolio_${formatDate()}.csv`);
    writeFileSync(filePath, csv, 'utf-8');

    return { success: true, filePath, recordCount: holdings.length };
  } catch (error) {
    return { success: false, error: (error as Error).message, recordCount: 0 };
  }
}

/**
 * Export preferences to JSON
 */
export function exportPreferencesJSON(outputDir = '.'): ExportResult {
  try {
    const prefs = getAllPreferences();
    if (prefs.length === 0) {
      return { success: false, error: 'No preferences learned yet', recordCount: 0 };
    }

    const data = prefs.map(p => ({
      key: p.key,
      value: p.value,
      confidence: p.confidence,
      lastUpdated: p.lastUpdated.toISOString(),
    }));

    const json = JSON.stringify(data, null, 2);
    const filePath = join(outputDir, `preferences_${formatDate()}.json`);
    writeFileSync(filePath, json, 'utf-8');

    return { success: true, filePath, recordCount: prefs.length };
  } catch (error) {
    return { success: false, error: (error as Error).message, recordCount: 0 };
  }
}

/**
 * Export command history to CSV
 */
export function exportHistoryCSV(limit = 100, outputDir = '.'): ExportResult {
  try {
    const history = getHistory(limit);
    if (history.length === 0) {
      return { success: false, error: 'No command history', recordCount: 0 };
    }

    const header = 'command,executed_at';
    const rows = history
      .map(h => `"${h.command.replace(/"/g, '""')}",${h.executedAt.toISOString()}`)
      .join('\n');
    const csv = `${header}\n${rows}`;

    const filePath = join(outputDir, `history_${formatDate()}.csv`);
    writeFileSync(filePath, csv, 'utf-8');

    return { success: true, filePath, recordCount: history.length };
  } catch (error) {
    return { success: false, error: (error as Error).message, recordCount: 0 };
  }
}

/**
 * Format date for filename
 */
function formatDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
