/**
 * Alert Store
 * Persists and retrieves alerts from database
 */

import { getDb } from '../db/index.js';
import type { Alert, AlertType, AlertSeverity, AlertStatus, AlertConfig, AlertCallback, AlertEvent } from './types.js';
import { DEFAULT_ALERT_CONFIG } from './types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Schema Initialization
// ═══════════════════════════════════════════════════════════════════════════

export function initializeAlertSchema(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      symbol TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

    CREATE TABLE IF NOT EXISTS alert_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Subscribers
// ═══════════════════════════════════════════════════════════════════════════

const subscribers: AlertCallback[] = [];

export function subscribeToAlerts(callback: AlertCallback): () => void {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index >= 0) {
      subscribers.splice(index, 1);
    }
  };
}

function notifySubscribers(event: AlertEvent): void {
  for (const callback of subscribers) {
    try {
      callback(event);
    } catch {
      // Ignore subscriber errors
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert CRUD
// ═══════════════════════════════════════════════════════════════════════════

export function createAlert(
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  options: {
    symbol?: string;
    data?: Record<string, unknown>;
    expiresAt?: Date;
  } = {}
): Alert {
  initializeAlertSchema();
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO alerts (type, severity, status, symbol, title, message, data, expires_at)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(
    type,
    severity,
    options.symbol ?? null,
    title,
    message,
    options.data ? JSON.stringify(options.data) : null,
    options.expiresAt?.toISOString() ?? null
  );

  const alert: Alert = {
    id: result.lastInsertRowid as number,
    type,
    severity,
    status: 'pending',
    symbol: options.symbol ?? null,
    title,
    message,
    data: options.data ?? {},
    createdAt: new Date(),
    expiresAt: options.expiresAt ?? null,
  };

  notifySubscribers({ type: 'created', alert });

  return alert;
}

export function getAlerts(options: {
  status?: AlertStatus;
  type?: AlertType;
  symbol?: string;
  limit?: number;
} = {}): Alert[] {
  initializeAlertSchema();
  const db = getDb();

  let sql = 'SELECT * FROM alerts WHERE 1=1';
  const params: unknown[] = [];

  if (options.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }

  if (options.type) {
    sql += ' AND type = ?';
    params.push(options.type);
  }

  if (options.symbol) {
    sql += ' AND symbol = ?';
    params.push(options.symbol);
  }

  sql += ' ORDER BY created_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = db.prepare(sql).all(...params) as Array<{
    id: number;
    type: string;
    severity: string;
    status: string;
    symbol: string | null;
    title: string;
    message: string;
    data: string | null;
    created_at: string;
    expires_at: string | null;
  }>;

  return rows.map(row => ({
    id: row.id,
    type: row.type as AlertType,
    severity: row.severity as AlertSeverity,
    status: row.status as AlertStatus,
    symbol: row.symbol,
    title: row.title,
    message: row.message,
    data: row.data ? JSON.parse(row.data) : {},
    createdAt: new Date(row.created_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  }));
}

export function getPendingAlerts(): Alert[] {
  return getAlerts({ status: 'pending' });
}

export function getAlertCount(status?: AlertStatus): number {
  initializeAlertSchema();
  const db = getDb();

  if (status) {
    const row = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = ?').get(status) as { count: number };
    return row.count;
  }

  const row = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = ?').get('pending') as { count: number };
  return row.count;
}

export function updateAlertStatus(id: number, status: AlertStatus): boolean {
  initializeAlertSchema();
  const db = getDb();

  const result = db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run(status, id);

  if (result.changes > 0) {
    const alerts = getAlerts({ limit: 1 });
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      notifySubscribers({ type: 'updated', alert: { ...alert, status } });
    }
  }

  return result.changes > 0;
}

export function dismissAlert(id: number): boolean {
  return updateAlertStatus(id, 'dismissed');
}

export function markAlertRead(id: number): boolean {
  return updateAlertStatus(id, 'read');
}

export function dismissAllAlerts(): number {
  initializeAlertSchema();
  const db = getDb();
  const result = db.prepare("UPDATE alerts SET status = 'dismissed' WHERE status = 'pending'").run();
  return result.changes;
}

export function deleteOldAlerts(daysOld = 30): number {
  initializeAlertSchema();
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM alerts
    WHERE created_at < datetime('now', '-' || ? || ' days')
  `).run(daysOld);
  return result.changes;
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Config
// ═══════════════════════════════════════════════════════════════════════════

export function getAlertConfig(): AlertConfig {
  initializeAlertSchema();
  const db = getDb();

  const row = db.prepare("SELECT value FROM alert_config WHERE key = 'config'").get() as { value: string } | undefined;

  if (!row) {
    return DEFAULT_ALERT_CONFIG;
  }

  try {
    return { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_ALERT_CONFIG;
  }
}

export function updateAlertConfig(updates: Partial<AlertConfig>): AlertConfig {
  initializeAlertSchema();
  const db = getDb();

  const current = getAlertConfig();
  const updated = { ...current, ...updates };

  db.prepare(`
    INSERT INTO alert_config (key, value) VALUES ('config', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(updated));

  return updated;
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Deduplication
// ═══════════════════════════════════════════════════════════════════════════

export function hasRecentAlert(type: AlertType, symbol?: string, withinHours = 24): boolean {
  initializeAlertSchema();
  const db = getDb();

  let sql = `
    SELECT COUNT(*) as count FROM alerts
    WHERE type = ? AND created_at > datetime('now', '-' || ? || ' hours')
  `;
  const params: unknown[] = [type, withinHours];

  if (symbol) {
    sql += ' AND symbol = ?';
    params.push(symbol);
  }

  const row = db.prepare(sql).get(...params) as { count: number };
  return row.count > 0;
}

export function getTodayAlertCount(): number {
  initializeAlertSchema();
  const db = getDb();

  const row = db.prepare(`
    SELECT COUNT(*) as count FROM alerts
    WHERE created_at > datetime('now', 'start of day')
  `).get() as { count: number };

  return row.count;
}
