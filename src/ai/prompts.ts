import { buildConversationContext, getRecentSymbols } from '../db/memory.js';
import { buildPreferenceContext } from '../db/preferences.js';
import { getWatchlist } from '../db/watchlist.js';
import { getHoldings } from '../db/portfolio.js';
import { CHAT_SYSTEM_PROMPT } from './promptLibrary.js';

// Re-export the chat system prompt for backward compatibility
export const SYSTEM_PROMPT = CHAT_SYSTEM_PROMPT;

export const DEMO_CONTEXT = `The user is viewing a demo. The watchlist contains: AAPL, NVDA, TSLA, MSFT, GOOGL. The portfolio has positions in AAPL (50 shares at $150), NVDA (25 shares at $280), and TSLA (30 shares at $220).`;

// ═══════════════════════════════════════════════════════════════════════════
// Context Building
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build contextual system prompt with memory and preferences
 */
export function buildContextualPrompt(sessionId?: number): string {
  const parts: string[] = [SYSTEM_PROMPT];

  // Add user preferences context
  const prefContext = buildPreferenceContext();
  if (prefContext) {
    parts.push('\n' + prefContext);
  }

  // Add conversation context if session exists
  if (sessionId) {
    const convContext = buildConversationContext(sessionId);
    if (convContext) {
      parts.push('\nCONVERSATION CONTEXT:\n' + convContext);
    }
  }

  // Add recently discussed symbols
  const recentSymbols = getRecentSymbols(5);
  if (recentSymbols.length > 0) {
    const symbolList = recentSymbols.map(s => s.symbol).join(', ');
    parts.push(`\nRECENTLY DISCUSSED: ${symbolList}`);
  }

  return parts.join('\n');
}

/**
 * Build financial context with watchlist and portfolio info
 */
export function buildFinancialContext(): string {
  const parts: string[] = [];

  // Get watchlist
  try {
    const watchlist = getWatchlist();
    if (watchlist.length > 0) {
      parts.push(`WATCHLIST: ${watchlist.join(', ')}`);
    }
  } catch {
    // Ignore errors
  }

  // Get portfolio holdings
  try {
    const holdings = getHoldings();
    if (holdings.length > 0) {
      const holdingsList = holdings.map(h =>
        `${h.symbol} (${h.shares} @ $${h.costBasis.toFixed(2)})`
      ).join(', ');
      parts.push(`PORTFOLIO: ${holdingsList}`);
    }
  } catch {
    // Ignore errors
  }

  return parts.join('\n');
}

/**
 * Build full context for AI requests
 */
export function buildFullContext(sessionId?: number): string {
  const parts: string[] = [];

  // Add preference context
  const prefContext = buildPreferenceContext();
  if (prefContext) {
    parts.push(prefContext);
  }

  // Add financial context
  const finContext = buildFinancialContext();
  if (finContext) {
    parts.push(finContext);
  }

  // Add conversation context
  if (sessionId) {
    const convContext = buildConversationContext(sessionId);
    if (convContext) {
      parts.push('CONVERSATION CONTEXT:\n' + convContext);
    }
  }

  return parts.join('\n\n');
}
