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

    -- Chat sessions for conversational memory
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      context_summary TEXT
    );

    -- Messages within chat sessions
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      tool_results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

    -- Symbols discussed in conversations (for proactive updates)
    CREATE TABLE IF NOT EXISTS conversation_symbols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      mentioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      context TEXT,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_conv_symbols_session ON conversation_symbols(session_id);
    CREATE INDEX IF NOT EXISTS idx_conv_symbols_symbol ON conversation_symbols(symbol);

    -- Learned user preferences
    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      confidence REAL DEFAULT 0.5,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ═══════════════════════════════════════════════════════════════════════════
    -- RAG: SEC Filings Cache and Search
    -- ═══════════════════════════════════════════════════════════════════════════

    -- Cached SEC filings metadata
    CREATE TABLE IF NOT EXISTS sec_filings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      form TEXT NOT NULL,
      filing_date TEXT NOT NULL,
      accession_number TEXT UNIQUE NOT NULL,
      file_url TEXT NOT NULL,
      raw_text TEXT,
      processed_at DATETIME
    );
    CREATE INDEX IF NOT EXISTS idx_sec_filings_symbol ON sec_filings(symbol);
    CREATE INDEX IF NOT EXISTS idx_sec_filings_form ON sec_filings(form);
    CREATE INDEX IF NOT EXISTS idx_sec_filings_date ON sec_filings(filing_date DESC);

    -- Filing chunks for RAG retrieval
    CREATE TABLE IF NOT EXISTS filing_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filing_id INTEGER NOT NULL,
      section_name TEXT,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      token_count INTEGER,
      FOREIGN KEY (filing_id) REFERENCES sec_filings(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_filing_chunks_filing ON filing_chunks(filing_id);
    CREATE INDEX IF NOT EXISTS idx_filing_chunks_section ON filing_chunks(section_name);

    -- Embeddings for semantic search (optional - for OpenAI users)
    CREATE TABLE IF NOT EXISTS filing_embeddings (
      chunk_id INTEGER PRIMARY KEY,
      embedding BLOB NOT NULL,
      model TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chunk_id) REFERENCES filing_chunks(id) ON DELETE CASCADE
    );

    -- ═══════════════════════════════════════════════════════════════════════════
    -- Webhooks
    -- ═══════════════════════════════════════════════════════════════════════════

    -- Webhook configurations for alert delivery
    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      name TEXT,
      enabled INTEGER DEFAULT 1,
      alert_types TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      fail_count INTEGER DEFAULT 0
    );

    -- ═══════════════════════════════════════════════════════════════════════════
    -- Quote Cache (for offline viewing)
    -- ═══════════════════════════════════════════════════════════════════════════

    CREATE TABLE IF NOT EXISTS quote_cache (
      symbol TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_quote_cache_cached ON quote_cache(cached_at DESC);
  `);

  // Create FTS5 virtual table for full-text search (fallback for non-OpenAI users)
  // This is done separately because virtual tables can't be in IF NOT EXISTS blocks
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS filing_chunks_fts
      USING fts5(
        content,
        section_name,
        content='filing_chunks',
        content_rowid='id'
      );
    `);
  } catch {
    // FTS table may already exist
  }

  // Create triggers to keep FTS index in sync
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS filing_chunks_ai AFTER INSERT ON filing_chunks BEGIN
        INSERT INTO filing_chunks_fts(rowid, content, section_name)
        VALUES (new.id, new.content, new.section_name);
      END;

      CREATE TRIGGER IF NOT EXISTS filing_chunks_ad AFTER DELETE ON filing_chunks BEGIN
        INSERT INTO filing_chunks_fts(filing_chunks_fts, rowid, content, section_name)
        VALUES ('delete', old.id, old.content, old.section_name);
      END;

      CREATE TRIGGER IF NOT EXISTS filing_chunks_au AFTER UPDATE ON filing_chunks BEGIN
        INSERT INTO filing_chunks_fts(filing_chunks_fts, rowid, content, section_name)
        VALUES ('delete', old.id, old.content, old.section_name);
        INSERT INTO filing_chunks_fts(rowid, content, section_name)
        VALUES (new.id, new.content, new.section_name);
      END;
    `);
  } catch {
    // Triggers may already exist
  }
}
