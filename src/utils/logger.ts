/**
 * Structured Logger Utility
 *
 * Environment-based logging with service/operation context.
 * Respects LOG_LEVEL env var: debug, info, warn, error (default: warn)
 */

import { categorizeError, type AppError } from './errors.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  service: string;      // e.g., 'market', 'sec', 'earnings'
  operation: string;    // e.g., 'getQuote', 'fetchFilings'
  symbol?: string;      // Stock symbol if relevant
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  error?: AppError;
}

// ═══════════════════════════════════════════════════════════════════════════
// Log Level Configuration
// ═══════════════════════════════════════════════════════════════════════════

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel as LogLevel;
  }
  return 'warn'; // Default: only warnings and errors
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = getConfiguredLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
}

// ═══════════════════════════════════════════════════════════════════════════
// Formatting
// ═══════════════════════════════════════════════════════════════════════════

function formatEntry(entry: LogEntry): string {
  const { timestamp, level, context, message, error } = entry;
  const { service, operation, symbol } = context;

  const parts = [
    `[${timestamp}]`,
    `[${level.toUpperCase()}]`,
    `[${service}:${operation}]`,
  ];

  if (symbol) {
    parts.push(`[${symbol}]`);
  }

  parts.push(message);

  if (error?.technical) {
    parts.push(`| ${error.category}: ${error.technical}`);
  }

  return parts.join(' ');
}

function getTimestamp(): string {
  return new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
}

// ═══════════════════════════════════════════════════════════════════════════
// Logger Factory
// ═══════════════════════════════════════════════════════════════════════════

export interface Logger {
  debug: (message: string, metadata?: Record<string, unknown>) => void;
  info: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
  error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => void;
  child: (overrides: Partial<LogContext>) => Logger;
}

/**
 * Create a logger with service/operation context
 *
 * @example
 * const log = createLogger({ service: 'market', operation: 'getQuote' });
 * log.debug('Fetching quote');
 * log.error('Failed to fetch', error);
 *
 * // Create child logger with symbol context
 * const symbolLog = log.child({ symbol: 'AAPL' });
 * symbolLog.info('Quote retrieved');
 */
export function createLogger(context: LogContext): Logger {
  const log = (level: LogLevel, message: string, error?: AppError, metadata?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level,
      context: { ...context, metadata },
      message,
      error,
    };

    const formatted = formatEntry(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  };

  return {
    debug: (message, metadata) => log('debug', message, undefined, metadata),
    info: (message, metadata) => log('info', message, undefined, metadata),
    warn: (message, metadata) => log('warn', message, undefined, metadata),
    error: (message, rawError, metadata) => {
      const appError = rawError ? categorizeError(rawError) : undefined;
      log('error', message, appError, metadata);
    },
    child: (overrides) => createLogger({ ...context, ...overrides }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Pre-configured Service Loggers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a logger for a service module
 * Usage in service files:
 *
 * const log = serviceLogger('market');
 * const opLog = log('getQuote');
 * opLog.info('Fetching...');
 */
export function serviceLogger(service: string) {
  return (operation: string, symbol?: string) =>
    createLogger({ service, operation, symbol });
}

// Pre-built service loggers
export const loggers = {
  market: serviceLogger('market'),
  sec: serviceLogger('sec'),
  earnings: serviceLogger('earnings'),
  pulse: serviceLogger('pulse'),
  research: serviceLogger('research'),
  etf: serviceLogger('etf'),
  yahoo: serviceLogger('yahoo'),
  ai: serviceLogger('ai'),
};
