/**
 * PortfolioView Component
 *
 * Displays the user's portfolio with holdings and gains.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { Portfolio, Holding } from '../../types/index.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';

export interface PortfolioViewProps {
  portfolio: Portfolio;
}

// Holding row component
function HoldingRow({ holding }: { holding: Holding }): React.ReactElement {
  const gain = holding.gain ?? 0;
  const price = holding.currentPrice ?? 0;
  const gainPct = holding.gainPercent ?? 0;
  const isUp = gain >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;

  return (
    <PanelRow>
      <InkBox width={8}>
        <Text bold color={palette.text}>{holding.symbol}</Text>
      </InkBox>
      <InkBox width={6}>
        <Text color={palette.textSecondary}>{holding.shares}</Text>
      </InkBox>
      <Text color={palette.textTertiary}>@ </Text>
      <InkBox width={12}>
        <Text color={palette.text}>{formatCurrency(price)}</Text>
      </InkBox>
      <Text color={isUp ? semantic.positive : semantic.negative}>
        {arrow} {formatPercent(gainPct)}
      </Text>
    </PanelRow>
  );
}

// Empty state component
function EmptyPortfolio(): React.ReactElement {
  return (
    <Panel width={60} title="Portfolio">
      <PanelRow>
        <Text color={palette.info}>Your portfolio is empty</Text>
      </PanelRow>
      <PanelRow><Text> </Text></PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>To track holdings, use natural language:</Text>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={semantic.command}>"bought 10 AAPL at 150"</Text>
        </InkBox>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={semantic.command}>"add 5 shares of MSFT at $420"</Text>
        </InkBox>
      </PanelRow>
      <PanelRow><Text> </Text></PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Or just track stocks without cost basis:</Text>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={semantic.command}>w</Text>
          <Text color={palette.textTertiary}> Use your watchlist instead</Text>
        </InkBox>
      </PanelRow>
    </Panel>
  );
}

export function PortfolioView({ portfolio }: PortfolioViewProps): React.ReactElement {
  if (portfolio.holdings.length === 0) {
    return <EmptyPortfolio />;
  }

  const isUp = portfolio.totalGain >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;

  return (
    <Panel width={60} title="Portfolio">
      {/* Summary */}
      <PanelRow>
        <Text color={palette.textTertiary}>Total Value: </Text>
        <Text bold color={palette.text}>{formatCurrency(portfolio.totalValue)}</Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Total Gain:  </Text>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {arrow} {formatCurrency(portfolio.totalGain)} ({formatPercent(portfolio.totalGainPercent)})
        </Text>
      </PanelRow>

      {/* Holdings */}
      <Section title="Holdings">
        {portfolio.holdings.map((holding) => (
          <HoldingRow key={holding.symbol} holding={holding} />
        ))}
      </Section>
    </Panel>
  );
}

export default PortfolioView;
