/**
 * ResearchReport Component
 *
 * Comprehensive AI-generated research report with
 * executive summary, analysis, and investment thesis.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ResearchReport } from '../../services/research.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
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

// Metric row component
function MetricRow({ label, value, valueColor }: {
  label: string;
  value: string;
  valueColor?: string;
}): React.ReactElement {
  return (
    <PanelRow>
      <InkBox width={18}>
        <Text color={palette.textTertiary}>{label}</Text>
      </InkBox>
      <Text color={valueColor ?? palette.text}>{value}</Text>
    </PanelRow>
  );
}

// Bullet point component
function BulletPoint({ text, color }: { text: string; color?: string }): React.ReactElement {
  return (
    <PanelRow>
      <Text color={color ?? palette.text}>{symbols.bullet} </Text>
      <InkBox width={70}>
        <Text color={color ?? palette.text} wrap="wrap">{text}</Text>
      </InkBox>
    </PanelRow>
  );
}

export function ResearchReportView({ report }: ResearchReportProps): React.ReactElement {
  const profile = report.data.profile;
  const isUp = profile.changePercent >= 0;

  return (
    <Panel width={78} title={report.symbol}>
      {/* Company name and date */}
      <PanelRow>
        <Text color={palette.text}>{report.companyName}</Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>
          Research Report {symbols.bullet} {report.generatedAt.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </PanelRow>

      {/* Current Price */}
      <Section>
        <PanelRow>
          <Text bold color={palette.text}>{formatCurrency(profile.price)}</Text>
          <Text>  </Text>
          <Text color={isUp ? semantic.positive : semantic.negative}>
            {isUp ? symbols.arrowUp : symbols.arrowDown} {formatCurrency(profile.change)} ({formatPercent(profile.changePercent)})
          </Text>
        </PanelRow>
        <PanelRow>
          <Text color={palette.textTertiary}>Mkt Cap: </Text>
          <Text color={palette.text}>{formatLargeNumber(profile.marketCap)}</Text>
          <Text color={palette.textTertiary}>  P/E: </Text>
          <Text color={palette.text}>{profile.peRatio?.toFixed(1) ?? 'N/A'}</Text>
          <Text color={palette.textTertiary}>  Sector: </Text>
          <Text color={palette.text}>{profile.sector}</Text>
        </PanelRow>
      </Section>

      {/* Executive Summary */}
      <Section title="Executive Summary">
        <PanelRow>
          <InkBox width={72}>
            <Text color={palette.text} wrap="wrap">{report.executiveSummary}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Business Overview */}
      <Section title="Business Overview">
        <PanelRow>
          <InkBox width={72}>
            <Text color={palette.text} wrap="wrap">{report.businessOverview}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Key Segments */}
      {report.keySegments.length > 0 && (
        <Section title="Key Segments">
          {report.keySegments.map((seg, i) => (
            <BulletPoint key={i} text={seg} />
          ))}
        </Section>
      )}

      {/* Competitive Position */}
      <Section title="Competitive Position">
        <PanelRow>
          <InkBox width={72}>
            <Text color={palette.text} wrap="wrap">{report.competitivePosition}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Financial Highlights */}
      <Section title="Financial Highlights">
        <PanelRow>
          <InkBox width={36}>
            <MetricRow label="Revenue (TTM)" value={formatLargeNumber(profile.revenue)} />
          </InkBox>
          <InkBox width={36}>
            <MetricRow label="EPS" value={profile.eps ? `$${profile.eps.toFixed(2)}` : 'N/A'} />
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={36}>
            <MetricRow
              label="Revenue Growth"
              value={profile.revenueGrowth ? `${(profile.revenueGrowth * 100).toFixed(1)}%` : 'N/A'}
              valueColor={profile.revenueGrowth && profile.revenueGrowth > 0 ? semantic.positive : semantic.negative}
            />
          </InkBox>
          <InkBox width={36}>
            <MetricRow label="P/E Ratio" value={profile.peRatio?.toFixed(1) ?? 'N/A'} />
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={36}>
            <MetricRow label="Gross Margin" value={profile.grossMargin ? `${(profile.grossMargin * 100).toFixed(1)}%` : 'N/A'} />
          </InkBox>
          <InkBox width={36}>
            <MetricRow label="Forward P/E" value={profile.forwardPE?.toFixed(1) ?? 'N/A'} />
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={36}>
            <MetricRow label="Operating Margin" value={profile.operatingMargin ? `${(profile.operatingMargin * 100).toFixed(1)}%` : 'N/A'} />
          </InkBox>
          <InkBox width={36}>
            <MetricRow label="Free Cash Flow" value={formatLargeNumber(profile.freeCashFlow)} />
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox width={72}>
            <Text color={palette.textSecondary} wrap="wrap">{report.financialHighlights}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Catalysts */}
      {report.catalysts.length > 0 && (
        <Section title="Catalysts">
          {report.catalysts.map((cat, i) => (
            <BulletPoint key={i} text={cat} color={semantic.positive} />
          ))}
        </Section>
      )}

      {/* Risks */}
      {report.risks.length > 0 && (
        <Section title="Key Risks">
          {report.risks.map((risk, i) => (
            <BulletPoint key={i} text={risk} color={semantic.negative} />
          ))}
        </Section>
      )}

      {/* Bull/Bear Case */}
      <Section title="Investment Cases">
        <PanelRow>
          <Text bold color={semantic.positive}>{symbols.arrowUp} Bull Case: </Text>
          <InkBox width={60}>
            <Text color={palette.text} wrap="wrap">{report.bullCase}</Text>
          </InkBox>
        </PanelRow>
        <PanelRow><Text> </Text></PanelRow>
        <PanelRow>
          <Text bold color={semantic.negative}>{symbols.arrowDown} Bear Case: </Text>
          <InkBox width={60}>
            <Text color={palette.text} wrap="wrap">{report.bearCase}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Analyst Targets */}
      {profile.targetPrice && (
        <Section title="Analyst Consensus">
          <PanelRow>
            <InkBox width={18}>
              <Text color={palette.textTertiary}>Target Price</Text>
            </InkBox>
            <Text color={palette.accent}>${profile.targetPrice.toFixed(2)}</Text>
            <Text color={palette.textTertiary}>  (</Text>
            <Text color={profile.targetPrice > profile.price ? semantic.positive : semantic.negative}>
              {profile.targetPrice > profile.price ? '+' : ''}{(((profile.targetPrice - profile.price) / profile.price) * 100).toFixed(1)}%
            </Text>
            <Text color={palette.textTertiary}>)</Text>
          </PanelRow>
          <PanelRow>
            <InkBox width={18}>
              <Text color={palette.textTertiary}>Range</Text>
            </InkBox>
            <Text color={palette.text}>
              ${profile.targetLow?.toFixed(2) ?? 'N/A'} - ${profile.targetHigh?.toFixed(2) ?? 'N/A'}
            </Text>
          </PanelRow>
          <PanelRow>
            <InkBox width={18}>
              <Text color={palette.textTertiary}>Rating</Text>
            </InkBox>
            <Text color={palette.accent}>{profile.recommendationKey?.toUpperCase() ?? 'N/A'}</Text>
            {profile.numberOfAnalysts && (
              <Text color={palette.textTertiary}> ({profile.numberOfAnalysts} analysts)</Text>
            )}
          </PanelRow>
        </Section>
      )}

      {/* Conclusion */}
      <Section title="Conclusion">
        <PanelRow>
          <InkBox width={72}>
            <Text color={palette.text} wrap="wrap">{report.conclusion}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          AI-generated analysis {symbols.bullet} Not financial advice
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default ResearchReportView;
