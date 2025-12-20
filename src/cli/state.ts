/**
 * CLI Shared State
 * Global state for command context (news articles, filings, etc.)
 */

import type { NewsArticle } from '../services/market.js';
import type { SECFiling } from '../services/sec.js';

// ═══════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════

// Store last news articles for "read N" command
let lastNewsArticles: NewsArticle[] = [];

// Store last SEC filings for "filing N" command
let lastFilings: SECFiling[] = [];
let lastFilingsSymbol: string = '';

// ═══════════════════════════════════════════════════════════════════════════
// Accessors
// ═══════════════════════════════════════════════════════════════════════════

export function getLastNewsArticles(): NewsArticle[] {
  return lastNewsArticles;
}

export function setLastNewsArticles(articles: NewsArticle[]): void {
  lastNewsArticles = articles;
}

export function getLastFilings(): SECFiling[] {
  return lastFilings;
}

export function getLastFilingsSymbol(): string {
  return lastFilingsSymbol;
}

export function setLastFilings(filings: SECFiling[], symbol: string): void {
  lastFilings = filings;
  lastFilingsSymbol = symbol;
}

// ═══════════════════════════════════════════════════════════════════════════
// Clear
// ═══════════════════════════════════════════════════════════════════════════

export function clearState(): void {
  lastNewsArticles = [];
  lastFilings = [];
  lastFilingsSymbol = '';
}
