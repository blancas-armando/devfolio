import { useMemo, useCallback, useState, useRef } from 'react';
import { getHistory } from '../../db/history.js';

export const COMMANDS = [
  'brief', 'b',
  'pulse',
  'screen', 'sc',
  'watchlist', 'w',
  'portfolio', 'p',
  'news', 'n',
  'read',
  'help',
  'clear', 'home',
  'quit', 'q', 'exit',
  'add',
  'rm', 'remove',
  'filings', 'filing', 'sec',
  's', 'stock',
  'r', 'report', 'research',
  'e', 'earnings',
  'fin', 'financials', 'statements',
  'why',
  'etf',
  'compare', 'cs',
  'tutorial',
  'history',
  'groups', 'group',
];

export const SCREEN_PRESETS = [
  'gainers', 'losers', 'active', 'trending', 'value', 'growth', 'dividend',
  'tech', 'healthcare', 'finance', 'energy', 'consumer', 'industrial',
];

export const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'UNH', 'HD', 'MA',
  'SPY', 'QQQ', 'VTI', 'VOO', 'IWM', 'VGT', 'VUG',
];

const SYMBOL_COMMANDS = [
  's ', 'stock ',
  'r ', 'report ', 'research ',
  'e ', 'earnings ',
  'fin ', 'financials ',
  'why ',
  'etf ',
  'filings ', 'sec ',
  'add ',
  'news ',
];

export interface UseTabCompletionOptions {
  customSymbols?: string[];
  maxCompletions?: number;
}

export interface UseTabCompletionResult {
  getCompletions: (input: string) => string[];
  applyCompletion: (input: string, completion: string) => string;
}

export function useTabCompletion(
  options: UseTabCompletionOptions = {}
): UseTabCompletionResult {
  const { customSymbols = [], maxCompletions = 10 } = options;

  const allSymbols = useMemo(
    () => [...new Set([...POPULAR_SYMBOLS, ...customSymbols])],
    [customSymbols]
  );

  const getCompletions = useCallback(
    (input: string): string[] => {
      const trimmed = input.trim().toLowerCase();

      if (!trimmed) {
        return COMMANDS.slice(0, maxCompletions);
      }

      for (const cmd of SYMBOL_COMMANDS) {
        if (trimmed.startsWith(cmd)) {
          const partial = trimmed.slice(cmd.length).toUpperCase();
          const matches = allSymbols
            .filter(s => s.startsWith(partial))
            .slice(0, maxCompletions);
          return matches.map(s => cmd.trim() + ' ' + s);
        }
      }

      if (trimmed.startsWith('compare ') || trimmed.startsWith('cs ')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const partial = (parts[parts.length - 1] || '').toUpperCase();
          const matches = allSymbols
            .filter(s => s.startsWith(partial))
            .slice(0, maxCompletions);
          const prefix = parts.slice(0, -1).join(' ') + ' ';
          return matches.map(s => prefix + s);
        }
      }

      if (trimmed.startsWith('screen ') || trimmed.startsWith('sc ')) {
        const partial = trimmed.replace(/^(screen|sc)\s+/, '').toLowerCase();
        return SCREEN_PRESETS
          .filter(p => p.startsWith(partial))
          .map(p => trimmed.split(/\s+/)[0] + ' ' + p)
          .slice(0, maxCompletions);
      }

      return COMMANDS
        .filter(c => c.startsWith(trimmed))
        .slice(0, maxCompletions);
    },
    [allSymbols, maxCompletions]
  );

  const applyCompletion = useCallback(
    (_input: string, completion: string): string => completion,
    []
  );

  return { getCompletions, applyCompletion };
}

export interface UseHistoryResult {
  history: string[];
  prev: () => string | null;
  next: () => string | null;
  reset: () => void;
  index: number;
}

export function useHistory(): UseHistoryResult {
  const historyItems = useMemo(() => {
    try {
      const items = getHistory(100);
      return items.map(h => h.command);
    } catch {
      return [];
    }
  }, []);

  const [index, setIndex] = useState(-1);
  const savedInput = useRef('');

  const prev = useCallback((): string | null => {
    if (historyItems.length === 0) return null;

    const newIndex = Math.min(index + 1, historyItems.length - 1);
    setIndex(newIndex);
    return historyItems[newIndex] || null;
  }, [historyItems, index]);

  const next = useCallback((): string | null => {
    if (index <= 0) {
      setIndex(-1);
      return savedInput.current;
    }

    const newIndex = index - 1;
    setIndex(newIndex);
    return historyItems[newIndex] || null;
  }, [historyItems, index]);

  const reset = useCallback(() => {
    setIndex(-1);
    savedInput.current = '';
  }, []);

  return {
    history: historyItems,
    prev,
    next,
    reset,
    index,
  };
}

export interface UseInputHandlingResult {
  completions: UseTabCompletionResult;
  history: UseHistoryResult;
}

export function useInputHandling(
  options: UseTabCompletionOptions = {}
): UseInputHandlingResult {
  const completions = useTabCompletion(options);
  const history = useHistory();

  return { completions, history };
}
