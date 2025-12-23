/**
 * Alert Store Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database
const mockDb = {
  exec: vi.fn(),
  prepare: vi.fn(() => ({
    run: vi.fn(() => ({ lastInsertRowid: 1, changes: 1 })),
    get: vi.fn(),
    all: vi.fn(() => []),
  })),
};

vi.mock('../db/index.js', () => ({
  getDb: () => mockDb,
}));

import {
  createAlert,
  getAlerts,
  getPendingAlerts,
  dismissAlert,
  hasRecentAlert,
  subscribeToAlerts,
} from './store.js';

describe('Alert Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create an alert with required fields', () => {
      const alert = createAlert('price_drop', 'warning', 'AAPL Down', 'AAPL dropped 5%', {
        symbol: 'AAPL',
      });

      expect(alert).toBeDefined();
      expect(alert.type).toBe('price_drop');
      expect(alert.severity).toBe('warning');
      expect(alert.title).toBe('AAPL Down');
      expect(alert.message).toBe('AAPL dropped 5%');
      expect(alert.symbol).toBe('AAPL');
      expect(alert.status).toBe('pending');
    });

    it('should create an alert with data payload', () => {
      const alert = createAlert('price_spike', 'info', 'Test', 'Message', {
        data: { priceChange: 10.5, previousPrice: 100 },
      });

      expect(alert.data).toEqual({ priceChange: 10.5, previousPrice: 100 });
    });

    it('should create an alert with expiry date', () => {
      const expires = new Date('2025-12-31');
      const alert = createAlert('earnings_soon', 'info', 'Test', 'Message', {
        expiresAt: expires,
      });

      expect(alert.expiresAt).toEqual(expires);
    });
  });

  describe('subscribeToAlerts', () => {
    it('should notify subscribers when alert is created', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToAlerts(callback);

      createAlert('price_drop', 'warning', 'Test', 'Message');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'created',
          alert: expect.objectContaining({ title: 'Test' }),
        })
      );

      unsubscribe();
    });

    it('should not notify after unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToAlerts(callback);

      unsubscribe();

      createAlert('price_drop', 'warning', 'Test', 'Message');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle subscriber errors gracefully', () => {
      const badCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const goodCallback = vi.fn();

      const unsub1 = subscribeToAlerts(badCallback);
      const unsub2 = subscribeToAlerts(goodCallback);

      // Should not throw
      expect(() => createAlert('price_drop', 'warning', 'Test', 'Message')).not.toThrow();

      // Good callback should still be called
      expect(goodCallback).toHaveBeenCalled();

      unsub1();
      unsub2();
    });
  });

  describe('Alert types and severity', () => {
    const alertTypes = [
      'price_drop',
      'price_spike',
      'earnings_soon',
      'news_sentiment',
      'portfolio_anomaly',
      'watchlist_event',
    ] as const;

    const severities = ['critical', 'warning', 'info'] as const;

    it('should accept all valid alert types', () => {
      for (const type of alertTypes) {
        expect(() =>
          createAlert(type, 'info', 'Test', 'Message')
        ).not.toThrow();
      }
    });

    it('should accept all valid severities', () => {
      for (const severity of severities) {
        expect(() =>
          createAlert('price_drop', severity, 'Test', 'Message')
        ).not.toThrow();
      }
    });
  });

  describe('Security', () => {
    it('should handle SQL injection in symbol', () => {
      const maliciousSymbol = "'; DROP TABLE alerts; --";

      // Should not throw - parameterized queries protect us
      expect(() =>
        createAlert('price_drop', 'warning', 'Test', 'Message', {
          symbol: maliciousSymbol,
        })
      ).not.toThrow();
    });

    it('should handle XSS in title and message', () => {
      const xssPayload = '<script>alert("xss")</script>';

      const alert = createAlert('price_drop', 'warning', xssPayload, xssPayload);

      // Alert should be created but content should be stored as-is
      // (sanitization happens at display layer)
      expect(alert.title).toBe(xssPayload);
      expect(alert.message).toBe(xssPayload);
    });

    it('should handle extremely long strings', () => {
      const longString = 'A'.repeat(10000);

      // Should not throw
      expect(() =>
        createAlert('price_drop', 'warning', longString, longString)
      ).not.toThrow();
    });
  });
});
