/**
 * Fuzzy Command Matching Utilities
 *
 * Uses Levenshtein distance to suggest similar commands
 * when an unknown command is entered.
 */

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Create distance matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill in the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Deletion
        dp[i][j - 1] + 1,      // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Find similar commands based on Levenshtein distance
 */
export function findSimilarCommands(
  input: string,
  commands: string[],
  maxDistance = 2
): string[] {
  const lowerInput = input.toLowerCase();
  const matches: Array<{ command: string; distance: number }> = [];

  for (const cmd of commands) {
    const distance = levenshteinDistance(lowerInput, cmd.toLowerCase());
    if (distance <= maxDistance) {
      matches.push({ command: cmd, distance });
    }
  }

  // Sort by distance (closest first), then alphabetically
  matches.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.command.localeCompare(b.command);
  });

  // Return top 3 suggestions
  return matches.slice(0, 3).map(m => m.command);
}

/**
 * Check if input looks like a natural language question rather than a command.
 * Returns true if the input should be sent to AI instead of showing "Unknown command".
 */
export function isNaturalLanguageInput(input: string): boolean {
  const parts = input.trim().toLowerCase().split(/\s+/);

  // Single word inputs are likely commands or typos
  if (parts.length === 1) return false;

  // Question words that indicate natural language
  const questionWords = [
    'is', 'are', 'was', 'were', 'what', 'how', 'does', 'do', 'did',
    'can', 'could', 'will', 'would', 'should', 'tell', 'explain',
    'give', 'show', 'describe', 'list', 'find', 'search', 'look',
    'analyze', 'analyse', 'summarize', 'summarise', 'when', 'where',
    'which', 'who', 'whose', 'whom'
  ];

  // If first word is a question word (not also a command), it's natural language
  const firstWord = parts[0];
  if (questionWords.includes(firstWord) && !KNOWN_COMMANDS.includes(firstWord)) {
    return true;
  }

  // Long inputs (4+ words) are likely natural language
  if (parts.length >= 4) return true;

  // "why" followed by something other than a stock symbol is natural language
  // e.g., "why is tech up" vs "why AAPL"
  if (firstWord === 'why' && parts.length > 1) {
    const secondWord = parts[1];
    // Stock symbols are 1-5 uppercase letters, but user typed lowercase
    // If second word is longer than 5 chars or contains non-letters, it's natural language
    if (secondWord.length > 5 || !/^[a-z]+$/.test(secondWord)) {
      return true;
    }
    // Common words that indicate natural language after "why"
    const nlIndicators = ['is', 'are', 'was', 'were', 'did', 'does', 'do', 'the', 'my', 'has', 'have'];
    if (nlIndicators.includes(secondWord)) {
      return true;
    }
  }

  return false;
}

/**
 * All known commands for fuzzy matching
 */
export const KNOWN_COMMANDS = [
  // Market
  'brief', 'b',
  'pulse',
  'screen', 'sc',
  'news', 'n',
  'read',
  // Stocks
  'stock', 's',
  'research', 'r',
  'earnings', 'e',
  'financials', 'fin',
  'history', 'hist',
  'why',
  // ETFs
  'etf',
  'compare',
  // SEC
  'filings', 'sec',
  'filing',
  // Portfolio
  'watchlist', 'w',
  'portfolio', 'p',
  'add',
  'remove', 'rm',
  'groups',
  // Other
  'preferences', 'prefs',
  'recall',
  'export',
  'setup',
  'tutorial',
  'help',
  'clear', 'home',
  'quit', 'q', 'exit',
  'live',
  'alerts', 'alert',
  'webhook',
  'config',
  'stats',
  'crypto', 'c',
  'options', 'chain',
];
