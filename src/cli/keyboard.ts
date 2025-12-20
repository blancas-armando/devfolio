/**
 * Raw Keyboard Input Handler
 * Handles raw key events for navigate mode
 */

import * as readline from 'readline';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type KeyHandler = (key: string, ctrl: boolean) => void;

export interface KeyboardState {
  active: boolean;
  handler: KeyHandler | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Key Mappings
// ═══════════════════════════════════════════════════════════════════════════

export const KEYS = {
  // Navigation
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  LEFT: '\u001b[C',
  RIGHT: '\u001b[D',
  PAGE_UP: '\u001b[5~',
  PAGE_DOWN: '\u001b[6~',
  HOME: '\u001b[H',
  END: '\u001b[F',

  // Actions
  ENTER: '\r',
  ESCAPE: '\u001b',
  BACKSPACE: '\u007f',
  TAB: '\t',
  SPACE: ' ',

  // Vim-style
  J: 'j',
  K: 'k',
  G: 'g',
  Q: 'q',
  SLASH: '/',
  N: 'n',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Raw Mode Handler
// ═══════════════════════════════════════════════════════════════════════════

let isRawMode = false;
let currentHandler: KeyHandler | null = null;

/**
 * Enable raw mode for capturing individual keypresses
 */
export function enableRawMode(handler: KeyHandler): void {
  if (isRawMode) return;

  currentHandler = handler;
  isRawMode = true;

  // Enable raw mode on stdin
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  // Listen for keypress events
  process.stdin.on('data', handleKeypress);
}

/**
 * Disable raw mode and restore normal input
 */
export function disableRawMode(): void {
  if (!isRawMode) return;

  isRawMode = false;
  currentHandler = null;

  // Restore normal mode
  process.stdin.removeListener('data', handleKeypress);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}

/**
 * Handle raw keypress data
 */
function handleKeypress(data: Buffer): void {
  if (!currentHandler) return;

  const key = data.toString();
  const ctrl = data[0] < 32 && key !== '\r' && key !== '\t' && key !== '\u001b';

  // Handle Ctrl+C to exit
  if (key === '\u0003') {
    disableRawMode();
    process.exit(0);
  }

  currentHandler(key, ctrl);
}

// ═══════════════════════════════════════════════════════════════════════════
// Key Detection Helpers
// ═══════════════════════════════════════════════════════════════════════════

export function isArrowUp(key: string): boolean {
  return key === KEYS.UP || key.toLowerCase() === 'k';
}

export function isArrowDown(key: string): boolean {
  return key === KEYS.DOWN || key.toLowerCase() === 'j';
}

export function isPageUp(key: string): boolean {
  return key === KEYS.PAGE_UP;
}

export function isPageDown(key: string): boolean {
  return key === KEYS.PAGE_DOWN;
}

export function isHome(key: string): boolean {
  return key === KEYS.HOME || key.toLowerCase() === 'gg';
}

export function isEnd(key: string): boolean {
  return key === KEYS.END || key.toLowerCase() === 'g';
}

export function isEscape(key: string): boolean {
  return key === KEYS.ESCAPE || key.toLowerCase() === 'q';
}

export function isSearch(key: string): boolean {
  return key === KEYS.SLASH;
}

export function isEnter(key: string): boolean {
  return key === KEYS.ENTER;
}
