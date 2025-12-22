/**
 * Alert System Types
 * Defines alert structures and conditions
 */

// ═══════════════════════════════════════════════════════════════════════════
// Alert Types
// ═══════════════════════════════════════════════════════════════════════════

export type AlertType =
  | 'price_drop'        // Symbol dropped X%
  | 'price_spike'       // Symbol up X%
  | 'earnings_soon'     // Earnings in X days
  | 'news_sentiment'    // Negative news cluster
  | 'portfolio_anomaly' // Portfolio diverging from market
  | 'market_regime'     // Bull/bear shift detected
  | 'watchlist_event';  // Major move on watchlist symbol

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertStatus = 'pending' | 'read' | 'dismissed';

export interface Alert {
  id: number;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  symbol: string | null;
  title: string;
  message: string;
  data: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Conditions
// ═══════════════════════════════════════════════════════════════════════════

export interface AlertCondition {
  type: AlertType;
  enabled: boolean;
  threshold?: number;
  symbols?: string[];
}

export interface AlertConfig {
  enabled: boolean;
  conditions: AlertCondition[];

  // Thresholds
  priceDropThreshold: number;      // Alert at X% drop (default: 5)
  priceSpikeThreshold: number;     // Alert at X% rise (default: 8)
  earningsLookAheadDays: number;   // Alert X days before earnings (default: 3)
  sentimentThreshold: number;      // Alert at sentiment score below X (default: -50)

  // Frequency
  checkIntervalMs: number;         // Check every X ms (default: 300000 = 5 min)
  maxAlertsPerDay: number;         // Limit alerts (default: 20)
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: true,
  conditions: [
    { type: 'price_drop', enabled: true, threshold: 5 },
    { type: 'price_spike', enabled: true, threshold: 8 },
    { type: 'earnings_soon', enabled: true, threshold: 3 },
    { type: 'watchlist_event', enabled: true, threshold: 5 },
    { type: 'news_sentiment', enabled: false },
    { type: 'portfolio_anomaly', enabled: false },
    { type: 'market_regime', enabled: false },
  ],
  priceDropThreshold: 5,
  priceSpikeThreshold: 8,
  earningsLookAheadDays: 3,
  sentimentThreshold: -50,
  checkIntervalMs: 300000,
  maxAlertsPerDay: 20,
};

// ═══════════════════════════════════════════════════════════════════════════
// Alert Events
// ═══════════════════════════════════════════════════════════════════════════

export interface AlertEvent {
  type: 'created' | 'updated' | 'dismissed';
  alert: Alert;
}

export type AlertCallback = (event: AlertEvent) => void;

// ═══════════════════════════════════════════════════════════════════════════
// Webhook Configuration
// ═══════════════════════════════════════════════════════════════════════════

export interface WebhookConfig {
  id: number;
  url: string;
  enabled: boolean;
  name?: string;
  alertTypes?: AlertType[];  // If empty, send all alerts
  createdAt: Date;
  lastUsedAt?: Date;
  failCount: number;
}

export interface WebhookPayload {
  event: 'alert';
  timestamp: string;
  alert: {
    id: number;
    type: AlertType;
    severity: AlertSeverity;
    symbol: string | null;
    title: string;
    message: string;
    data: Record<string, unknown>;
    createdAt: string;
  };
}
