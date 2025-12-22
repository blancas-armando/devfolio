/**
 * Live Mode Service
 * Enhanced polling for real-time quote updates
 */

import { getQuotes } from './market.js';
import type { Quote } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface LiveModeConfig {
  intervalMs: number;
  maxSymbols: number;
}

export interface LiveModeState {
  active: boolean;
  symbols: string[];
  lastUpdate: Date | null;
  updateCount: number;
}

export type LiveUpdateCallback = (quotes: Quote[], state: LiveModeState) => void;

const DEFAULT_CONFIG: LiveModeConfig = {
  intervalMs: 10000, // 10 seconds
  maxSymbols: 20,
};

// ═══════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════

let config: LiveModeConfig = { ...DEFAULT_CONFIG };
let intervalId: NodeJS.Timeout | null = null;
let symbols: Set<string> = new Set();
let callbacks: Set<LiveUpdateCallback> = new Set();
let lastUpdate: Date | null = null;
let updateCount = 0;

// ═══════════════════════════════════════════════════════════════════════════
// Core Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start live mode with specified symbols
 */
export function startLiveMode(symbolList: string[], customConfig?: Partial<LiveModeConfig>): boolean {
  if (intervalId) {
    return false; // Already running
  }

  if (customConfig) {
    config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  // Add symbols (up to max)
  symbols = new Set(symbolList.slice(0, config.maxSymbols).map(s => s.toUpperCase()));

  if (symbols.size === 0) {
    return false;
  }

  updateCount = 0;

  // Initial fetch
  runUpdate();

  // Set up interval
  intervalId = setInterval(runUpdate, config.intervalMs);

  return true;
}

/**
 * Stop live mode
 */
export function stopLiveMode(): boolean {
  if (!intervalId) {
    return false;
  }

  clearInterval(intervalId);
  intervalId = null;
  symbols.clear();
  updateCount = 0;

  return true;
}

/**
 * Check if live mode is active
 */
export function isLiveModeActive(): boolean {
  return intervalId !== null;
}

/**
 * Get current live mode state
 */
export function getLiveModeState(): LiveModeState {
  return {
    active: intervalId !== null,
    symbols: Array.from(symbols),
    lastUpdate,
    updateCount,
  };
}

/**
 * Add symbol to live tracking
 */
export function addLiveSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();

  if (symbols.size >= config.maxSymbols) {
    return false;
  }

  if (symbols.has(upper)) {
    return false;
  }

  symbols.add(upper);
  return true;
}

/**
 * Remove symbol from live tracking
 */
export function removeLiveSymbol(symbol: string): boolean {
  return symbols.delete(symbol.toUpperCase());
}

/**
 * Subscribe to live updates
 */
export function onLiveUpdate(callback: LiveUpdateCallback): () => void {
  callbacks.add(callback);
  return () => {
    callbacks.delete(callback);
  };
}

/**
 * Update configuration
 */
export function configureLiveMode(newConfig: Partial<LiveModeConfig>): void {
  const wasRunning = intervalId !== null;

  if (wasRunning && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  config = { ...config, ...newConfig };

  if (wasRunning && symbols.size > 0) {
    intervalId = setInterval(runUpdate, config.intervalMs);
  }
}

/**
 * Get current configuration
 */
export function getLiveModeConfig(): LiveModeConfig {
  return { ...config };
}

// ═══════════════════════════════════════════════════════════════════════════
// Internal
// ═══════════════════════════════════════════════════════════════════════════

async function runUpdate(): Promise<void> {
  if (symbols.size === 0) {
    return;
  }

  try {
    const quotes = await getQuotes(Array.from(symbols));
    lastUpdate = new Date();
    updateCount++;

    const state = getLiveModeState();

    // Notify all callbacks
    for (const callback of callbacks) {
      try {
        callback(quotes, state);
      } catch {
        // Ignore callback errors
      }
    }
  } catch {
    // Silently handle fetch errors to not crash the live mode
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start live mode for watchlist symbols
 */
export async function startWatchlistLiveMode(
  getWatchlistSymbols: () => string[],
  callback?: LiveUpdateCallback
): Promise<boolean> {
  const watchlistSymbols = getWatchlistSymbols();

  if (watchlistSymbols.length === 0) {
    return false;
  }

  if (callback) {
    onLiveUpdate(callback);
  }

  return startLiveMode(watchlistSymbols);
}

/**
 * Start live mode for portfolio symbols
 */
export async function startPortfolioLiveMode(
  getPortfolioSymbols: () => string[],
  callback?: LiveUpdateCallback
): Promise<boolean> {
  const portfolioSymbols = getPortfolioSymbols();

  if (portfolioSymbols.length === 0) {
    return false;
  }

  if (callback) {
    onLiveUpdate(callback);
  }

  return startLiveMode(portfolioSymbols);
}

/**
 * Toggle live mode
 */
export function toggleLiveMode(symbolList: string[]): boolean {
  if (intervalId) {
    stopLiveMode();
    return false;
  } else {
    startLiveMode(symbolList);
    return true;
  }
}

/**
 * Get a one-time quote update (bypasses cache)
 */
export async function refreshQuotes(symbolList: string[]): Promise<Quote[]> {
  return getQuotes(symbolList.map(s => s.toUpperCase()));
}
