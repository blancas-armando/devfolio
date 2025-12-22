/**
 * WhyExplanation Component
 *
 * Displays AI explanation for stock movements with
 * headline, factors, and related news context.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { WhyExplanation } from '../../services/why.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';

export interface WhyExplanationProps {
  explanation: WhyExplanation;
}

export function WhyExplanationView({ explanation }: WhyExplanationProps): React.ReactElement {
  const isUp = explanation.changePercent >= 0;

  return (
    <Panel width={66} title={`Why is ${explanation.symbol} ${isUp ? 'up' : 'down'}?`}>
      {/* Price and change */}
      <PanelRow>
        <Text bold color={palette.text}>{formatCurrency(explanation.price)}</Text>
        <Text>  </Text>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {isUp ? symbols.arrowUp : symbols.arrowDown} {formatPercent(explanation.changePercent)}
        </Text>
      </PanelRow>

      {/* Headline */}
      <Section>
        <PanelRow>
          <InkBox width={60}>
            <Text bold color={palette.warning} wrap="wrap">{explanation.headline}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Explanation */}
      <Section>
        <PanelRow>
          <InkBox width={60}>
            <Text color={palette.text} wrap="wrap">{explanation.explanation}</Text>
          </InkBox>
        </PanelRow>
      </Section>

      {/* Key Factors */}
      {explanation.factors.length > 0 && (
        <Section title="Key Factors">
          {explanation.factors.map((factor, i) => (
            <PanelRow key={i}>
              <Text color={palette.text}>{symbols.bullet} {factor}</Text>
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Related News */}
      {explanation.newsContext.length > 0 && (
        <Section title="Related News">
          {explanation.newsContext.map((news, i) => (
            <PanelRow key={i}>
              <InkBox width={60}>
                <Text color={palette.textSecondary} wrap="wrap">{news}</Text>
              </InkBox>
            </PanelRow>
          ))}
        </Section>
      )}
    </Panel>
  );
}

export default WhyExplanationView;
