/**
 * Error Handling Utilities
 * User-friendly error messages and error categorization
 */

// ═══════════════════════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════════════════════

export type ErrorCategory =
  | 'network'      // Connection issues, timeouts
  | 'api'          // API returned an error
  | 'rate_limit'   // Too many requests
  | 'not_found'    // Symbol/resource doesn't exist
  | 'auth'         // Authentication/API key issues
  | 'parse'        // Failed to parse response
  | 'unknown';     // Fallback

export interface AppError {
  category: ErrorCategory;
  message: string;        // User-friendly message
  technical?: string;     // Technical details (for logging)
  retryable: boolean;     // Can user retry?
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Detection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Categorize an error based on its message/type
 */
export function categorizeError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('socket')
  ) {
    return {
      category: 'network',
      message: 'Network connection issue. Please check your internet and try again.',
      technical: message,
      retryable: true,
    };
  }

  // Rate limiting
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests') ||
    lowerMessage.includes('429')
  ) {
    return {
      category: 'rate_limit',
      message: 'Too many requests. Please wait a moment and try again.',
      technical: message,
      retryable: true,
    };
  }

  // Authentication errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('api key') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('403')
  ) {
    return {
      category: 'auth',
      message: 'API authentication issue. Please check your GROQ_API_KEY.',
      technical: message,
      retryable: false,
    };
  }

  // Not found
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('no data') ||
    lowerMessage.includes('404')
  ) {
    return {
      category: 'not_found',
      message: 'Data not found. Please check the symbol and try again.',
      technical: message,
      retryable: false,
    };
  }

  // Parse errors
  if (
    lowerMessage.includes('json') ||
    lowerMessage.includes('parse') ||
    lowerMessage.includes('syntax')
  ) {
    return {
      category: 'parse',
      message: 'Received unexpected data format. Please try again.',
      technical: message,
      retryable: true,
    };
  }

  // Unknown/fallback
  return {
    category: 'unknown',
    message: 'Something went wrong. Please try again.',
    technical: message,
    retryable: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// User-Friendly Messages
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a user-friendly error message for display
 */
export function getUserMessage(error: unknown): string {
  const appError = categorizeError(error);
  return appError.message;
}

/**
 * Context-specific error messages
 */
export const ErrorMessages = {
  // Stock/Symbol errors
  symbolNotFound: (symbol: string) =>
    `Could not find "${symbol}". Please check the ticker symbol.`,
  symbolInvalid: (symbol: string) =>
    `"${symbol}" doesn't look like a valid ticker symbol.`,

  // API service errors
  yahooFinanceDown: 'Market data service is temporarily unavailable. Please try again.',
  groqDown: 'AI service is temporarily unavailable. Please try again.',
  secEdgarDown: 'SEC filing service is temporarily unavailable. Please try again.',

  // Feature-specific errors
  watchlistEmpty: 'Your watchlist is empty. Try "add AAPL" to add stocks.',
  portfolioEmpty: 'Your portfolio is empty. Tell me about your trades to track them.',
  newsUnavailable: 'News feed is temporarily unavailable.',
  filingsUnavailable: (symbol: string) =>
    `Could not fetch SEC filings for ${symbol}. The company may not have recent filings.`,
  earningsUnavailable: (symbol: string) =>
    `Earnings data for ${symbol} is not available.`,
  researchUnavailable: (symbol: string) =>
    `Could not generate research report for ${symbol}. Please try again.`,

  // Network errors
  networkError: 'Network connection issue. Please check your internet.',
  timeout: 'Request timed out. Please try again.',

  // Rate limits
  rateLimited: 'Too many requests. Please wait a moment before trying again.',

  // Generic
  tryAgain: 'Something went wrong. Please try again.',
};

// ═══════════════════════════════════════════════════════════════════════════
// Safe JSON Parsing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safely parse JSON with error handling
 * Returns null on parse failure instead of throwing
 */
export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Extract and parse JSON from a string (for AI responses)
 * Handles cases where JSON is embedded in text
 */
export function extractJson<T>(text: string): T | null {
  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  return safeJsonParse<T>(jsonMatch[0]);
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP Response Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a fetch response indicates an error and return appropriate message
 */
export function checkResponseStatus(response: Response): AppError | null {
  if (response.ok) {
    return null;
  }

  const status = response.status;

  if (status === 429) {
    return {
      category: 'rate_limit',
      message: ErrorMessages.rateLimited,
      technical: `HTTP 429 from ${response.url}`,
      retryable: true,
    };
  }

  if (status === 401 || status === 403) {
    return {
      category: 'auth',
      message: 'Access denied. Please check your API configuration.',
      technical: `HTTP ${status} from ${response.url}`,
      retryable: false,
    };
  }

  if (status === 404) {
    return {
      category: 'not_found',
      message: 'The requested data was not found.',
      technical: `HTTP 404 from ${response.url}`,
      retryable: false,
    };
  }

  if (status >= 500) {
    return {
      category: 'api',
      message: 'The service is temporarily unavailable. Please try again.',
      technical: `HTTP ${status} from ${response.url}`,
      retryable: true,
    };
  }

  return {
    category: 'api',
    message: ErrorMessages.tryAgain,
    technical: `HTTP ${status} from ${response.url}`,
    retryable: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a stock symbol format
 */
export function isValidSymbol(symbol: string): boolean {
  // Basic validation: 1-5 uppercase letters
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
}

/**
 * Validate and normalize a symbol, returning error message if invalid
 */
export function validateSymbol(input: string): { symbol: string } | { error: string } {
  const trimmed = input.trim().toUpperCase();

  if (!trimmed) {
    return { error: 'Please provide a ticker symbol.' };
  }

  if (!isValidSymbol(trimmed)) {
    return { error: ErrorMessages.symbolInvalid(trimmed) };
  }

  return { symbol: trimmed };
}
