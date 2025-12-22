/**
 * MarketBrief Component
 *
 * Daily market summary with AI narrative, indices,
 * sectors, movers, and upcoming earnings.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { MarketBrief, MarketNarrative } from '../../services/brief.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';

export interface MarketBriefProps {
  brief: MarketBrief;
}

// Format large numbers
function formatLargeNumber(num: number | null): string {
  if (num === null) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

// Index row component
function IndexRow({ name, price, changePercent, weekChange }: {
  name: string;
  price: number;
  changePercent: number;
  weekChange: number | null;
}): React.ReactElement {
  const isUp = changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const priceStr = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <PanelRow>
      <InkBox width={14}>
        <Text color={palette.text}>{name}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={palette.text}>{priceStr}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {arrow} {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </Text>
      </InkBox>
      {weekChange !== null && (
        <Text color={palette.textTertiary}>
          {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(1)}% wk
        </Text>
      )}
    </PanelRow>
  );
}

// Indicator row component
function IndicatorRow({ name, value, changePercent, unit }: {
  name: string;
  value: number;
  changePercent: number;
  unit?: string;
}): React.ReactElement {
  const isUp = changePercent >= 0;
  const valueStr = unit === '%' ? `${value.toFixed(2)}%` : `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

  return (
    <PanelRow>
      <InkBox width={12}>
        <Text color={palette.textTertiary}>{name}</Text>
      </InkBox>
      <Text color={palette.text}>{valueStr} </Text>
      <Text color={isUp ? semantic.positive : semantic.negative}>
        ({isUp ? '+' : ''}{changePercent.toFixed(1)}%)
      </Text>
    </PanelRow>
  );
}

// Mover row component
function MoverRow({ symbol, name, changePercent, price }: {
  symbol: string;
  name: string;
  changePercent: number;
  price: number;
}): React.ReactElement {
  const isUp = changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;

  return (
    <PanelRow>
      <Text color={isUp ? semantic.positive : semantic.negative}>{arrow} </Text>
      <InkBox width={8}>
        <Text color={palette.text}>{symbol}</Text>
      </InkBox>
      <InkBox width={9}>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {isUp ? '+' : ''}{changePercent.toFixed(1)}%
        </Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={palette.textTertiary}>${price.toFixed(2)}</Text>
      </InkBox>
      <Text color={palette.textTertiary}>{name.substring(0, 25)}</Text>
    </PanelRow>
  );
}

// AI Narrative section
function NarrativeSection({ narrative }: { narrative: MarketNarrative }): React.ReactElement {
  return (
    <>
      <PanelRow>
        <Text bold color={palette.accent}>{narrative.headline}</Text>
      </PanelRow>
      <PanelRow>
        <InkBox width={72}>
          <Text color={palette.text} wrap="wrap">{narrative.summary}</Text>
        </InkBox>
      </PanelRow>
      {narrative.sectorAnalysis && (
        <PanelRow>
          <InkBox width={72}>
            <Text color={palette.textSecondary} wrap="wrap">{narrative.sectorAnalysis}</Text>
          </InkBox>
        </PanelRow>
      )}
      {narrative.keyThemes.length > 0 && (
        <PanelRow>
          <Text color={palette.textTertiary}>Themes: </Text>
          <Text color={palette.info}>{narrative.keyThemes.join(' | ')}</Text>
        </PanelRow>
      )}
      {narrative.outlook && (
        <PanelRow>
          <Text color={palette.textTertiary}>Outlook: </Text>
          <Text color={palette.text}>{narrative.outlook}</Text>
        </PanelRow>
      )}
    </>
  );
}

export function MarketBriefView({ brief }: MarketBriefProps): React.ReactElement {
  const { data, narrative } = brief;
  const today = data.asOfDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Panel width={78} title="MARKET BRIEF">
      {/* Date header */}
      <PanelRow>
        <Text color={palette.textTertiary}>{today}</Text>
      </PanelRow>

      {/* AI Narrative */}
      {narrative && (
        <Section title="AI Summary">
          <NarrativeSection narrative={narrative} />
        </Section>
      )}

      {/* Major Indices */}
      {data.indices.length > 0 && (
        <Section title="Major Indices">
          {data.indices.map((idx) => (
            <IndexRow
              key={idx.symbol}
              name={idx.name}
              price={idx.price}
              changePercent={idx.changePercent}
              weekChange={idx.weekChange}
            />
          ))}
        </Section>
      )}

      {/* Market Indicators */}
      <Section title="Indicators">
        {data.indicators.vix && (
          <PanelRow>
            <InkBox width={12}>
              <Text color={palette.textTertiary}>VIX</Text>
            </InkBox>
            <Text color={data.indicators.vix.value > 25 ? semantic.negative : data.indicators.vix.value > 20 ? semantic.warning : semantic.positive}>
              {data.indicators.vix.value.toFixed(2)}
            </Text>
            <Text color={palette.textTertiary}> (Fear/Greed)</Text>
          </PanelRow>
        )}
        {data.indicators.treasury10Y && (
          <IndicatorRow
            name="10Y Yield"
            value={data.indicators.treasury10Y.value}
            changePercent={data.indicators.treasury10Y.changePercent}
            unit="%"
          />
        )}
        {data.indicators.oil && (
          <IndicatorRow
            name="Crude Oil"
            value={data.indicators.oil.value}
            changePercent={data.indicators.oil.changePercent}
          />
        )}
        {data.indicators.gold && (
          <IndicatorRow
            name="Gold"
            value={data.indicators.gold.value}
            changePercent={data.indicators.gold.changePercent}
          />
        )}
        {data.indicators.bitcoin && (
          <IndicatorRow
            name="Bitcoin"
            value={data.indicators.bitcoin.value}
            changePercent={data.indicators.bitcoin.changePercent}
          />
        )}
      </Section>

      {/* Sectors */}
      {data.sectors.length > 0 && (
        <Section title="Sector Performance">
          <PanelRow>
            {data.sectors.map((sec, i) => (
              <React.Fragment key={sec.symbol}>
                {i > 0 && <Text>  </Text>}
                <Text color={sec.changePercent >= 0 ? semantic.positive : semantic.negative}>
                  {sec.name} {sec.changePercent >= 0 ? '+' : ''}{sec.changePercent.toFixed(1)}%
                </Text>
              </React.Fragment>
            ))}
          </PanelRow>
        </Section>
      )}

      {/* Top Gainers */}
      {data.gainers.length > 0 && (
        <Section title="Top Gainers">
          {data.gainers.slice(0, 5).map((m) => (
            <MoverRow
              key={m.symbol}
              symbol={m.symbol}
              name={m.name}
              changePercent={m.changePercent}
              price={m.price}
            />
          ))}
        </Section>
      )}

      {/* Top Losers */}
      {data.losers.length > 0 && (
        <Section title="Top Losers">
          {data.losers.slice(0, 5).map((m) => (
            <MoverRow
              key={m.symbol}
              symbol={m.symbol}
              name={m.name}
              changePercent={m.changePercent}
              price={m.price}
            />
          ))}
        </Section>
      )}

      {/* Market Breadth */}
      <PanelRow>
        <Text color={palette.textTertiary}>Breadth: </Text>
        <Text color={semantic.positive}>{data.breadth.advancing} advancing</Text>
        <Text color={palette.textTertiary}> / </Text>
        <Text color={semantic.negative}>{data.breadth.declining} declining</Text>
        {data.breadth.unchanged > 0 && (
          <>
            <Text color={palette.textTertiary}> / </Text>
            <Text color={palette.textTertiary}>{data.breadth.unchanged} unchanged</Text>
          </>
        )}
      </PanelRow>

      {/* Upcoming Earnings */}
      {data.upcomingEarnings.length > 0 && (
        <Section title="Upcoming Earnings">
          {data.upcomingEarnings.slice(0, 4).map((e) => (
            <PanelRow key={e.symbol}>
              <InkBox width={8}>
                <Text color={palette.text}>{e.symbol}</Text>
              </InkBox>
              <InkBox width={14}>
                <Text color={palette.textTertiary}>
                  {e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </InkBox>
              {e.estimate !== null && (
                <Text color={palette.textTertiary}>Est: ${e.estimate.toFixed(2)}</Text>
              )}
              {e.marketCap && (
                <Text color={palette.textTertiary}> ({formatLargeNumber(e.marketCap)})</Text>
              )}
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Top News */}
      {data.topNews.length > 0 && (
        <Section title="Headlines">
          {data.topNews.slice(0, 4).map((news, i) => (
            <PanelRow key={i}>
              <Text color={palette.textTertiary}>{symbols.bullet} </Text>
              <Text color={palette.text}>
                {news.title.length > 65 ? news.title.substring(0, 62) + '...' : news.title}
              </Text>
            </PanelRow>
          ))}
        </Section>
      )}

      {/* Footer */}
      <PanelRow>
        <Text color={palette.textTertiary}>
          Generated at {data.asOfDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </PanelRow>
    </Panel>
  );
}

export default MarketBriefView;
