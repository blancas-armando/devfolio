/**
 * SEC Filing Chunker
 *
 * Splits SEC filings into chunks for RAG retrieval.
 * Detects 10-K/10-Q sections and creates searchable chunks.
 */

import { getDb } from '../../db/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface Section {
  id: string;
  name: string;
  pattern: RegExp;
}

export interface Chunk {
  sectionName: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

export interface FilingMetadata {
  symbol: string;
  form: string;
  filingDate: string;
  accessionNumber: string;
  fileUrl: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 10-K/10-Q Section Patterns
// ═══════════════════════════════════════════════════════════════════════════

export const SECTIONS: Section[] = [
  { id: 'item1', name: 'Business', pattern: /Item\s*1\.?\s*Business/i },
  { id: 'item1a', name: 'Risk Factors', pattern: /Item\s*1A\.?\s*Risk\s*Factors/i },
  { id: 'item1b', name: 'Unresolved Staff Comments', pattern: /Item\s*1B\.?\s*Unresolved/i },
  { id: 'item2', name: 'Properties', pattern: /Item\s*2\.?\s*Properties/i },
  { id: 'item3', name: 'Legal Proceedings', pattern: /Item\s*3\.?\s*Legal/i },
  { id: 'item4', name: 'Mine Safety', pattern: /Item\s*4\.?\s*Mine\s*Safety/i },
  { id: 'item5', name: 'Market for Common Equity', pattern: /Item\s*5\.?\s*Market/i },
  { id: 'item6', name: 'Selected Financial Data', pattern: /Item\s*6\.?\s*Selected/i },
  { id: 'item7', name: "MD&A", pattern: /Item\s*7\.?\s*Management['']?s?\s*Discussion/i },
  { id: 'item7a', name: 'Quantitative Risk', pattern: /Item\s*7A\.?\s*Quantitative/i },
  { id: 'item8', name: 'Financial Statements', pattern: /Item\s*8\.?\s*Financial\s*Statements/i },
  { id: 'item9', name: 'Disagreements with Accountants', pattern: /Item\s*9\.?\s*Changes.*Disagreements/i },
  { id: 'item9a', name: 'Controls and Procedures', pattern: /Item\s*9A\.?\s*Controls/i },
  { id: 'item10', name: 'Directors and Officers', pattern: /Item\s*10\.?\s*Directors/i },
  { id: 'item11', name: 'Executive Compensation', pattern: /Item\s*11\.?\s*Executive\s*Compensation/i },
  { id: 'item12', name: 'Security Ownership', pattern: /Item\s*12\.?\s*Security\s*Ownership/i },
  { id: 'item13', name: 'Related Transactions', pattern: /Item\s*13\.?\s*Certain\s*Relationships/i },
  { id: 'item14', name: 'Principal Accountant Fees', pattern: /Item\s*14\.?\s*Principal\s*Accountant/i },
  { id: 'item15', name: 'Exhibits', pattern: /Item\s*15\.?\s*Exhibits/i },
];

// ═══════════════════════════════════════════════════════════════════════════
// Chunking Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TARGET_CHUNK_SIZE = 1000; // Target tokens per chunk
const MAX_CHUNK_SIZE = 1500;    // Maximum tokens per chunk
const MIN_CHUNK_SIZE = 100;     // Minimum tokens per chunk
const OVERLAP_SIZE = 100;       // Token overlap between chunks

/**
 * Rough token count estimation (1 token ~= 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Detection
// ═══════════════════════════════════════════════════════════════════════════

interface DetectedSection {
  section: Section;
  startIndex: number;
  endIndex: number;
  content: string;
}

/**
 * Detect sections in filing text
 */
export function detectSections(text: string): DetectedSection[] {
  const detected: DetectedSection[] = [];
  const normalizedText = text.replace(/\r\n/g, '\n');

  // Find all section matches
  const matches: Array<{ section: Section; index: number }> = [];

  for (const section of SECTIONS) {
    const match = normalizedText.match(section.pattern);
    if (match && match.index !== undefined) {
      matches.push({ section, index: match.index });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.index - b.index);

  // Extract content between sections
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const startIndex = current.index;
    const endIndex = next ? next.index : normalizedText.length;
    const content = normalizedText.slice(startIndex, endIndex).trim();

    if (content.length > 0) {
      detected.push({
        section: current.section,
        startIndex,
        endIndex,
        content,
      });
    }
  }

  return detected;
}

// ═══════════════════════════════════════════════════════════════════════════
// Text Chunking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Split text into chunks of approximately target size
 */
export function chunkText(text: string, sectionName: string): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);
    const currentTokens = estimateTokens(currentChunk);

    // If adding this paragraph would exceed max, save current chunk
    if (currentTokens + paraTokens > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      if (currentTokens >= MIN_CHUNK_SIZE) {
        chunks.push({
          sectionName,
          chunkIndex: chunkIndex++,
          content: currentChunk.trim(),
          tokenCount: currentTokens,
        });
      }
      // Start new chunk with overlap
      const overlap = getOverlapText(currentChunk);
      currentChunk = overlap + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }

    // If current chunk is at target size, save it
    const newTokens = estimateTokens(currentChunk);
    if (newTokens >= TARGET_CHUNK_SIZE) {
      chunks.push({
        sectionName,
        chunkIndex: chunkIndex++,
        content: currentChunk.trim(),
        tokenCount: newTokens,
      });
      const overlap = getOverlapText(currentChunk);
      currentChunk = overlap;
    }
  }

  // Save final chunk
  const finalTokens = estimateTokens(currentChunk);
  if (finalTokens >= MIN_CHUNK_SIZE) {
    chunks.push({
      sectionName,
      chunkIndex: chunkIndex++,
      content: currentChunk.trim(),
      tokenCount: finalTokens,
    });
  }

  return chunks;
}

/**
 * Get overlap text from end of chunk
 */
function getOverlapText(text: string): string {
  const targetChars = OVERLAP_SIZE * 4; // Rough character count
  if (text.length <= targetChars) return '';

  const overlap = text.slice(-targetChars);
  // Try to start at a sentence boundary
  const sentenceStart = overlap.search(/[.!?]\s+[A-Z]/);
  if (sentenceStart > 0) {
    return overlap.slice(sentenceStart + 2);
  }
  return overlap;
}

// ═══════════════════════════════════════════════════════════════════════════
// Filing Processing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process a filing and store chunks in database
 */
export function processAndStoreFiling(
  metadata: FilingMetadata,
  rawText: string
): { filingId: number; chunkCount: number } {
  const db = getDb();

  // Insert or update filing record
  const insertFiling = db.prepare(`
    INSERT INTO sec_filings (symbol, form, filing_date, accession_number, file_url, raw_text, processed_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(accession_number) DO UPDATE SET
      raw_text = excluded.raw_text,
      processed_at = CURRENT_TIMESTAMP
  `);

  const result = insertFiling.run(
    metadata.symbol.toUpperCase(),
    metadata.form,
    metadata.filingDate,
    metadata.accessionNumber,
    metadata.fileUrl,
    rawText
  );

  // Get filing ID
  let filingId: number;
  if (result.changes > 0 && result.lastInsertRowid) {
    filingId = result.lastInsertRowid as number;
  } else {
    const existing = db.prepare(
      'SELECT id FROM sec_filings WHERE accession_number = ?'
    ).get(metadata.accessionNumber) as { id: number };
    filingId = existing.id;
  }

  // Clear existing chunks for this filing
  db.prepare('DELETE FROM filing_chunks WHERE filing_id = ?').run(filingId);

  // Detect sections and create chunks
  const sections = detectSections(rawText);
  let totalChunks = 0;

  const insertChunk = db.prepare(`
    INSERT INTO filing_chunks (filing_id, section_name, chunk_index, content, token_count)
    VALUES (?, ?, ?, ?, ?)
  `);

  // If no sections detected, chunk the entire text
  if (sections.length === 0) {
    const chunks = chunkText(rawText, 'General');
    for (const chunk of chunks) {
      insertChunk.run(filingId, chunk.sectionName, chunk.chunkIndex, chunk.content, chunk.tokenCount);
      totalChunks++;
    }
  } else {
    // Chunk each section
    for (const section of sections) {
      const chunks = chunkText(section.content, section.section.name);
      for (const chunk of chunks) {
        insertChunk.run(filingId, chunk.sectionName, chunk.chunkIndex, chunk.content, chunk.tokenCount);
        totalChunks++;
      }
    }
  }

  return { filingId, chunkCount: totalChunks };
}

/**
 * Get chunk statistics for a filing
 */
export function getFilingStats(filingId: number): {
  chunkCount: number;
  totalTokens: number;
  sections: string[];
} {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as chunk_count,
      SUM(token_count) as total_tokens
    FROM filing_chunks
    WHERE filing_id = ?
  `).get(filingId) as { chunk_count: number; total_tokens: number };

  const sections = db.prepare(`
    SELECT DISTINCT section_name
    FROM filing_chunks
    WHERE filing_id = ?
    ORDER BY section_name
  `).all(filingId) as { section_name: string }[];

  return {
    chunkCount: stats.chunk_count || 0,
    totalTokens: stats.total_tokens || 0,
    sections: sections.map(s => s.section_name),
  };
}

/**
 * Check if a filing has been processed
 */
export function isFilingProcessed(accessionNumber: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'SELECT id FROM sec_filings WHERE accession_number = ? AND processed_at IS NOT NULL'
  ).get(accessionNumber);
  return !!result;
}
