/**
 * Alert Triggers
 * Detects conditions that should trigger alerts
 */

import { getWatchlist } from '../db/watchlist.js';
import { getHoldings } from '../db/portfolio.js';
import { getQuotes, getEventsCalendar } from '../services/market.js';
import { createAlert, hasRecentAlert, getAlertConfig, getTodayAlertCount } from './store.js';
import type { AlertType, AlertConfig } from './types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Trigger Context
// ═══════════════════════════════════════════════════════════════════════════

interface TriggerContext {
  config: AlertConfig;
  watchlist: string[];
  holdings: Array<{ symbol: string; shares: number; costBasis: number }>;
  todayCount: number;
}

async function buildTriggerContext(): Promise<TriggerContext> {
  const config = getAlertConfig();
  const watchlist = getWatchlist();
  const holdings = getHoldings();
  const todayCount = getTodayAlertCount();

  return { config, watchlist, holdings, todayCount };
}

function canCreateAlert(ctx: TriggerContext, type: AlertType, symbol?: string): boolean {
  // Check if alerts are enabled
  if (!ctx.config.enabled) return false;

  // Check daily limit
  if (ctx.todayCount >= ctx.config.maxAlertsPerDay) return false;

  // Check if this alert type is enabled
  const condition = ctx.config.conditions.find(c => c.type === type);
  if (!condition?.enabled) return false;

  // Check for recent duplicate
  if (hasRecentAlert(type, symbol, 24)) return false;

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Price Movement Triggers
// ═══════════════════════════════════════════════════════════════════════════

export async function checkPriceDrops(): Promise<number> {
  const ctx = await buildTriggerContext();
  let alertCount = 0;

  if (!canCreateAlert(ctx, 'price_drop')) return 0;

  // Get all symbols to monitor
  const symbols = [...new Set([
    ...ctx.watchlist,
    ...ctx.holdings.map(h => h.symbol),
  ])];

  if (symbols.length === 0) return 0;

  const quotes = await getQuotes(symbols);

  for (const quote of quotes) {
    if (quote.changePercent <= -ctx.config.priceDropThreshold) {
      if (canCreateAlert(ctx, 'price_drop', quote.symbol)) {
        const isHolding = ctx.holdings.some(h => h.symbol === quote.symbol);
        const severity = quote.changePercent <= -10 ? 'critical' :
                        quote.changePercent <= -7 ? 'warning' : 'info';

        createAlert(
          'price_drop',
          severity,
          `${quote.symbol} down ${Math.abs(quote.changePercent).toFixed(1)}%`,
          `${quote.symbol} dropped ${Math.abs(quote.changePercent).toFixed(2)}% to $${quote.price.toFixed(2)}`,
          {
            symbol: quote.symbol,
            data: {
              price: quote.price,
              changePercent: quote.changePercent,
              isHolding,
            },
          }
        );
        alertCount++;
        ctx.todayCount++;
      }
    }
  }

  return alertCount;
}

export async function checkPriceSpikes(): Promise<number> {
  const ctx = await buildTriggerContext();
  let alertCount = 0;

  if (!canCreateAlert(ctx, 'price_spike')) return 0;

  const symbols = [...new Set([
    ...ctx.watchlist,
    ...ctx.holdings.map(h => h.symbol),
  ])];

  if (symbols.length === 0) return 0;

  const quotes = await getQuotes(symbols);

  for (const quote of quotes) {
    if (quote.changePercent >= ctx.config.priceSpikeThreshold) {
      if (canCreateAlert(ctx, 'price_spike', quote.symbol)) {
        const isHolding = ctx.holdings.some(h => h.symbol === quote.symbol);

        createAlert(
          'price_spike',
          'info',
          `${quote.symbol} up ${quote.changePercent.toFixed(1)}%`,
          `${quote.symbol} surged ${quote.changePercent.toFixed(2)}% to $${quote.price.toFixed(2)}`,
          {
            symbol: quote.symbol,
            data: {
              price: quote.price,
              changePercent: quote.changePercent,
              isHolding,
            },
          }
        );
        alertCount++;
        ctx.todayCount++;
      }
    }
  }

  return alertCount;
}

// ═══════════════════════════════════════════════════════════════════════════
// Earnings Triggers
// ═══════════════════════════════════════════════════════════════════════════

export async function checkUpcomingEarnings(): Promise<number> {
  const ctx = await buildTriggerContext();
  let alertCount = 0;

  if (!canCreateAlert(ctx, 'earnings_soon')) return 0;

  const symbols = [...new Set([
    ...ctx.watchlist,
    ...ctx.holdings.map(h => h.symbol),
  ])];

  if (symbols.length === 0) return 0;

  const calendar = await getEventsCalendar(symbols);
  const now = new Date();
  const lookAheadMs = ctx.config.earningsLookAheadDays * 24 * 60 * 60 * 1000;

  for (const event of calendar.earnings) {
    const eventDate = new Date(event.date);
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (daysUntil > 0 && daysUntil <= ctx.config.earningsLookAheadDays) {
      if (canCreateAlert(ctx, 'earnings_soon', event.symbol)) {
        const isHolding = ctx.holdings.some(h => h.symbol === event.symbol);

        createAlert(
          'earnings_soon',
          daysUntil <= 1 ? 'warning' : 'info',
          `${event.symbol} earnings ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`,
          `${event.symbol} reports earnings on ${eventDate.toLocaleDateString()}`,
          {
            symbol: event.symbol,
            data: {
              date: event.date,
              daysUntil,
              isHolding,
            },
            expiresAt: eventDate,
          }
        );
        alertCount++;
        ctx.todayCount++;
      }
    }
  }

  return alertCount;
}

// ═══════════════════════════════════════════════════════════════════════════
// Watchlist Event Triggers
// ═══════════════════════════════════════════════════════════════════════════

export async function checkWatchlistEvents(): Promise<number> {
  const ctx = await buildTriggerContext();
  let alertCount = 0;

  if (!canCreateAlert(ctx, 'watchlist_event')) return 0;

  if (ctx.watchlist.length === 0) return 0;

  const quotes = await getQuotes(ctx.watchlist);

  for (const quote of quotes) {
    const absChange = Math.abs(quote.changePercent);

    // Major move on watchlist item
    if (absChange >= ctx.config.priceDropThreshold) {
      if (canCreateAlert(ctx, 'watchlist_event', quote.symbol)) {
        const direction = quote.changePercent >= 0 ? 'up' : 'down';
        const severity = absChange >= 10 ? 'warning' : 'info';

        createAlert(
          'watchlist_event',
          severity,
          `${quote.symbol} ${direction} ${absChange.toFixed(1)}%`,
          `Watchlist stock ${quote.symbol} moved ${direction} ${absChange.toFixed(2)}% to $${quote.price.toFixed(2)}`,
          {
            symbol: quote.symbol,
            data: {
              price: quote.price,
              changePercent: quote.changePercent,
              direction,
            },
          }
        );
        alertCount++;
        ctx.todayCount++;
      }
    }
  }

  return alertCount;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Trigger Check
// ═══════════════════════════════════════════════════════════════════════════

export interface TriggerCheckResult {
  checked: boolean;
  alertsCreated: number;
  errors: string[];
}

export async function runAllTriggers(): Promise<TriggerCheckResult> {
  const result: TriggerCheckResult = {
    checked: true,
    alertsCreated: 0,
    errors: [],
  };

  const config = getAlertConfig();

  if (!config.enabled) {
    result.checked = false;
    return result;
  }

  // Run each trigger and collect results
  const triggers: Array<() => Promise<number>> = [
    checkPriceDrops,
    checkPriceSpikes,
    checkUpcomingEarnings,
    checkWatchlistEvents,
  ];

  for (const trigger of triggers) {
    try {
      const count = await trigger();
      result.alertsCreated += count;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return result;
}
