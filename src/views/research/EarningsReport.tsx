/**
 * EarningsReport Component
 *
 * Comprehensive earnings analysis with quarterly results,
 * guidance, KPIs, and SEC filings.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { EarningsReport } from '../../services/earnings.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
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

// Section header component
function SectionHeader({ title, width }: { title: string; width: number }): React.ReactElement {
  const line = borders.horizontal.repeat(width - title.length - 5);
  return (
    <InkBox>
      <Text color={palette.info}>
        {borders.leftTee}{borders.horizontal} {title} {line}{borders.rightTee}
      </Text>
    </InkBox>
  );
}

// Quarterly result row
function QuarterlyRow({ quarter, fiscalQuarter, revenue, eps, comment }: {
  quarter: string;
  fiscalQuarter: string;
  revenue: number | null;
  eps: number | null;
  comment: string | null;
}): React.ReactElement {
  const commentColor = comment === 'Beat' ? semantic.positive : comment === 'Miss' ? semantic.negative : semantic.warning;

  return (
    <InkBox>
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
    </InkBox>
  );
}

// KPI row component
function KPIRow({ name, actual, consensus, diff, comment, unit }: {
  name: string;
  actual: number | string | null;
  consensus: number | string | null;
  diff: number | null;
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
    <InkBox>
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
    </InkBox>
  );
}

// Guidance row component
function GuidanceRow({ metric, current, guidance, change, unit }: {
  metric: string;
  current: number | string | null;
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
    <InkBox>
      <InkBox width={18}>
        <Text color={palette.textTertiary}>{metric}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={palette.text}>{formatValue(guidance)}</Text>
      </InkBox>
      {change && (
        <Text color={changeColor}>{change}</Text>
      )}
    </InkBox>
  );
}

export function EarningsReportView({ report }: EarningsReportProps): React.ReactElement {
  const width = 78;
  const line = borders.horizontal.repeat(width - 2);
  const profile = report.profile;

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox paddingX={1}>
        <Text bold color={palette.text}>{report.symbol}</Text>
        <Text color={palette.textTertiary}> {borders.vertical} </Text>
        <Text color={palette.text}>{report.companyName}</Text>
      </InkBox>
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>Earnings Report</Text>
        {report.nextEarningsDate && (
          <>
            <Text color={palette.textTertiary}> {symbols.bullet} Next: </Text>
            <Text color={palette.accent}>
              {report.nextEarningsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </>
        )}
      </InkBox>

      {/* Current Price */}
      {profile && (
        <>
          <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
          <InkBox paddingX={1}>
            <Text bold color={palette.text}>{formatCurrency(profile.price)}</Text>
            <Text>  </Text>
            <Text color={profile.changePercent >= 0 ? semantic.positive : semantic.negative}>
              {profile.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown} {formatCurrency(profile.change)} ({formatPercent(profile.changePercent)})
            </Text>
          </InkBox>
        </>
      )}

      {/* Beat/Miss Summary */}
      <SectionHeader title="Track Record" width={width} />
      <InkBox paddingX={1}>
        <InkBox width={20}>
          <Text color={palette.textTertiary}>Beat Rate</Text>
        </InkBox>
        <Text color={report.beatRate >= 75 ? semantic.positive : report.beatRate >= 50 ? semantic.warning : semantic.negative}>
          {report.beatRate.toFixed(0)}%
        </Text>
      </InkBox>
      <InkBox paddingX={1}>
        <InkBox width={20}>
          <Text color={palette.textTertiary}>Avg Surprise</Text>
        </InkBox>
        <Text color={report.avgSurprise >= 0 ? semantic.positive : semantic.negative}>
          {report.avgSurprise >= 0 ? '+' : ''}{report.avgSurprise.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox paddingX={1}>
        <InkBox width={20}>
          <Text color={palette.textTertiary}>Consecutive Beats</Text>
        </InkBox>
        <Text color={palette.text}>{report.consecutiveBeats}</Text>
      </InkBox>

      {/* AI Summary */}
      <SectionHeader title="AI Summary" width={width} />
      <InkBox paddingX={1}>
        <Text color={palette.text} wrap="wrap">{report.earningsSummary}</Text>
      </InkBox>

      {/* Quarterly Results */}
      {report.quarterlyResults.length > 0 && (
        <>
          <SectionHeader title="Quarterly Results" width={width} />
          <InkBox paddingX={1}>
            <InkBox width={10}><Text color={palette.textTertiary}>Quarter</Text></InkBox>
            <InkBox width={14}><Text color={palette.textTertiary}>Revenue</Text></InkBox>
            <InkBox width={10}><Text color={palette.textTertiary}>EPS</Text></InkBox>
            <InkBox width={10}><Text color={palette.textTertiary}>Result</Text></InkBox>
          </InkBox>
          <InkBox flexDirection="column" paddingX={1}>
            {report.quarterlyResults.slice(0, 4).map((q) => (
              <QuarterlyRow
                key={q.fiscalQuarter}
                quarter={q.quarter}
                fiscalQuarter={q.fiscalQuarter}
                revenue={q.revenue.actual}
                eps={q.eps.actual}
                comment={q.eps.comment}
              />
            ))}
          </InkBox>
        </>
      )}

      {/* KPIs */}
      {report.kpis.length > 0 && (
        <>
          <SectionHeader title="Key Performance Indicators" width={width} />
          <InkBox paddingX={1}>
            <InkBox width={20}><Text color={palette.textTertiary}>Metric</Text></InkBox>
            <InkBox width={12}><Text color={palette.textTertiary}>Actual</Text></InkBox>
            <InkBox width={12}><Text color={palette.textTertiary}>Est</Text></InkBox>
            <Text color={palette.textTertiary}>Result</Text>
          </InkBox>
          <InkBox flexDirection="column" paddingX={1}>
            {report.kpis.map((kpi, i) => (
              <KPIRow
                key={i}
                name={kpi.name}
                actual={kpi.actual}
                consensus={kpi.consensus}
                diff={kpi.diff}
                comment={kpi.comment}
                unit={kpi.unit}
              />
            ))}
          </InkBox>
        </>
      )}

      {/* Guidance */}
      {report.guidance.length > 0 && (
        <>
          <SectionHeader title="Forward Guidance" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {report.guidance.map((g, i) => (
              <GuidanceRow
                key={i}
                metric={g.metric}
                current={g.current}
                guidance={g.guidance}
                change={g.change}
                unit={g.unit}
              />
            ))}
          </InkBox>
          {report.guidanceAnalysis && (
            <InkBox paddingX={1} marginTop={1}>
              <Text color={palette.textSecondary} wrap="wrap">{report.guidanceAnalysis}</Text>
            </InkBox>
          )}
        </>
      )}

      {/* Forward Estimates */}
      <SectionHeader title="Analyst Estimates" width={width} />
      <InkBox paddingX={1}>
        <InkBox flexDirection="column" width={38}>
          <InkBox>
            <InkBox width={20}><Text color={palette.textTertiary}>Current Q EPS</Text></InkBox>
            <Text color={palette.text}>
              {report.estimates.currentQuarterEps !== null ? `$${report.estimates.currentQuarterEps.toFixed(2)}` : 'N/A'}
            </Text>
          </InkBox>
          <InkBox>
            <InkBox width={20}><Text color={palette.textTertiary}>Current Y EPS</Text></InkBox>
            <Text color={palette.text}>
              {report.estimates.currentYearEps !== null ? `$${report.estimates.currentYearEps.toFixed(2)}` : 'N/A'}
            </Text>
          </InkBox>
        </InkBox>
        <InkBox flexDirection="column" width={38}>
          <InkBox>
            <InkBox width={20}><Text color={palette.textTertiary}>Next Q EPS</Text></InkBox>
            <Text color={palette.text}>
              {report.estimates.nextQuarterEps !== null ? `$${report.estimates.nextQuarterEps.toFixed(2)}` : 'N/A'}
            </Text>
          </InkBox>
          <InkBox>
            <InkBox width={20}><Text color={palette.textTertiary}>Next Y EPS</Text></InkBox>
            <Text color={palette.text}>
              {report.estimates.nextYearEps !== null ? `$${report.estimates.nextYearEps.toFixed(2)}` : 'N/A'}
            </Text>
          </InkBox>
        </InkBox>
      </InkBox>

      {/* Key Takeaways */}
      {report.keyTakeaways.length > 0 && (
        <>
          <SectionHeader title="Key Takeaways" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {report.keyTakeaways.map((t, i) => (
              <InkBox key={i}>
                <Text color={palette.accent}>{symbols.bullet} </Text>
                <Text color={palette.text} wrap="wrap">{t}</Text>
              </InkBox>
            ))}
          </InkBox>
        </>
      )}

      {/* Performance Trend */}
      {report.performanceTrend && (
        <>
          <SectionHeader title="Performance Trend" width={width} />
          <InkBox paddingX={1}>
            <Text color={palette.text} wrap="wrap">{report.performanceTrend}</Text>
          </InkBox>
        </>
      )}

      {/* SEC Filings */}
      {report.recentFilings.length > 0 && (
        <>
          <SectionHeader title="Recent SEC Filings" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {report.recentFilings.slice(0, 5).map((f, i) => (
              <InkBox key={i}>
                <InkBox width={8}>
                  <Text color={palette.accent}>{f.form}</Text>
                </InkBox>
                <InkBox width={12}>
                  <Text color={palette.textTertiary}>{f.filingDate}</Text>
                </InkBox>
                <Text color={palette.text}>
                  {f.description.length > 45 ? f.description.substring(0, 42) + '...' : f.description}
                </Text>
              </InkBox>
            ))}
          </InkBox>
        </>
      )}

      {/* Outlook */}
      {report.outlook && (
        <>
          <SectionHeader title="Outlook" width={width} />
          <InkBox paddingX={1}>
            <Text color={palette.text} wrap="wrap">{report.outlook}</Text>
          </InkBox>
        </>
      )}

      {/* Footer */}
      <InkBox paddingX={1} marginTop={1}>
        <Text color={palette.textTertiary}>
          Generated {report.generatedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Text>
      </InkBox>
      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default EarningsReportView;
