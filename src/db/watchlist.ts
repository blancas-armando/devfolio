import { getDb } from './index.js';

export function getWatchlist(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT symbol FROM watchlist ORDER BY added_at DESC').all() as { symbol: string }[];
  return rows.map((r) => r.symbol);
}

export function addToWatchlist(symbols: string[]): string[] {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)'
  );

  const added: string[] = [];
  const insertMany = db.transaction((syms: string[]) => {
    for (const symbol of syms) {
      const upper = symbol.toUpperCase();
      const result = insert.run(upper);
      if (result.changes > 0) {
        added.push(upper);
      }
    }
  });

  insertMany(symbols);
  return added;
}

export function removeFromWatchlist(symbols: string[]): string[] {
  const db = getDb();
  const remove = db.prepare('DELETE FROM watchlist WHERE symbol = ?');

  const removed: string[] = [];
  const removeMany = db.transaction((syms: string[]) => {
    for (const symbol of syms) {
      const upper = symbol.toUpperCase();
      const result = remove.run(upper);
      if (result.changes > 0) {
        removed.push(upper);
      }
    }
  });

  removeMany(symbols);
  return removed;
}

export function isInWatchlist(symbol: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT 1 FROM watchlist WHERE symbol = ?')
    .get(symbol.toUpperCase());
  return !!row;
}
