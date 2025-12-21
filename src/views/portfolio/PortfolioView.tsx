/**
 * PortfolioView Component
 *
 * Displays the user's portfolio with holdings and gains.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { Portfolio, Holding } from '../../types/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
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
    <InkBox>
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
    </InkBox>
  );
}

// Empty state component
function EmptyPortfolio(): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginY={1} marginX={2}>
      <Text color={palette.info}>Your portfolio is empty</Text>
      <Text> </Text>
      <Text color={palette.textTertiary}>To track holdings, use natural language:</Text>
      <InkBox marginLeft={2}>
        <Text color={semantic.command}>"bought 10 AAPL at 150"</Text>
      </InkBox>
      <InkBox marginLeft={2}>
        <Text color={semantic.command}>"add 5 shares of MSFT at $420"</Text>
      </InkBox>
      <Text> </Text>
      <Text color={palette.textTertiary}>Or just track stocks without cost basis:</Text>
      <InkBox marginLeft={2}>
        <Text color={semantic.command}>w</Text>
        <Text color={palette.textTertiary}> Use your watchlist instead</Text>
      </InkBox>
    </InkBox>
  );
}

export function PortfolioView({ portfolio }: PortfolioViewProps): React.ReactElement {
  const width = 58;
  const line = borders.horizontal.repeat(width - 2);

  if (portfolio.holdings.length === 0) {
    return <EmptyPortfolio />;
  }

  const isUp = portfolio.totalGain >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text bold color={palette.text}>Portfolio</Text>
      </InkBox>
      <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>

      {/* Summary */}
      <InkBox flexDirection="column" paddingX={2}>
        <InkBox>
          <Text color={palette.textTertiary}>Total Value: </Text>
          <Text bold color={palette.text}>{formatCurrency(portfolio.totalValue)}</Text>
        </InkBox>
        <InkBox>
          <Text color={palette.textTertiary}>Total Gain:  </Text>
          <Text color={isUp ? semantic.positive : semantic.negative}>
            {arrow} {formatCurrency(portfolio.totalGain)} ({formatPercent(portfolio.totalGainPercent)})
          </Text>
        </InkBox>
      </InkBox>

      {/* Holdings header */}
      <InkBox paddingX={2} marginTop={1}>
        <Text color={palette.textTertiary}>Holdings:</Text>
      </InkBox>

      {/* Holdings */}
      <InkBox flexDirection="column" paddingX={2}>
        {portfolio.holdings.map((holding) => (
          <HoldingRow key={holding.symbol} holding={holding} />
        ))}
      </InkBox>

      {/* Footer */}
      <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default PortfolioView;
