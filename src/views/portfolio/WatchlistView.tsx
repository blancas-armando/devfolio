/**
 * WatchlistView Component
 *
 * Displays the user's watchlist with quotes and upcoming events.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { Quote } from '../../types/index.js';
import type { EventsCalendar } from '../../services/market.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';

export interface WatchlistViewProps {
  quotes: Quote[];
  calendar?: EventsCalendar;
}

// Quote row component
function QuoteRow({ quote }: { quote: Quote }): React.ReactElement {
  const isUp = quote.changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;

  return (
    <InkBox>
      <InkBox width={10}>
        <Text bold color={palette.text}>{quote.symbol}</Text>
      </InkBox>
      <InkBox width={14}>
        <Text color={palette.text}>{formatCurrency(quote.price)}</Text>
      </InkBox>
      <Text color={isUp ? semantic.positive : semantic.negative}>
        {arrow} {formatPercent(quote.changePercent)}
      </Text>
    </InkBox>
  );
}

// Empty state component
function EmptyWatchlist(): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginY={1} marginX={2}>
      <Text color={palette.info}>Your watchlist is empty</Text>
      <Text> </Text>
      <Text color={palette.textTertiary}>Get started:</Text>
      <InkBox marginLeft={2}>
        <Text color={semantic.command}>add AAPL      </Text>
        <Text color={palette.textTertiary}>Add Apple to your watchlist</Text>
      </InkBox>
      <InkBox marginLeft={2}>
        <Text color={semantic.command}>add MSFT GOOGL</Text>
        <Text color={palette.textTertiary}>Add multiple stocks at once</Text>
      </InkBox>
      <Text> </Text>
      <Text color={palette.textTertiary}>Or explore the market:</Text>
      <InkBox marginLeft={2}>
        <Text color={semantic.command}>screen gainers</Text>
        <Text color={palette.textTertiary}>See today's top gainers</Text>
      </InkBox>
      <InkBox marginLeft={2}>
        <Text color={semantic.command}>b             </Text>
        <Text color={palette.textTertiary}>Get an AI market brief</Text>
      </InkBox>
    </InkBox>
  );
}

export function WatchlistView({ quotes, calendar }: WatchlistViewProps): React.ReactElement {
  const width = 58;
  const line = borders.horizontal.repeat(width - 2);

  if (quotes.length === 0) {
    return <EmptyWatchlist />;
  }

  const upcomingEarnings = calendar?.earnings.slice(0, 3) ?? [];
  const upcomingDividends = calendar?.dividends.slice(0, 2) ?? [];
  const hasEvents = upcomingEarnings.length > 0 || upcomingDividends.length > 0;

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical} </Text>
        <Text bold color={palette.text}>Watchlist</Text>
      </InkBox>
      <Text color={palette.border}>{borders.leftTee}{line}{borders.rightTee}</Text>

      {/* Column headers */}
      <InkBox paddingX={2}>
        <InkBox width={10}>
          <Text color={palette.textTertiary}>Symbol</Text>
        </InkBox>
        <InkBox width={14}>
          <Text color={palette.textTertiary}>Price</Text>
        </InkBox>
        <Text color={palette.textTertiary}>Change</Text>
      </InkBox>
      <InkBox paddingX={2}>
        <Text color={palette.textTertiary}>{borders.horizontal.repeat(46)}</Text>
      </InkBox>

      {/* Quotes */}
      <InkBox flexDirection="column" paddingX={2}>
        {quotes.map((quote) => (
          <QuoteRow key={quote.symbol} quote={quote} />
        ))}
      </InkBox>

      {/* Upcoming Events */}
      {hasEvents && (
        <>
          <InkBox paddingX={2} marginTop={1}>
            <Text color={palette.textTertiary}>{borders.horizontal.repeat(46)}</Text>
          </InkBox>
          <InkBox paddingX={2}>
            <Text bold color={semantic.command}>Upcoming Events</Text>
          </InkBox>
          <InkBox flexDirection="column" paddingX={2}>
            {upcomingEarnings.map((e) => {
              const dateStr = e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <InkBox key={`${e.symbol}-earnings`}>
                  <Text color={palette.info}>E </Text>
                  <InkBox width={8}>
                    <Text color={palette.text}>{e.symbol}</Text>
                  </InkBox>
                  <Text color={palette.textTertiary}>Earnings </Text>
                  <Text color={semantic.command}>{dateStr}</Text>
                </InkBox>
              );
            })}
            {upcomingDividends.map((d) => {
              const dateStr = d.exDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <InkBox key={`${d.symbol}-dividend`}>
                  <Text color={semantic.positive}>D </Text>
                  <InkBox width={8}>
                    <Text color={palette.text}>{d.symbol}</Text>
                  </InkBox>
                  <Text color={palette.textTertiary}>Ex-Div   </Text>
                  <Text color={semantic.command}>{dateStr}</Text>
                </InkBox>
              );
            })}
          </InkBox>
        </>
      )}

      {/* Footer */}
      <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default WatchlistView;
