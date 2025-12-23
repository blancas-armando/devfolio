/**
 * Webhook Service
 *
 * Manages webhook configurations and sends alert notifications
 * to external endpoints.
 */

import { getDb } from '../db/index.js';
import type { Alert, WebhookConfig, WebhookPayload, AlertType } from './types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Webhook Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add a new webhook
 */
export function addWebhook(url: string, name?: string): WebhookConfig {
  const db = getDb();

  const result = db.prepare(
    'INSERT INTO webhooks (url, name) VALUES (?, ?)'
  ).run(url, name || null);

  return {
    id: result.lastInsertRowid as number,
    url,
    name,
    enabled: true,
    createdAt: new Date(),
    failCount: 0,
  };
}

/**
 * Remove a webhook by ID
 */
export function removeWebhook(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Get all webhooks
 */
export function getWebhooks(): WebhookConfig[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, url, name, enabled, alert_types, created_at, last_used_at, fail_count FROM webhooks ORDER BY created_at DESC'
  ).all() as Array<{
    id: number;
    url: string;
    name: string | null;
    enabled: number;
    alert_types: string | null;
    created_at: string;
    last_used_at: string | null;
    fail_count: number;
  }>;

  return rows.map(row => ({
    id: row.id,
    url: row.url,
    name: row.name || undefined,
    enabled: row.enabled === 1,
    alertTypes: row.alert_types ? JSON.parse(row.alert_types) : undefined,
    createdAt: new Date(row.created_at),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
    failCount: row.fail_count,
  }));
}

/**
 * Get a specific webhook by ID
 */
export function getWebhook(id: number): WebhookConfig | null {
  const webhooks = getWebhooks();
  return webhooks.find(w => w.id === id) || null;
}

/**
 * Toggle webhook enabled/disabled
 */
export function toggleWebhook(id: number, enabled: boolean): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE webhooks SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  return result.changes > 0;
}

/**
 * Update webhook failure count
 */
function updateWebhookStatus(id: number, success: boolean): void {
  const db = getDb();

  if (success) {
    db.prepare(
      'UPDATE webhooks SET last_used_at = CURRENT_TIMESTAMP, fail_count = 0 WHERE id = ?'
    ).run(id);
  } else {
    db.prepare(
      'UPDATE webhooks SET fail_count = fail_count + 1 WHERE id = ?'
    ).run(id);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Webhook Delivery
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build webhook payload from alert
 */
function buildPayload(alert: Alert): WebhookPayload {
  return {
    event: 'alert',
    timestamp: new Date().toISOString(),
    alert: {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      symbol: alert.symbol,
      title: alert.title,
      message: alert.message,
      data: alert.data,
      createdAt: alert.createdAt.toISOString(),
    },
  };
}

/**
 * Send webhook request
 */
async function sendWebhook(webhook: WebhookConfig, payload: WebhookPayload): Promise<boolean> {
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DevFolio-Alerts/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const success = response.ok;
    updateWebhookStatus(webhook.id, success);
    return success;
  } catch {
    updateWebhookStatus(webhook.id, false);
    return false;
  }
}

/**
 * Send alert to all configured webhooks
 */
export async function dispatchAlert(alert: Alert): Promise<{ sent: number; failed: number }> {
  const webhooks = getWebhooks().filter(w => w.enabled && w.failCount < 5);
  const payload = buildPayload(alert);

  let sent = 0;
  let failed = 0;

  for (const webhook of webhooks) {
    // Check if this webhook should receive this alert type
    if (webhook.alertTypes && webhook.alertTypes.length > 0) {
      if (!webhook.alertTypes.includes(alert.type)) {
        continue;
      }
    }

    const success = await sendWebhook(webhook, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send a test webhook
 */
export async function testWebhook(id: number): Promise<{ success: boolean; error?: string }> {
  const webhook = getWebhook(id);
  if (!webhook) {
    return { success: false, error: 'Webhook not found' };
  }

  const testPayload: WebhookPayload = {
    event: 'alert',
    timestamp: new Date().toISOString(),
    alert: {
      id: 0,
      type: 'watchlist_event',
      severity: 'info',
      symbol: 'TEST',
      title: 'Test Webhook',
      message: 'This is a test notification from DevFolio',
      data: { test: true },
      createdAt: new Date().toISOString(),
    },
  };

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DevFolio-Alerts/1.0',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      updateWebhookStatus(id, true);
      return { success: true };
    }

    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get webhook statistics
 */
export function getWebhookStats(): { total: number; enabled: number; failing: number } {
  const webhooks = getWebhooks();
  return {
    total: webhooks.length,
    enabled: webhooks.filter(w => w.enabled).length,
    failing: webhooks.filter(w => w.failCount >= 3).length,
  };
}
