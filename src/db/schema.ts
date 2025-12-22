import type Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT UNIQUE NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      shares REAL NOT NULL,
      cost_basis REAL NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(symbol);
    CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);

    -- Command history for persistent history feature
    CREATE TABLE IF NOT EXISTS command_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_history_executed ON command_history(executed_at DESC);

    -- Comparison groups for saving stock/ETF comparisons
    CREATE TABLE IF NOT EXISTS comparison_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES comparison_groups(id) ON DELETE CASCADE,
      UNIQUE(group_id, symbol)
    );
    CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);

    -- ASCII logo cache for company logos
    CREATE TABLE IF NOT EXISTS logo_cache (
      symbol TEXT PRIMARY KEY,
      ascii_art TEXT NOT NULL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
