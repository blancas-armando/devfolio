/**
 * AI Cost Tracking
 * Tracks token usage and estimated costs per session
 */

import type { ProviderName, FeatureType } from './providers/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface UsageEntry {
  timestamp: Date;
  provider: ProviderName;
  feature: FeatureType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
}

export interface UsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  byProvider: Record<string, ProviderUsage>;
  byFeature: Record<string, FeatureUsage>;
}

export interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  cost: number;
  requests: number;
}

export interface FeatureUsage {
  promptTokens: number;
  completionTokens: number;
  cost: number;
  requests: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════

let sessionEntries: UsageEntry[] = [];
let sessionStart: Date = new Date();

// ═══════════════════════════════════════════════════════════════════════════
// Tracking Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record a usage entry
 */
export function recordUsage(entry: Omit<UsageEntry, 'timestamp'>): void {
  sessionEntries.push({
    ...entry,
    timestamp: new Date(),
  });
}

/**
 * Get all entries from current session
 */
export function getSessionEntries(): UsageEntry[] {
  return [...sessionEntries];
}

/**
 * Get session summary
 */
export function getSessionSummary(): UsageSummary {
  const byProvider: Record<string, ProviderUsage> = {};
  const byFeature: Record<string, FeatureUsage> = {};

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCost = 0;

  for (const entry of sessionEntries) {
    totalPromptTokens += entry.promptTokens;
    totalCompletionTokens += entry.completionTokens;
    totalCost += entry.estimatedCost;

    // By provider
    if (!byProvider[entry.provider]) {
      byProvider[entry.provider] = { promptTokens: 0, completionTokens: 0, cost: 0, requests: 0 };
    }
    byProvider[entry.provider].promptTokens += entry.promptTokens;
    byProvider[entry.provider].completionTokens += entry.completionTokens;
    byProvider[entry.provider].cost += entry.estimatedCost;
    byProvider[entry.provider].requests += 1;

    // By feature
    if (!byFeature[entry.feature]) {
      byFeature[entry.feature] = { promptTokens: 0, completionTokens: 0, cost: 0, requests: 0 };
    }
    byFeature[entry.feature].promptTokens += entry.promptTokens;
    byFeature[entry.feature].completionTokens += entry.completionTokens;
    byFeature[entry.feature].cost += entry.estimatedCost;
    byFeature[entry.feature].requests += 1;
  }

  return {
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens: totalPromptTokens + totalCompletionTokens,
    totalCost,
    requestCount: sessionEntries.length,
    byProvider,
    byFeature,
  };
}

/**
 * Reset session tracking
 */
export function resetSession(): void {
  sessionEntries = [];
  sessionStart = new Date();
}

/**
 * Get session start time
 */
export function getSessionStart(): Date {
  return sessionStart;
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(): number {
  return Math.floor((Date.now() - sessionStart.getTime()) / 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// Formatting Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 100).toFixed(4)}c`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count with commas
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

/**
 * Format duration as HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Get a formatted summary string
 */
export function getFormattedSummary(): string {
  const summary = getSessionSummary();
  const duration = getSessionDuration();

  const lines: string[] = [
    `Session Duration: ${formatDuration(duration)}`,
    `Total Requests: ${summary.requestCount}`,
    `Total Tokens: ${formatTokens(summary.totalTokens)} (${formatTokens(summary.totalPromptTokens)} prompt + ${formatTokens(summary.totalCompletionTokens)} completion)`,
    `Estimated Cost: ${formatCost(summary.totalCost)}`,
    '',
  ];

  // By provider
  const providers = Object.entries(summary.byProvider);
  if (providers.length > 0) {
    lines.push('By Provider:');
    for (const [name, usage] of providers) {
      lines.push(`  ${name}: ${usage.requests} requests, ${formatTokens(usage.promptTokens + usage.completionTokens)} tokens, ${formatCost(usage.cost)}`);
    }
    lines.push('');
  }

  // By feature
  const features = Object.entries(summary.byFeature);
  if (features.length > 0) {
    lines.push('By Feature:');
    for (const [name, usage] of features) {
      lines.push(`  ${name}: ${usage.requests} requests, ${formatTokens(usage.promptTokens + usage.completionTokens)} tokens, ${formatCost(usage.cost)}`);
    }
  }

  return lines.join('\n');
}
