/**
 * ResearchReport Component
 *
 * Comprehensive AI-generated research report with
 * executive summary, analysis, and investment thesis.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ResearchReport } from '../../services/research.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';

export interface ResearchReportProps {
  report: ResearchReport;
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

// Metric row component
function MetricRow({ label, value, valueColor }: {
  label: string;
  value: string;
  valueColor?: string;
}): React.ReactElement {
  return (
    <InkBox>
      <InkBox width={18}>
        <Text color={palette.textTertiary}>{label}</Text>
      </InkBox>
      <Text color={valueColor ?? palette.text}>{value}</Text>
    </InkBox>
  );
}

// Bullet point component
function BulletPoint({ text, color }: { text: string; color?: string }): React.ReactElement {
  return (
    <InkBox>
      <Text color={color ?? palette.text}>{symbols.bullet} </Text>
      <Text color={color ?? palette.text} wrap="wrap">{text}</Text>
    </InkBox>
  );
}

export function ResearchReportView({ report }: ResearchReportProps): React.ReactElement {
  const width = 78;
  const line = borders.horizontal.repeat(width - 2);
  const profile = report.data.profile;
  const isUp = profile.changePercent >= 0;

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
        <Text color={palette.textTertiary}>
          Research Report {symbols.bullet} {report.generatedAt.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </InkBox>

      {/* Current Price */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox paddingX={1}>
        <Text bold color={palette.text}>{formatCurrency(profile.price)}</Text>
        <Text>  </Text>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {isUp ? symbols.arrowUp : symbols.arrowDown} {formatCurrency(profile.change)} ({formatPercent(profile.changePercent)})
        </Text>
      </InkBox>

      {/* Key Stats Row */}
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>Mkt Cap: </Text>
        <Text color={palette.text}>{formatLargeNumber(profile.marketCap)}</Text>
        <Text color={palette.textTertiary}>  P/E: </Text>
        <Text color={palette.text}>{profile.peRatio?.toFixed(1) ?? 'N/A'}</Text>
        <Text color={palette.textTertiary}>  Sector: </Text>
        <Text color={palette.text}>{profile.sector}</Text>
      </InkBox>

      {/* Executive Summary */}
      <SectionHeader title="Executive Summary" width={width} />
      <InkBox paddingX={1}>
        <Text color={palette.text} wrap="wrap">{report.executiveSummary}</Text>
      </InkBox>

      {/* Business Overview */}
      <SectionHeader title="Business Overview" width={width} />
      <InkBox paddingX={1}>
        <Text color={palette.text} wrap="wrap">{report.businessOverview}</Text>
      </InkBox>

      {/* Key Segments */}
      {report.keySegments.length > 0 && (
        <>
          <SectionHeader title="Key Segments" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {report.keySegments.map((seg, i) => (
              <BulletPoint key={i} text={seg} />
            ))}
          </InkBox>
        </>
      )}

      {/* Competitive Position */}
      <SectionHeader title="Competitive Position" width={width} />
      <InkBox paddingX={1}>
        <Text color={palette.text} wrap="wrap">{report.competitivePosition}</Text>
      </InkBox>

      {/* Financial Highlights */}
      <SectionHeader title="Financial Highlights" width={width} />
      <InkBox flexDirection="column" paddingX={1}>
        <InkBox>
          <InkBox flexDirection="column" width={38}>
            <MetricRow label="Revenue (TTM)" value={formatLargeNumber(profile.revenue)} />
            <MetricRow
              label="Revenue Growth"
              value={profile.revenueGrowth ? `${(profile.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}
              valueColor={profile.revenueGrowth && profile.revenueGrowth > 0 ? semantic.positive : semantic.negative}
            />
            <MetricRow
              label="Gross Margin"
              value={profile.grossMargin ? `${(profile.grossMargin * 100).toFixed(1)}%` : 'N/A'}
            />
            <MetricRow
              label="Operating Margin"
              value={profile.operatingMargin ? `${(profile.operatingMargin * 100).toFixed(1)}%` : 'N/A'}
            />
          </InkBox>
          <InkBox flexDirection="column" width={38}>
            <MetricRow
              label="EPS"
              value={profile.eps ? `$${profile.eps.toFixed(2)}` : 'N/A'}
            />
            <MetricRow
              label="P/E Ratio"
              value={profile.peRatio?.toFixed(1) ?? 'N/A'}
            />
            <MetricRow
              label="Forward P/E"
              value={profile.forwardPE?.toFixed(1) ?? 'N/A'}
            />
            <MetricRow
              label="Free Cash Flow"
              value={formatLargeNumber(profile.freeCashFlow)}
            />
          </InkBox>
        </InkBox>
        <InkBox marginTop={1}>
          <Text color={palette.textSecondary} wrap="wrap">{report.financialHighlights}</Text>
        </InkBox>
      </InkBox>

      {/* Catalysts */}
      {report.catalysts.length > 0 && (
        <>
          <SectionHeader title="Catalysts" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {report.catalysts.map((cat, i) => (
              <BulletPoint key={i} text={cat} color={semantic.positive} />
            ))}
          </InkBox>
        </>
      )}

      {/* Risks */}
      {report.risks.length > 0 && (
        <>
          <SectionHeader title="Key Risks" width={width} />
          <InkBox flexDirection="column" paddingX={1}>
            {report.risks.map((risk, i) => (
              <BulletPoint key={i} text={risk} color={semantic.negative} />
            ))}
          </InkBox>
        </>
      )}

      {/* Bull/Bear Case */}
      <SectionHeader title="Investment Cases" width={width} />
      <InkBox flexDirection="column" paddingX={1}>
        <InkBox>
          <Text bold color={semantic.positive}>{symbols.arrowUp} Bull Case: </Text>
          <Text color={palette.text} wrap="wrap">{report.bullCase}</Text>
        </InkBox>
        <InkBox marginTop={1}>
          <Text bold color={semantic.negative}>{symbols.arrowDown} Bear Case: </Text>
          <Text color={palette.text} wrap="wrap">{report.bearCase}</Text>
        </InkBox>
      </InkBox>

      {/* Analyst Targets */}
      {profile.targetPrice && (
        <>
          <SectionHeader title="Analyst Consensus" width={width} />
          <InkBox paddingX={1}>
            <InkBox width={18}>
              <Text color={palette.textTertiary}>Target Price</Text>
            </InkBox>
            <Text color={palette.accent}>${profile.targetPrice.toFixed(2)}</Text>
            <Text color={palette.textTertiary}>  (</Text>
            <Text color={profile.targetPrice > profile.price ? semantic.positive : semantic.negative}>
              {profile.targetPrice > profile.price ? '+' : ''}{(((profile.targetPrice - profile.price) / profile.price) * 100).toFixed(1)}%
            </Text>
            <Text color={palette.textTertiary}>)</Text>
          </InkBox>
          <InkBox paddingX={1}>
            <InkBox width={18}>
              <Text color={palette.textTertiary}>Range</Text>
            </InkBox>
            <Text color={palette.text}>
              ${profile.targetLow?.toFixed(2) ?? 'N/A'} - ${profile.targetHigh?.toFixed(2) ?? 'N/A'}
            </Text>
          </InkBox>
          <InkBox paddingX={1}>
            <InkBox width={18}>
              <Text color={palette.textTertiary}>Rating</Text>
            </InkBox>
            <Text color={palette.accent}>{profile.recommendationKey?.toUpperCase() ?? 'N/A'}</Text>
            {profile.numberOfAnalysts && (
              <Text color={palette.textTertiary}> ({profile.numberOfAnalysts} analysts)</Text>
            )}
          </InkBox>
        </>
      )}

      {/* Conclusion */}
      <SectionHeader title="Conclusion" width={width} />
      <InkBox paddingX={1}>
        <Text color={palette.text} wrap="wrap">{report.conclusion}</Text>
      </InkBox>

      {/* Footer */}
      <InkBox paddingX={1} marginTop={1}>
        <Text color={palette.textTertiary}>
          AI-generated analysis {symbols.bullet} Not financial advice
        </Text>
      </InkBox>
      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default ResearchReportView;
