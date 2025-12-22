/**
 * WatchlistView Component
 *
 * Displays the user's watchlist with quotes and upcoming events.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { Quote } from '../../types/index.js';
import type { EventsCalendar } from '../../services/market.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
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
    <PanelRow>
      <InkBox width={10}>
        <Text bold color={palette.text}>{quote.symbol}</Text>
      </InkBox>
      <InkBox width={14}>
        <Text color={palette.text}>{formatCurrency(quote.price)}</Text>
      </InkBox>
      <Text color={isUp ? semantic.positive : semantic.negative}>
        {arrow} {formatPercent(quote.changePercent)}
      </Text>
    </PanelRow>
  );
}

// Empty state component
function EmptyWatchlist(): React.ReactElement {
  return (
    <Panel width={60} title="Watchlist">
      <PanelRow>
        <Text color={palette.info}>Your watchlist is empty</Text>
      </PanelRow>
      <PanelRow><Text> </Text></PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Get started:</Text>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={semantic.command}>add AAPL      </Text>
          <Text color={palette.textTertiary}>Add Apple to your watchlist</Text>
        </InkBox>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={semantic.command}>add MSFT GOOGL</Text>
          <Text color={palette.textTertiary}>Add multiple stocks at once</Text>
        </InkBox>
      </PanelRow>
      <PanelRow><Text> </Text></PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Or explore the market:</Text>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={semantic.command}>screen gainers</Text>
          <Text color={palette.textTertiary}>See today's top gainers</Text>
        </InkBox>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={semantic.command}>b             </Text>
          <Text color={palette.textTertiary}>Get an AI market brief</Text>
        </InkBox>
      </PanelRow>
    </Panel>
  );
}

export function WatchlistView({ quotes, calendar }: WatchlistViewProps): React.ReactElement {
  if (quotes.length === 0) {
    return <EmptyWatchlist />;
  }

  const upcomingEarnings = calendar?.earnings.slice(0, 3) ?? [];
  const upcomingDividends = calendar?.dividends.slice(0, 2) ?? [];
  const hasEvents = upcomingEarnings.length > 0 || upcomingDividends.length > 0;

  return (
    <Panel width={60} title="Watchlist">
      {/* Column headers */}
      <PanelRow>
        <InkBox width={10}>
          <Text color={palette.textTertiary}>Symbol</Text>
        </InkBox>
        <InkBox width={14}>
          <Text color={palette.textTertiary}>Price</Text>
        </InkBox>
        <Text color={palette.textTertiary}>Change</Text>
      </PanelRow>

      {/* Quotes */}
      {quotes.map((quote) => (
        <QuoteRow key={quote.symbol} quote={quote} />
      ))}

      {/* Upcoming Events */}
      {hasEvents && (
        <Section title="Upcoming Events">
          {upcomingEarnings.map((e) => {
            const dateStr = e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <PanelRow key={`${e.symbol}-earnings`}>
                <Text color={palette.info}>E </Text>
                <InkBox width={8}>
                  <Text color={palette.text}>{e.symbol}</Text>
                </InkBox>
                <Text color={palette.textTertiary}>Earnings </Text>
                <Text color={semantic.command}>{dateStr}</Text>
              </PanelRow>
            );
          })}
          {upcomingDividends.map((d) => {
            const dateStr = d.exDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <PanelRow key={`${d.symbol}-dividend`}>
                <Text color={semantic.positive}>D </Text>
                <InkBox width={8}>
                  <Text color={palette.text}>{d.symbol}</Text>
                </InkBox>
                <Text color={palette.textTertiary}>Ex-Div   </Text>
                <Text color={semantic.command}>{dateStr}</Text>
              </PanelRow>
            );
          })}
        </Section>
      )}
    </Panel>
  );
}

export default WatchlistView;
