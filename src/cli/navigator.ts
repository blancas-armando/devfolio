/**
 * Navigate Mode
 * Vim-style scrolling for viewing long content
 */

import chalk from 'chalk';
import { enableRawMode, disableRawMode, KEYS } from './keyboard.js';
import { stripAnsi, getTerminalWidth } from './ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface NavigatorState {
  content: string[];
  scrollOffset: number;
  visibleRows: number;
  searchQuery: string;
  searchMatches: number[];
  currentMatch: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Navigator State
// ═══════════════════════════════════════════════════════════════════════════

let state: NavigatorState | null = null;
let isNavigating = false;
let gPressed = false;  // Track 'g' for 'gg' command
let gTimeout: NodeJS.Timeout | null = null;

// ═══════════════════════════════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════════════════════════════

function getVisibleRows(): number {
  return (process.stdout.rows || 24) - 3; // Reserve space for status bar
}

function render(): void {
  if (!state) return;

  // Clear screen and move cursor to top
  process.stdout.write('\x1b[2J\x1b[H');

  const visibleRows = getVisibleRows();
  const start = state.scrollOffset;
  const end = Math.min(start + visibleRows, state.content.length);

  // Render visible content
  for (let i = start; i < end; i++) {
    const line = state.content[i];
    const isMatch = state.searchMatches.includes(i);
    const isCurrentMatch = state.searchMatches[state.currentMatch] === i;

    if (isCurrentMatch) {
      console.log(chalk.bgYellow.black(line));
    } else if (isMatch) {
      console.log(chalk.bgGray(line));
    } else {
      console.log(line);
    }
  }

  // Pad remaining space
  for (let i = end - start; i < visibleRows; i++) {
    console.log('');
  }

  // Render status bar
  renderStatusBar();
}

function renderStatusBar(): void {
  if (!state) return;

  const width = getTerminalWidth();
  const total = state.content.length;
  const current = state.scrollOffset + 1;
  const endLine = Math.min(state.scrollOffset + getVisibleRows(), total);

  // Progress percentage
  const percent = total > 0 ? Math.round((endLine / total) * 100) : 100;

  // Build status parts
  const position = `${current}-${endLine}/${total}`;
  const percentStr = `${percent}%`;
  const searchInfo = state.searchQuery
    ? ` /${state.searchQuery} (${state.currentMatch + 1}/${state.searchMatches.length})`
    : '';

  const help = 'j/k:scroll  gg/G:top/end  q:exit  /:search';

  // Compose status bar
  const leftPart = `${position} ${percentStr}${searchInfo}`;
  const rightPart = help;
  const padding = Math.max(0, width - leftPart.length - rightPart.length - 2);

  const statusBar = chalk.inverse(
    ` ${leftPart}${' '.repeat(padding)}${rightPart} `
  );

  process.stdout.write(statusBar);
}

// ═══════════════════════════════════════════════════════════════════════════
// Navigation Actions
// ═══════════════════════════════════════════════════════════════════════════

function scrollUp(lines: number = 1): void {
  if (!state) return;
  state.scrollOffset = Math.max(0, state.scrollOffset - lines);
  render();
}

function scrollDown(lines: number = 1): void {
  if (!state) return;
  const maxOffset = Math.max(0, state.content.length - getVisibleRows());
  state.scrollOffset = Math.min(maxOffset, state.scrollOffset + lines);
  render();
}

function scrollToTop(): void {
  if (!state) return;
  state.scrollOffset = 0;
  render();
}

function scrollToBottom(): void {
  if (!state) return;
  state.scrollOffset = Math.max(0, state.content.length - getVisibleRows());
  render();
}

function pageUp(): void {
  scrollUp(getVisibleRows() - 2);
}

function pageDown(): void {
  scrollDown(getVisibleRows() - 2);
}

// ═══════════════════════════════════════════════════════════════════════════
// Search
// ═══════════════════════════════════════════════════════════════════════════

function search(query: string): void {
  if (!state || !query) return;

  state.searchQuery = query;
  state.searchMatches = [];
  state.currentMatch = 0;

  const lowerQuery = query.toLowerCase();

  for (let i = 0; i < state.content.length; i++) {
    const line = stripAnsi(state.content[i]).toLowerCase();
    if (line.includes(lowerQuery)) {
      state.searchMatches.push(i);
    }
  }

  // Jump to first match
  if (state.searchMatches.length > 0) {
    state.scrollOffset = Math.max(0, state.searchMatches[0] - 2);
  }

  render();
}

function nextMatch(): void {
  if (!state || state.searchMatches.length === 0) return;

  state.currentMatch = (state.currentMatch + 1) % state.searchMatches.length;
  const matchLine = state.searchMatches[state.currentMatch];
  state.scrollOffset = Math.max(0, matchLine - 2);
  render();
}

function prevMatch(): void {
  if (!state || state.searchMatches.length === 0) return;

  state.currentMatch = state.currentMatch === 0
    ? state.searchMatches.length - 1
    : state.currentMatch - 1;
  const matchLine = state.searchMatches[state.currentMatch];
  state.scrollOffset = Math.max(0, matchLine - 2);
  render();
}

// ═══════════════════════════════════════════════════════════════════════════
// Key Handler
// ═══════════════════════════════════════════════════════════════════════════

function handleKey(key: string, _ctrl: boolean): void {
  const lowerKey = key.toLowerCase();

  // Handle 'gg' for go to top
  if (lowerKey === 'g') {
    if (gPressed) {
      // Second 'g' - go to top
      if (gTimeout) clearTimeout(gTimeout);
      gPressed = false;
      scrollToTop();
      return;
    } else {
      // First 'g' - wait for second
      gPressed = true;
      gTimeout = setTimeout(() => {
        gPressed = false;
        // Single 'G' goes to bottom
        scrollToBottom();
      }, 300);
      return;
    }
  }

  // Reset g tracking for other keys
  if (gPressed && gTimeout) {
    clearTimeout(gTimeout);
    gPressed = false;
  }

  // Navigation keys
  if (key === KEYS.UP || lowerKey === 'k') {
    scrollUp();
    return;
  }

  if (key === KEYS.DOWN || lowerKey === 'j') {
    scrollDown();
    return;
  }

  if (key === KEYS.PAGE_UP) {
    pageUp();
    return;
  }

  if (key === KEYS.PAGE_DOWN || key === ' ') {
    pageDown();
    return;
  }

  if (key === KEYS.HOME) {
    scrollToTop();
    return;
  }

  if (key === KEYS.END) {
    scrollToBottom();
    return;
  }

  // Search
  if (lowerKey === 'n' && state?.searchQuery) {
    nextMatch();
    return;
  }

  if (lowerKey === 'p' && state?.searchQuery) {
    prevMatch();
    return;
  }

  // Exit
  if (key === KEYS.ESCAPE || lowerKey === 'q') {
    exitNavigateMode();
    return;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enter navigate mode with content
 */
export function enterNavigateMode(content: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (content.length === 0) {
      resolve();
      return;
    }

    // Check if content fits on screen
    const visibleRows = getVisibleRows();
    if (content.length <= visibleRows) {
      // No need for navigation, just show content
      for (const line of content) {
        console.log(line);
      }
      console.log('');
      console.log(chalk.dim('  (Content fits on screen - no scrolling needed)'));
      resolve();
      return;
    }

    state = {
      content,
      scrollOffset: 0,
      visibleRows,
      searchQuery: '',
      searchMatches: [],
      currentMatch: 0,
    };

    isNavigating = true;

    // Store resolve function to call on exit
    (global as unknown as { navigateResolve: () => void }).navigateResolve = resolve;

    enableRawMode(handleKey);
    render();
  });
}

/**
 * Exit navigate mode
 */
export function exitNavigateMode(): void {
  if (!isNavigating) return;

  isNavigating = false;
  state = null;
  gPressed = false;

  if (gTimeout) {
    clearTimeout(gTimeout);
    gTimeout = null;
  }

  disableRawMode();

  // Clear screen
  process.stdout.write('\x1b[2J\x1b[H');

  // Call resolve if stored
  const resolve = (global as unknown as { navigateResolve?: () => void }).navigateResolve;
  if (resolve) {
    delete (global as unknown as { navigateResolve?: () => void }).navigateResolve;
    resolve();
  }
}

/**
 * Check if currently in navigate mode
 */
export function isInNavigateMode(): boolean {
  return isNavigating;
}

/**
 * Capture content to lines for navigation
 */
export function captureOutput(fn: () => void): string[] {
  const lines: string[] = [];
  const originalLog = console.log;

  console.log = (...args: unknown[]) => {
    const line = args.map(arg =>
      typeof arg === 'string' ? arg : String(arg)
    ).join(' ');
    lines.push(line);
  };

  try {
    fn();
  } finally {
    console.log = originalLog;
  }

  return lines;
}
