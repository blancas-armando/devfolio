/**
 * StatsView Component
 *
 * Debug screen showing API usage, cache performance,
 * and session metrics for monitoring rate limits.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette } from '../../design/tokens.js';
import { getStatsSummary } from '../../services/stats.js';
import { getRateLimitStatus, RATE_LIMITS, getRefreshMultiplier } from '../../services/ratelimit.js';
import { progress } from '../../design/symbols.js';

export function StatsView(): React.ReactElement {
  const stats = getStatsSummary();
  const rateStatus = getRateLimitStatus();
  const refreshMultiplier = getRefreshMultiplier();

  // Rate limit bar
  const barWidth = 30;
  const filledWidth = Math.round((rateStatus.percentUsed / 100) * barWidth);
  const rateBar = progress.full.repeat(filledWidth) + progress.empty.repeat(barWidth - filledWidth);

  // Color based on status
  let rateColor: string;
  let statusLabel: string;
  switch (rateStatus.status) {
    case 'ok':
      rateColor = palette.positive;
      statusLabel = 'OK';
      break;
    case 'warning':
      rateColor = palette.warning;
      statusLabel = 'SLOWING';
      break;
    case 'critical':
      rateColor = palette.negative;
      statusLabel = 'THROTTLED';
      break;
    case 'blocked':
      rateColor = palette.negative;
      statusLabel = 'BLOCKED';
      break;
  }

  return (
    <Panel width={78} title="System Stats">
      {/* Session Info */}
      <PanelRow>
        <InkBox width={74} justifyContent="space-between">
          <Text color={palette.textSecondary}>Session Duration</Text>
          <Text color={palette.text}>{stats.sessionDuration}</Text>
        </InkBox>
      </PanelRow>

      {/* Rate Limit Section */}
      <Section title="API Rate Limit">
        <PanelRow>
          <InkBox>
            <Text color={palette.textTertiary}>Last minute: </Text>
            <Text color={rateColor}>{rateStatus.callsPerMinute}</Text>
            <Text color={palette.textTertiary}>/{rateStatus.limit} calls</Text>
            <Text color={palette.textTertiary}>  Status: </Text>
            <Text color={rateColor}>{statusLabel}</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox>
            <Text color={palette.border}>[</Text>
            <Text color={rateColor}>{rateBar}</Text>
            <Text color={palette.border}>]</Text>
            <Text color={palette.textSecondary}> {rateStatus.percentUsed}%</Text>
          </InkBox>
        </PanelRow>
        {refreshMultiplier > 1 && (
          <PanelRow>
            <Text color={palette.warning}>Live mode refresh slowed {refreshMultiplier}x to protect rate limit</Text>
          </PanelRow>
        )}
        {stats.rateLimitWarnings > 0 && (
          <PanelRow>
            <Text color={palette.warning}>Rate limit warnings this session: {stats.rateLimitWarnings}</Text>
          </PanelRow>
        )}
      </Section>

      {/* API Calls Section */}
      <Section title="API Usage">
        <PanelRow>
          <InkBox width={74} justifyContent="space-between">
            <Text color={palette.textSecondary}>Total API Calls</Text>
            <Text color={palette.text}>{stats.totalCalls}</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={74} justifyContent="space-between">
            <Text color={palette.textSecondary}>Cache Hit Rate</Text>
            <Text color={palette.positive}>{stats.cacheHitRate}</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={74} justifyContent="space-between">
            <Text color={palette.textSecondary}>Avg Calls/Minute</Text>
            <Text color={stats.callsPerMinute > 50 ? palette.warning : palette.text}>
              {stats.callsPerMinute}
            </Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Top Endpoints */}
      {stats.topEndpoints.length > 0 && (
        <Section title="Top Endpoints">
          {stats.topEndpoints.map((ep, i) => (
            <PanelRow key={i}>
              <InkBox width={74} justifyContent="space-between">
                <Text color={palette.textSecondary}>{ep.endpoint}</Text>
                <Text color={palette.textTertiary}>{ep.count} calls</Text>
              </InkBox>
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Errors */}
      {stats.recentErrors.length > 0 && (
        <Section title="Recent Errors">
          {stats.recentErrors.map((err, i) => (
            <PanelRow key={i}>
              <InkBox width={74} justifyContent="space-between">
                <Text color={palette.negative}>{err.message}</Text>
                <Text color={palette.textTertiary}>{err.ago}</Text>
              </InkBox>
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Rate Limit Protection Info */}
      <Section title="Rate Limit Protection">
        <PanelRow>
          <InkBox width={74} justifyContent="space-between">
            <Text color={palette.textSecondary}>Warning threshold</Text>
            <Text color={palette.textTertiary}>{RATE_LIMITS.warningThreshold}% (start slowing)</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={74} justifyContent="space-between">
            <Text color={palette.textSecondary}>Critical threshold</Text>
            <Text color={palette.textTertiary}>{RATE_LIMITS.criticalThreshold}% (heavy throttle)</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={74} justifyContent="space-between">
            <Text color={palette.textSecondary}>Hard limit</Text>
            <Text color={palette.textTertiary}>{RATE_LIMITS.hardLimit}% (block non-essential)</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Tips */}
      <Section title="Tips">
        <PanelRow>
          <Text color={palette.textTertiary}>
            Live mode auto-adjusts refresh rate to stay under limits.
          </Text>
        </PanelRow>
        <PanelRow>
          <Text color={palette.textTertiary}>
            Batch requests and caching reduce API calls automatically.
          </Text>
        </PanelRow>
      </Section>

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textMuted}>
          This is a debug screen. Data resets on restart.
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default StatsView;
