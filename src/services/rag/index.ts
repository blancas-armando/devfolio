/**
 * RAG Service - Public API
 *
 * Provides retrieval-augmented generation for SEC filings.
 */

// Re-export chunker functions
export {
  processAndStoreFiling,
  getFilingStats,
  isFilingProcessed,
  detectSections,
  SECTIONS,
  type FilingMetadata,
  type Chunk,
} from './chunker.js';

// Re-export search functions
export {
  searchFTS,
  searchSection,
  compareRiskFactors,
  getFilingChunks,
  getProcessedFilings,
  hasEmbeddingsSupport,
  getSearchStats,
  type SearchResult,
  type SearchOptions,
} from './search.js';
