/**
 * EarningsReport Component
 *
 * Comprehensive earnings analysis with quarterly results,
 * guidance, KPIs, and SEC filings.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { EarningsReport } from '../../services/earnings.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';

export interface EarningsReportProps {
  report: EarningsReport;
}

// Format large numbers
function formatLargeNumber(num: number | null): string {
  if (num === null) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

// Quarterly result row
function QuarterlyRow({ fiscalQuarter, revenue, eps, comment }: {
  fiscalQuarter: string;
  revenue: number | null;
  eps: number | null;
  comment: string | null;
}): React.ReactElement {
  const commentColor = comment === 'Beat' ? semantic.positive : comment === 'Miss' ? semantic.negative : semantic.warning;

  return (
    <PanelRow>
      <InkBox width={10}>
        <Text color={palette.text}>{fiscalQuarter}</Text>
      </InkBox>
      <InkBox width={14}>
        <Text color={palette.textTertiary}>{formatLargeNumber(revenue)}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={palette.text}>{eps !== null ? `$${eps.toFixed(2)}` : 'N/A'}</Text>
      </InkBox>
      <InkBox width={10}>
        {comment && <Text color={commentColor}>{comment}</Text>}
      </InkBox>
    </PanelRow>
  );
}

// KPI row component
function KPIRow({ name, actual, consensus, comment, unit }: {
  name: string;
  actual: number | string | null;
  consensus: number | string | null;
  comment: string | null;
  unit: string;
}): React.ReactElement {
  const commentColor = comment === 'Beat' ? semantic.positive : comment === 'Miss' ? semantic.negative : semantic.warning;

  const formatValue = (val: number | string | null): string => {
    if (val === null) return 'N/A';
    if (typeof val === 'string') return val;
    if (unit === '%') return `${val.toFixed(1)}%`;
    if (unit === '$B') return `$${val.toFixed(1)}B`;
    if (unit === '$') return `$${val.toFixed(2)}`;
    return String(val);
  };

  return (
    <PanelRow>
      <InkBox width={20}>
        <Text color={palette.textTertiary}>{name}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={palette.text}>{formatValue(actual)}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={palette.textTertiary}>{formatValue(consensus)}</Text>
      </InkBox>
      {comment && (
        <Text color={commentColor}>{comment}</Text>
      )}
    </PanelRow>
  );
}

// Guidance row component
function GuidanceRow({ metric, guidance, change, unit }: {
  metric: string;
  guidance: number | string | null;
  change: string | null;
  unit: string;
}): React.ReactElement {
  const changeColor = change === 'Raised' ? semantic.positive : change === 'Lowered' ? semantic.negative : semantic.warning;

  const formatValue = (val: number | string | null): string => {
    if (val === null) return 'N/A';
    if (typeof val === 'string') return val;
    if (unit === '%') return `${val.toFixed(1)}%`;
    if (unit === '$B') return `$${val.toFixed(0)}B`;
    if (unit === '$') return `$${val.toFixed(2)}`;
    return String(val);
  };

  return (
    <PanelRow>
      <InkBox width={18}>
        <Text color={palette.textTertiary}>{metric}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={palette.text}>{formatValue(guidance)}</Text>
      </InkBox>
      {change && (
        <Text color={changeColor}>{change}</Text>
      )}
    </PanelRow>
  );
}

export function EarningsReportView({ report }: EarningsReportProps): React.ReactElement {
  const profile = report.profile;

  return (
    <Panel width={78} title={report.symbol}>
      {/* Company name and next earnings */}
      <PanelRow>
        <Text color={palette.text}>{report.companyName}</Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Earnings Report</Text>
        {report.nextEarningsDate && (
          <>
            <Text color={palette.textTertiary}> {symbols.bullet} Next: </Text>
            <Text color={palette.accent}>
              {report.nextEarningsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </>
        )}
      </PanelRow>

      {/* Current Price */}
      {profile && (
        <Section>
          <PanelRow>
            <Text bold color={palette.text}>{formatCurrency(profile.price)}</Text>
            <Text>  </Text>
            <Text color={profile.changePercent >= 0 ? semantic.positive : semantic.negative}>
              {profile.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown} {formatCurrency(profile.change)} ({formatPercent(profile.changePercent)})
            </Text>
          </PanelRow>
        </Section>
      )}

      {/* Beat/Miss Summary */}
      <Section title="Track Record">
        <PanelRow>
          <InkBox width={20}>
            <Text color={palette.textTertiary}>Beat Rate</Text>
          </InkBox>
          <Text color={report.beatRate >= 75 ? semantic.positive : report.beatRate >= 50 ? semantic.warning : semantic.negative}>
            {report.beatRate.toFixed(0)}%
          </Text>
        </PanelRow>
        <PanelRow>
          <InkBox width={20}>
            <Text color={palette.textTertiary}>Avg Surprise</Text>
          </InkBox>
          <Text color={report.avgSurprise >= 0 ? semantic.positive : semantic.negative}>
            {report.avgSurprise >= 0 ? '+' : ''}{report.avgSurprise.toFixed(1)}%
          </Text>
        </PanelRow>
        <PanelRow>
          <InkBox width={20}>
            <Text color={palette.textTertiary}>Consecutive Beats</Text>
          </InkBox>
          <Text color={palette.text}>{report.consecutiveBeats}</Text>
        </PanelRow>
      </Section>

      {/* AI Summary */}
      <Section title="AI Summary">
        <PanelRow>
          <InkBox width={72}>
            <Text color={palette.text} wrap="wrap">{report.earningsSummary}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Quarterly Results */}
      {report.quarterlyResults.length > 0 && (
        <Section title="Quarterly Results">
          <PanelRow>
            <InkBox width={10}><Text color={palette.textTertiary}>Quarter</Text></InkBox>
            <InkBox width={14}><Text color={palette.textTertiary}>Revenue</Text></InkBox>
            <InkBox width={10}><Text color={palette.textTertiary}>EPS</Text></InkBox>
            <InkBox width={10}><Text color={palette.textTertiary}>Result</Text></InkBox>
          </PanelRow>
          {report.quarterlyResults.slice(0, 4).map((q) => (
            <QuarterlyRow
              key={q.fiscalQuarter}
              fiscalQuarter={q.fiscalQuarter}
              revenue={q.revenue.actual}
              eps={q.eps.actual}
              comment={q.eps.comment}
            />
          ))}
        </Section>
      )}

      {/* KPIs */}
      {report.kpis.length > 0 && (
        <Section title="Key Performance Indicators">
          <PanelRow>
            <InkBox width={20}><Text color={palette.textTertiary}>Metric</Text></InkBox>
            <InkBox width={12}><Text color={palette.textTertiary}>Actual</Text></InkBox>
            <InkBox width={12}><Text color={palette.textTertiary}>Est</Text></InkBox>
            <Text color={palette.textTertiary}>Result</Text>
          </PanelRow>
          {report.kpis.map((kpi, i) => (
            <KPIRow
              key={i}
              name={kpi.name}
              actual={kpi.actual}
              consensus={kpi.consensus}
              comment={kpi.comment}
              unit={kpi.unit}
            />
          ))}
        </Section>
      )}

      {/* Guidance */}
      {report.guidance.length > 0 && (
        <Section title="Forward Guidance">
          {report.guidance.map((g, i) => (
            <GuidanceRow
              key={i}
              metric={g.metric}
              guidance={g.guidance}
              change={g.change}
              unit={g.unit}
            />
          ))}
          {report.guidanceAnalysis && (
            <PanelRow>
              <InkBox width={72}>
                <Text color={palette.textSecondary} wrap="wrap">{report.guidanceAnalysis}</Text>
              </InkBox>
            </PanelRow>
          )}
        </Section>
      )}

      {/* Forward Estimates */}
      <Section title="Analyst Estimates">
        <PanelRow>
          <InkBox width={20}><Text color={palette.textTertiary}>Current Q EPS</Text></InkBox>
          <Text color={palette.text}>
            {report.estimates.currentQuarterEps !== null ? `$${report.estimates.currentQuarterEps.toFixed(2)}` : 'N/A'}
          </Text>
          <Text>    </Text>
          <InkBox width={16}><Text color={palette.textTertiary}>Next Q EPS</Text></InkBox>
          <Text color={palette.text}>
            {report.estimates.nextQuarterEps !== null ? `$${report.estimates.nextQuarterEps.toFixed(2)}` : 'N/A'}
          </Text>
        </PanelRow>
        <PanelRow>
          <InkBox width={20}><Text color={palette.textTertiary}>Current Y EPS</Text></InkBox>
          <Text color={palette.text}>
            {report.estimates.currentYearEps !== null ? `$${report.estimates.currentYearEps.toFixed(2)}` : 'N/A'}
          </Text>
          <Text>    </Text>
          <InkBox width={16}><Text color={palette.textTertiary}>Next Y EPS</Text></InkBox>
          <Text color={palette.text}>
            {report.estimates.nextYearEps !== null ? `$${report.estimates.nextYearEps.toFixed(2)}` : 'N/A'}
          </Text>
        </PanelRow>
      </Section>

      {/* Key Takeaways */}
      {report.keyTakeaways.length > 0 && (
        <Section title="Key Takeaways">
          {report.keyTakeaways.map((t, i) => (
            <PanelRow key={i}>
              <Text color={palette.accent}>{symbols.bullet} </Text>
              <InkBox width={70}>
                <Text color={palette.text} wrap="wrap">{t}</Text>
              </InkBox>
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Performance Trend */}
      {report.performanceTrend && (
        <Section title="Performance Trend">
          <PanelRow>
            <InkBox width={72}>
              <Text color={palette.text} wrap="wrap">{report.performanceTrend}</Text>
            </InkBox>
          </PanelRow>
        </Section>
      )}

      {/* SEC Filings */}
      {report.recentFilings.length > 0 && (
        <Section title="Recent SEC Filings">
          {report.recentFilings.slice(0, 5).map((f, i) => (
            <PanelRow key={i}>
              <InkBox width={8}>
                <Text color={palette.accent}>{f.form}</Text>
              </InkBox>
              <InkBox width={12}>
                <Text color={palette.textTertiary}>{f.filingDate}</Text>
              </InkBox>
              <Text color={palette.text}>
                {f.description.length > 45 ? f.description.substring(0, 42) + '...' : f.description}
              </Text>
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Outlook */}
      {report.outlook && (
        <Section title="Outlook">
          <PanelRow>
            <InkBox width={72}>
              <Text color={palette.text} wrap="wrap">{report.outlook}</Text>
            </InkBox>
          </PanelRow>
        </Section>
      )}

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          Generated {report.generatedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default EarningsReportView;
