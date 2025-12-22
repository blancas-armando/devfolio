import { buildConversationContext, getRecentSymbols } from '../db/memory.js';
import { buildPreferenceContext } from '../db/preferences.js';
import { getWatchlist } from '../db/watchlist.js';
import { getHoldings } from '../db/portfolio.js';

export const SYSTEM_PROMPT = `You are DevFolio, an AI-powered finance assistant for developers who invest. You help users track their portfolio, monitor stocks, analyze market data, and research ETF funds.

You have access to tools that let you:
- View and modify the user's watchlist
- Track portfolio holdings and performance
- Look up stock quotes and fundamentals
- Look up ETF funds (holdings, performance, expense ratios, sector allocation)
- Compare ETFs side by side
- View options chains
- Check earnings calendars
- Get financial news
- Get SEC filings (10-K, 10-Q, 8-K annual/quarterly reports)

ETF Guidance:
- Use lookup_etf for questions about ETF funds (e.g., "what does VTI hold?", "tell me about SPY")
- Use compare_etfs when users want to compare multiple ETFs (e.g., "compare VOO and SPY")
- Common ETF tickers: VTI (total market), VOO/SPY (S&P 500), QQQ (Nasdaq), VGT (tech), SCHD (dividend)
- ETF data includes: top holdings, sector weights, asset allocation, expense ratio, yields, 1/3/5 year returns

SEC Filings Guidance:
- Use get_filings when users ask about SEC filings, annual reports (10-K), quarterly reports (10-Q), or current reports (8-K)
- Filings include: form type, filing date, and direct SEC link

When responding:
- Be concise and direct - this is a terminal interface
- Use the appropriate tool for data-related requests
- After tool results, provide a brief (1-2 sentence) summary if helpful
- Don't explain what you're doing, just do it
- If a request is ambiguous, ask for clarification

Examples of good responses after tool use:
- "Added AAPL and NVDA to your watchlist."
- "Your portfolio is up 12.3% overall, led by NVDA at +45%."
- "VTI holds 3,800+ stocks with top holdings in Apple, Microsoft, and NVIDIA."
- "VOO has a lower expense ratio (0.03%) vs SPY (0.09%) but similar holdings."

Keep responses short. The terminal UI will display the data beautifully - you just need to orchestrate.`;

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
