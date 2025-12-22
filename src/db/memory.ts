/**
 * Conversational Memory Service
 * Manages chat sessions, messages, and discussed symbols
 */

import { getDb } from './index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatSession {
  id: number;
  startedAt: Date;
  lastActiveAt: Date;
  contextSummary: string | null;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls: string | null;
  toolResults: string | null;
  createdAt: Date;
}

export interface ConversationSymbol {
  id: number;
  sessionId: number;
  symbol: string;
  mentionedAt: Date;
  context: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Session Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new chat session
 */
export function createSession(): ChatSession {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO chat_sessions (started_at, last_active_at)
    VALUES (datetime('now'), datetime('now'))
  `).run();

  return {
    id: result.lastInsertRowid as number,
    startedAt: new Date(),
    lastActiveAt: new Date(),
    contextSummary: null,
  };
}

/**
 * Get the most recent active session, or create one if none exists
 * Sessions older than 24 hours are considered stale
 */
export function getOrCreateSession(): ChatSession {
  const db = getDb();

  // Look for a recent session (within 24 hours)
  const row = db.prepare(`
    SELECT id, started_at, last_active_at, context_summary
    FROM chat_sessions
    WHERE last_active_at > datetime('now', '-24 hours')
    ORDER BY last_active_at DESC
    LIMIT 1
  `).get() as {
    id: number;
    started_at: string;
    last_active_at: string;
    context_summary: string | null;
  } | undefined;

  if (row) {
    return {
      id: row.id,
      startedAt: new Date(row.started_at),
      lastActiveAt: new Date(row.last_active_at),
      contextSummary: row.context_summary,
    };
  }

  return createSession();
}

/**
 * Update session's last active time
 */
export function touchSession(sessionId: number): void {
  const db = getDb();
  db.prepare(`
    UPDATE chat_sessions
    SET last_active_at = datetime('now')
    WHERE id = ?
  `).run(sessionId);
}

/**
 * Update session's context summary
 */
export function updateSessionSummary(sessionId: number, summary: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE chat_sessions
    SET context_summary = ?, last_active_at = datetime('now')
    WHERE id = ?
  `).run(summary, sessionId);
}

/**
 * Get session by ID
 */
export function getSession(sessionId: number): ChatSession | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, started_at, last_active_at, context_summary
    FROM chat_sessions
    WHERE id = ?
  `).get(sessionId) as {
    id: number;
    started_at: string;
    last_active_at: string;
    context_summary: string | null;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    startedAt: new Date(row.started_at),
    lastActiveAt: new Date(row.last_active_at),
    contextSummary: row.context_summary,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Message Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add a message to a session
 */
export function addMessage(
  sessionId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  toolCalls?: unknown[],
  toolResults?: unknown[]
): ChatMessage {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO chat_messages (session_id, role, content, tool_calls, tool_results)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    sessionId,
    role,
    content,
    toolCalls ? JSON.stringify(toolCalls) : null,
    toolResults ? JSON.stringify(toolResults) : null
  );

  // Update session activity
  touchSession(sessionId);

  return {
    id: result.lastInsertRowid as number,
    sessionId,
    role,
    content,
    toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
    toolResults: toolResults ? JSON.stringify(toolResults) : null,
    createdAt: new Date(),
  };
}

/**
 * Get messages for a session
 */
export function getSessionMessages(sessionId: number, limit = 50): ChatMessage[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, session_id, role, content, tool_calls, tool_results, created_at
    FROM chat_messages
    WHERE session_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(sessionId, limit) as Array<{
    id: number;
    session_id: number;
    role: string;
    content: string;
    tool_calls: string | null;
    tool_results: string | null;
    created_at: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role as 'user' | 'assistant' | 'system',
    content: row.content,
    toolCalls: row.tool_calls,
    toolResults: row.tool_results,
    createdAt: new Date(row.created_at),
  }));
}

/**
 * Get recent messages across all sessions (for context)
 */
export function getRecentMessages(limit = 20): ChatMessage[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, session_id, role, content, tool_calls, tool_results, created_at
    FROM chat_messages
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as Array<{
    id: number;
    session_id: number;
    role: string;
    content: string;
    tool_calls: string | null;
    tool_results: string | null;
    created_at: string;
  }>;

  return rows.reverse().map(row => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role as 'user' | 'assistant' | 'system',
    content: row.content,
    toolCalls: row.tool_calls,
    toolResults: row.tool_results,
    createdAt: new Date(row.created_at),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Symbol Tracking
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track a symbol mentioned in conversation
 */
export function trackSymbol(sessionId: number, symbol: string, context?: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO conversation_symbols (session_id, symbol, context)
    VALUES (?, ?, ?)
  `).run(sessionId, symbol.toUpperCase(), context ?? null);
}

/**
 * Get recently discussed symbols
 */
export function getRecentSymbols(limit = 10): ConversationSymbol[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, session_id, symbol, mentioned_at, context
    FROM conversation_symbols
    ORDER BY mentioned_at DESC
    LIMIT ?
  `).all(limit) as Array<{
    id: number;
    session_id: number;
    symbol: string;
    mentioned_at: string;
    context: string | null;
  }>;

  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    symbol: row.symbol,
    mentionedAt: new Date(row.mentioned_at),
    context: row.context,
  }));
}

/**
 * Get unique symbols discussed in a session
 */
export function getSessionSymbols(sessionId: number): string[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT DISTINCT symbol
    FROM conversation_symbols
    WHERE session_id = ?
    ORDER BY mentioned_at DESC
  `).all(sessionId) as Array<{ symbol: string }>;

  return rows.map(row => row.symbol);
}

/**
 * Get symbols discussed across recent sessions with their context
 */
export function getSymbolsWithContext(limit = 5): Array<{ symbol: string; context: string | null }> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT symbol, context
    FROM conversation_symbols
    WHERE mentioned_at > datetime('now', '-7 days')
    GROUP BY symbol
    ORDER BY MAX(mentioned_at) DESC
    LIMIT ?
  `).all(limit) as Array<{ symbol: string; context: string | null }>;

  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// Context Building
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a context summary from recent conversation history
 */
export function buildConversationContext(sessionId: number): string {
  const messages = getSessionMessages(sessionId, 10);
  const symbols = getSessionSymbols(sessionId);

  if (messages.length === 0) {
    return '';
  }

  const lines: string[] = [];

  if (symbols.length > 0) {
    lines.push(`Recently discussed symbols: ${symbols.slice(0, 5).join(', ')}`);
  }

  // Summarize recent conversation topics
  const recentTopics = messages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content.substring(0, 100));

  if (recentTopics.length > 0) {
    lines.push(`Recent topics: ${recentTopics.join(' | ')}`);
  }

  return lines.join('\n');
}

/**
 * Extract symbols from text (simple regex-based extraction)
 */
export function extractSymbolsFromText(text: string): string[] {
  // Match common stock symbol patterns: 1-5 uppercase letters
  const matches = text.match(/\b[A-Z]{1,5}\b/g) ?? [];

  // Filter out common words that aren't symbols
  const commonWords = new Set([
    'I', 'A', 'THE', 'AND', 'OR', 'IS', 'IT', 'TO', 'IN', 'ON', 'AT', 'BY',
    'FOR', 'OF', 'AS', 'IF', 'BUT', 'NOT', 'ALL', 'ARE', 'BE', 'CAN', 'DO',
    'HAS', 'HE', 'HIS', 'HOW', 'MY', 'NO', 'SO', 'UP', 'WE', 'YOU', 'ETF',
    'AI', 'CEO', 'CFO', 'IPO', 'SEC', 'FDA', 'EPS', 'P', 'E', 'PE', 'PEG',
  ]);

  return [...new Set(matches.filter(m => !commonWords.has(m)))];
}

// ═══════════════════════════════════════════════════════════════════════════
// Cleanup
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clean up old sessions (older than 30 days)
 */
export function cleanupOldSessions(): number {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM chat_sessions
    WHERE last_active_at < datetime('now', '-30 days')
  `).run();

  return result.changes;
}
