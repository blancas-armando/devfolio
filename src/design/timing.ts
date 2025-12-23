/**
 * Animation Timing Constants
 *
 * Centralized timing values for animations, transitions,
 * and interactive feedback throughout the application.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Animation Speeds
// ═══════════════════════════════════════════════════════════════════════════

export const timing = {
  // Cursor animations
  cursorBlink: 530,           // Text cursor blink rate (slightly slower than typical 500)
  cursorBlinkFast: 400,       // Fast blink for active input

  // Spinner animations
  spinnerFast: 60,            // Urgent loading states
  spinnerNormal: 80,          // Default spinner speed
  spinnerRelaxed: 120,        // Background operations

  // Skeleton/loading animations
  skeletonPulse: 400,         // Skeleton shimmer cycle
  skeletonFade: 300,          // Fade between states

  // Text animations
  typewriterFast: 20,         // Fast character reveal (ms per char)
  typewriterNormal: 40,       // Normal typing speed
  typewriterSlow: 80,         // Deliberate, readable speed

  // Stagger delays
  staggerFast: 30,            // Fast cascade effect
  staggerNormal: 50,          // Default stagger between items
  staggerSlow: 100,           // Slower, more noticeable cascade

  // Transitions
  transitionFast: 100,        // Quick state changes
  transitionNormal: 150,      // Default transitions
  transitionSlow: 250,        // Deliberate transitions

  // Input handling
  debounce: 150,              // Input debounce delay
  throttle: 100,              // Rate limiting
  holdDelay: 500,             // Long-press detection

  // Progress updates
  progressTick: 100,          // Progress bar update interval
  pollInterval: 1000,         // Background polling

  // Timeouts
  shortTimeout: 3000,         // Brief operations
  mediumTimeout: 10000,       // Standard operations
  longTimeout: 30000,         // Extended operations
} as const;

export type TimingKey = keyof typeof timing;

// ═══════════════════════════════════════════════════════════════════════════
// Easing Descriptions (for documentation - terminal can't use CSS easing)
// ═══════════════════════════════════════════════════════════════════════════

export const easing = {
  // These describe the conceptual feel, implemented via timing
  linear: 'constant rate',
  easeIn: 'starts slow, speeds up',
  easeOut: 'starts fast, slows down',
  easeInOut: 'slow start and end',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Animation Presets
// ═══════════════════════════════════════════════════════════════════════════

export const animationPresets = {
  /** Quick feedback animations */
  feedback: {
    cursor: timing.cursorBlink,
    spinner: timing.spinnerNormal,
  },

  /** Loading state animations */
  loading: {
    skeleton: timing.skeletonPulse,
    spinner: timing.spinnerNormal,
    progress: timing.progressTick,
  },

  /** Text reveal animations */
  text: {
    typewriter: timing.typewriterNormal,
    stagger: timing.staggerNormal,
  },

  /** Interactive elements */
  interactive: {
    debounce: timing.debounce,
    transition: timing.transitionNormal,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get timing value with optional multiplier
 */
export function getTiming(key: TimingKey, multiplier: number = 1): number {
  return Math.round(timing[key] * multiplier);
}

/**
 * Calculate stagger delay for nth item
 */
export function getStaggerDelay(index: number, baseDelay: number = timing.staggerNormal): number {
  return index * baseDelay;
}

/**
 * Calculate total duration for staggered animation
 */
export function getStaggerDuration(itemCount: number, baseDelay: number = timing.staggerNormal): number {
  return (itemCount - 1) * baseDelay;
}
