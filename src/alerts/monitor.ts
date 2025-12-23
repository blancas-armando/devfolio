/**
 * Alert Monitor
 * Background monitoring service for proactive alerts
 */

import { runAllTriggers, type TriggerCheckResult } from './triggers.js';
import { getAlertConfig, deleteOldAlerts, getPendingAlerts, subscribeToAlerts } from './store.js';
import type { Alert, AlertCallback } from './types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Monitor State
// ═══════════════════════════════════════════════════════════════════════════

interface MonitorState {
  running: boolean;
  intervalId: NodeJS.Timeout | null;
  lastCheck: Date | null;
  lastResult: TriggerCheckResult | null;
}

const state: MonitorState = {
  running: false,
  intervalId: null,
  lastCheck: null,
  lastResult: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// Monitor Control
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start the background alert monitor
 */
export function startMonitor(): boolean {
  if (state.running) {
    return false;
  }

  const config = getAlertConfig();

  if (!config.enabled) {
    return false;
  }

  state.running = true;

  // Run initial check
  runCheck();

  // Set up interval
  state.intervalId = setInterval(runCheck, config.checkIntervalMs);

  return true;
}

/**
 * Stop the background alert monitor
 */
export function stopMonitor(): boolean {
  if (!state.running) {
    return false;
  }

  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.running = false;
  return true;
}

/**
 * Check if the monitor is running
 */
export function isMonitorRunning(): boolean {
  return state.running;
}

/**
 * Get monitor status
 */
export function getMonitorStatus(): {
  running: boolean;
  lastCheck: Date | null;
  lastResult: TriggerCheckResult | null;
} {
  return {
    running: state.running,
    lastCheck: state.lastCheck,
    lastResult: state.lastResult,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Check Execution
// ═══════════════════════════════════════════════════════════════════════════

async function runCheck(): Promise<void> {
  try {
    state.lastResult = await runAllTriggers();
    state.lastCheck = new Date();

    // Cleanup old alerts periodically
    if (Math.random() < 0.1) {
      deleteOldAlerts(30);
    }
  } catch {
    // Silently handle errors to not crash background process
    state.lastResult = {
      checked: false,
      alertsCreated: 0,
      errors: ['Monitor check failed'],
    };
  }
}

/**
 * Manually trigger a check
 */
export async function manualCheck(): Promise<TriggerCheckResult> {
  const result = await runAllTriggers();
  state.lastCheck = new Date();
  state.lastResult = result;
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Subscriptions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to new alerts
 */
export function onAlert(callback: AlertCallback): () => void {
  return subscribeToAlerts(callback);
}

/**
 * Get pending alerts summary
 */
export function getAlertSummary(): {
  pending: number;
  critical: number;
  warning: number;
  info: number;
  alerts: Alert[];
} {
  const alerts = getPendingAlerts();

  return {
    pending: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    alerts: alerts.slice(0, 10),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Export Alert Store Functions
// ═══════════════════════════════════════════════════════════════════════════

export {
  getPendingAlerts,
  getAlerts,
  dismissAlert,
  markAlertRead,
  dismissAllAlerts,
  getAlertConfig,
  updateAlertConfig,
} from './store.js';
