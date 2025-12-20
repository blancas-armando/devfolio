/**
 * Command History Database Operations
 * Persists command history for recall and search
 */

import { getDb } from './index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CommandHistoryEntry {
  id: number;
  command: string;
  executedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// Command History Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add a command to history
 */
export function addToHistory(command: string): CommandHistoryEntry {
  const db = getDb();
  const trimmed = command.trim();

  // Don't store empty commands or very short ones
  if (trimmed.length < 1) {
    return { id: 0, command: trimmed, executedAt: new Date() };
  }

  const result = db.prepare(
    'INSERT INTO command_history (command) VALUES (?)'
  ).run(trimmed);

  return {
    id: result.lastInsertRowid as number,
    command: trimmed,
    executedAt: new Date(),
  };
}

/**
 * Get recent command history
 */
export function getHistory(limit: number = 50): CommandHistoryEntry[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, command, executed_at FROM command_history ORDER BY executed_at DESC LIMIT ?'
  ).all(limit) as { id: number; command: string; executed_at: string }[];

  return rows.map(r => ({
    id: r.id,
    command: r.command,
    executedAt: new Date(r.executed_at),
  }));
}

/**
 * Search command history
 */
export function searchHistory(query: string, limit: number = 20): CommandHistoryEntry[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT id, command, executed_at
     FROM command_history
     WHERE command LIKE ?
     ORDER BY executed_at DESC
     LIMIT ?`
  ).all(`%${query}%`, limit) as { id: number; command: string; executed_at: string }[];

  return rows.map(r => ({
    id: r.id,
    command: r.command,
    executedAt: new Date(r.executed_at),
  }));
}

/**
 * Get a specific command by its history number (1-indexed, most recent first)
 */
export function getHistoryCommand(num: number): string | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT command FROM command_history ORDER BY executed_at DESC LIMIT 1 OFFSET ?'
  ).get(num - 1) as { command: string } | undefined;

  return row?.command ?? null;
}

/**
 * Get unique commands (deduplicated, most recent first)
 */
export function getUniqueHistory(limit: number = 30): CommandHistoryEntry[] {
  const db = getDb();
  // Get unique commands, keeping the most recent occurrence of each
  const rows = db.prepare(
    `SELECT id, command, MAX(executed_at) as executed_at
     FROM command_history
     GROUP BY command
     ORDER BY executed_at DESC
     LIMIT ?`
  ).all(limit) as { id: number; command: string; executed_at: string }[];

  return rows.map(r => ({
    id: r.id,
    command: r.command,
    executedAt: new Date(r.executed_at),
  }));
}

/**
 * Clear old history (keep last N days)
 */
export function clearOldHistory(keepDays: number = 30): number {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);

  const result = db.prepare(
    'DELETE FROM command_history WHERE executed_at < ?'
  ).run(cutoff.toISOString());

  return result.changes;
}

/**
 * Clear all history
 */
export function clearAllHistory(): number {
  const db = getDb();
  const result = db.prepare('DELETE FROM command_history').run();
  return result.changes;
}

/**
 * Get history count
 */
export function getHistoryCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM command_history').get() as { count: number };
  return row.count;
}
