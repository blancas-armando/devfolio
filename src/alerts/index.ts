/**
 * Alert System
 * Proactive AI-powered monitoring with intelligent alerts
 */

// Types
export type {
  AlertType,
  AlertSeverity,
  AlertStatus,
  Alert,
  AlertCondition,
  AlertConfig,
  AlertEvent,
  AlertCallback,
} from './types.js';

export { DEFAULT_ALERT_CONFIG } from './types.js';

// Store operations
export {
  createAlert,
  getAlerts,
  getPendingAlerts,
  getAlertCount,
  dismissAlert,
  markAlertRead,
  dismissAllAlerts,
  getAlertConfig,
  updateAlertConfig,
} from './store.js';

// Triggers
export {
  checkPriceDrops,
  checkPriceSpikes,
  checkUpcomingEarnings,
  checkWatchlistEvents,
  runAllTriggers,
  type TriggerCheckResult,
} from './triggers.js';

// Monitor
export {
  startMonitor,
  stopMonitor,
  isMonitorRunning,
  getMonitorStatus,
  manualCheck,
  onAlert,
  getAlertSummary,
} from './monitor.js';
