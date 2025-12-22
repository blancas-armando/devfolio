/**
 * RAG Search Service
 *
 * Provides search over SEC filing chunks using:
 * 1. SQLite FTS5 full-text search (always available)
 * 2. Optional embeddings-based semantic search (if OpenAI key is available)
 */

import { getDb } from '../../db/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchResult {
  chunkId: number;
  filingId: number;
  symbol: string;
  form: string;
  filingDate: string;
  sectionName: string;
  content: string;
  tokenCount: number;
  score: number;
}

export interface SearchOptions {
  symbol?: string;
  form?: string;
  section?: string;
  limit?: number;
  offset?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Full-Text Search (FTS5)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search filing chunks using FTS5 full-text search
 */
export function searchFTS(query: string, options: SearchOptions = {}): SearchResult[] {
  const db = getDb();
  const { symbol, form, section, limit = 20, offset = 0 } = options;

  // Build the FTS query
  // Escape special FTS characters and prepare for matching
  const ftsQuery = query
    .replace(/['"]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => `"${term}"`)
    .join(' OR ');

  if (!ftsQuery) {
    return [];
  }

  let sql = `
    SELECT
      fc.id as chunk_id,
      fc.filing_id,
      sf.symbol,
      sf.form,
      sf.filing_date,
      fc.section_name,
      fc.content,
      fc.token_count,
      bm25(filing_chunks_fts) as score
    FROM filing_chunks_fts fts
    JOIN filing_chunks fc ON fts.rowid = fc.id
    JOIN sec_filings sf ON fc.filing_id = sf.id
    WHERE filing_chunks_fts MATCH ?
  `;

  const params: (string | number)[] = [ftsQuery];

  // Add filters
  if (symbol) {
    sql += ' AND sf.symbol = ?';
    params.push(symbol.toUpperCase());
  }
  if (form) {
    sql += ' AND sf.form = ?';
    params.push(form.toUpperCase());
  }
  if (section) {
    sql += ' AND fc.section_name LIKE ?';
    params.push(`%${section}%`);
  }

  sql += ' ORDER BY score LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const rows = db.prepare(sql).all(...params) as Array<{
      chunk_id: number;
      filing_id: number;
      symbol: string;
      form: string;
      filing_date: string;
      section_name: string;
      content: string;
      token_count: number;
      score: number;
    }>;

    return rows.map(row => ({
      chunkId: row.chunk_id,
      filingId: row.filing_id,
      symbol: row.symbol,
      form: row.form,
      filingDate: row.filing_date,
      sectionName: row.section_name,
      content: row.content,
      tokenCount: row.token_count,
      score: Math.abs(row.score), // BM25 returns negative scores
    }));
  } catch {
    // FTS table might not exist or be empty
    return [];
  }
}

/**
 * Search for specific sections across filings
 */
export function searchSection(
  sectionName: string,
  symbol?: string,
  limit: number = 10
): SearchResult[] {
  const db = getDb();

  let sql = `
    SELECT
      fc.id as chunk_id,
      fc.filing_id,
      sf.symbol,
      sf.form,
      sf.filing_date,
      fc.section_name,
      fc.content,
      fc.token_count,
      1.0 as score
    FROM filing_chunks fc
    JOIN sec_filings sf ON fc.filing_id = sf.id
    WHERE fc.section_name LIKE ?
  `;

  const params: (string | number)[] = [`%${sectionName}%`];

  if (symbol) {
    sql += ' AND sf.symbol = ?';
    params.push(symbol.toUpperCase());
  }

  sql += ' ORDER BY sf.filing_date DESC, fc.chunk_index ASC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as Array<{
    chunk_id: number;
    filing_id: number;
    symbol: string;
    form: string;
    filing_date: string;
    section_name: string;
    content: string;
    token_count: number;
    score: number;
  }>;

  return rows.map(row => ({
    chunkId: row.chunk_id,
    filingId: row.filing_id,
    symbol: row.symbol,
    form: row.form,
    filingDate: row.filing_date,
    sectionName: row.section_name,
    content: row.content,
    tokenCount: row.token_count,
    score: row.score,
  }));
}

/**
 * Get risk factors comparison across filings
 */
export function compareRiskFactors(symbol: string, limit: number = 3): SearchResult[] {
  return searchSection('Risk Factors', symbol, limit);
}

/**
 * Get all chunks for a specific filing
 */
export function getFilingChunks(filingId: number): SearchResult[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      fc.id as chunk_id,
      fc.filing_id,
      sf.symbol,
      sf.form,
      sf.filing_date,
      fc.section_name,
      fc.content,
      fc.token_count,
      1.0 as score
    FROM filing_chunks fc
    JOIN sec_filings sf ON fc.filing_id = sf.id
    WHERE fc.filing_id = ?
    ORDER BY fc.chunk_index ASC
  `).all(filingId) as Array<{
    chunk_id: number;
    filing_id: number;
    symbol: string;
    form: string;
    filing_date: string;
    section_name: string;
    content: string;
    token_count: number;
    score: number;
  }>;

  return rows.map(row => ({
    chunkId: row.chunk_id,
    filingId: row.filing_id,
    symbol: row.symbol,
    form: row.form,
    filingDate: row.filing_date,
    sectionName: row.section_name,
    content: row.content,
    tokenCount: row.token_count,
    score: row.score,
  }));
}

/**
 * Get processed filings for a symbol
 */
export function getProcessedFilings(symbol: string): Array<{
  id: number;
  form: string;
  filingDate: string;
  chunkCount: number;
}> {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      sf.id,
      sf.form,
      sf.filing_date,
      COUNT(fc.id) as chunk_count
    FROM sec_filings sf
    LEFT JOIN filing_chunks fc ON sf.id = fc.filing_id
    WHERE sf.symbol = ? AND sf.processed_at IS NOT NULL
    GROUP BY sf.id
    ORDER BY sf.filing_date DESC
  `).all(symbol.toUpperCase()) as Array<{
    id: number;
    form: string;
    filing_date: string;
    chunk_count: number;
  }>;

  return rows.map(row => ({
    id: row.id,
    form: row.form,
    filingDate: row.filing_date,
    chunkCount: row.chunk_count,
  }));
}

/**
 * Check if embeddings are available (OpenAI key configured)
 */
export function hasEmbeddingsSupport(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get search statistics
 */
export function getSearchStats(): {
  filingCount: number;
  chunkCount: number;
  symbolCount: number;
} {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM sec_filings WHERE processed_at IS NOT NULL) as filing_count,
      (SELECT COUNT(*) FROM filing_chunks) as chunk_count,
      (SELECT COUNT(DISTINCT symbol) FROM sec_filings WHERE processed_at IS NOT NULL) as symbol_count
  `).get() as {
    filing_count: number;
    chunk_count: number;
    symbol_count: number;
  };

  return {
    filingCount: stats.filing_count || 0,
    chunkCount: stats.chunk_count || 0,
    symbolCount: stats.symbol_count || 0,
  };
}
