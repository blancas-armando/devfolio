/**
 * MarketBrief Component
 *
 * Daily market summary with AI narrative, indices,
 * sectors, movers, and upcoming earnings.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { MarketBrief, MarketNarrative } from '../../services/brief.js';
import type { MarketBriefData } from '../../services/market.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
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
    <InkBox>
      <InkBox width={14}>
        <Text color={palette.text}>{name}</Text>
      </InkBox>
      <InkBox width={12} justifyContent="flex-end">
        <Text color={palette.text}>{priceStr}</Text>
      </InkBox>
      <InkBox width={10} marginLeft={2}>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {arrow} {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </Text>
      </InkBox>
      {weekChange !== null && (
        <InkBox marginLeft={2}>
          <Text color={palette.textTertiary}>
            {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(1)}% wk
          </Text>
        </InkBox>
      )}
    </InkBox>
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
    <InkBox>
      <InkBox width={12}>
        <Text color={palette.textTertiary}>{name}</Text>
      </InkBox>
      <Text color={palette.text}>{valueStr} </Text>
      <Text color={isUp ? semantic.positive : semantic.negative}>
        ({isUp ? '+' : ''}{changePercent.toFixed(1)}%)
      </Text>
    </InkBox>
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
    <InkBox>
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
    </InkBox>
  );
}

// AI Narrative section
function NarrativeSection({ narrative }: { narrative: MarketNarrative }): React.ReactElement {
  return (
    <InkBox flexDirection="column" paddingX={1}>
      <Text bold color={palette.accent}>{narrative.headline}</Text>
      <InkBox marginTop={1}>
        <Text color={palette.text} wrap="wrap">{narrative.summary}</Text>
      </InkBox>
      {narrative.sectorAnalysis && (
        <InkBox marginTop={1}>
          <Text color={palette.textSecondary} wrap="wrap">{narrative.sectorAnalysis}</Text>
        </InkBox>
      )}
      {narrative.keyThemes.length > 0 && (
        <InkBox marginTop={1}>
          <Text color={palette.textTertiary}>Themes: </Text>
          <Text color={palette.info}>{narrative.keyThemes.join(' | ')}</Text>
        </InkBox>
      )}
      {narrative.outlook && (
        <InkBox marginTop={1}>
          <Text color={palette.textTertiary}>Outlook: </Text>
          <Text color={palette.text}>{narrative.outlook}</Text>
        </InkBox>
      )}
    </InkBox>
  );
}

export function MarketBriefView({ brief }: MarketBriefProps): React.ReactElement {
  const { data, narrative } = brief;
  const width = 78;
  const line = borders.horizontal.repeat(width - 2);
  const today = data.asOfDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox justifyContent="space-between" paddingX={1}>
        <Text bold color={palette.text}>MARKET BRIEF</Text>
        <Text color={palette.textTertiary}>{today}</Text>
      </InkBox>

      {/* AI Narrative */}
      {narrative && (
        <>
          <SectionHeader title="AI Summary" width={width} />
          <NarrativeSection narrative={narrative} />
        </>
      )}

      {/* Major Indices */}
      {data.indices.length > 0 && (
        <>
          <SectionHeader title="Major Indices" width={width} />
          <InkBox flexDirection="column" paddingX={2}>
            {data.indices.map((idx) => (
              <IndexRow
                key={idx.symbol}
                name={idx.name}
                price={idx.price}
                changePercent={idx.changePercent}
                weekChange={idx.weekChange}
              />
            ))}
          </InkBox>
        </>
      )}

      {/* Market Indicators */}
      <SectionHeader title="Indicators" width={width} />
      <InkBox flexDirection="column" paddingX={2}>
        {data.indicators.vix && (
          <InkBox>
            <InkBox width={12}>
              <Text color={palette.textTertiary}>VIX</Text>
            </InkBox>
            <Text color={data.indicators.vix.value > 25 ? semantic.negative : data.indicators.vix.value > 20 ? semantic.warning : semantic.positive}>
              {data.indicators.vix.value.toFixed(2)}
            </Text>
            <Text color={palette.textTertiary}> (Fear/Greed)</Text>
          </InkBox>
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
      </InkBox>

      {/* Sectors */}
      {data.sectors.length > 0 && (
        <>
          <SectionHeader title="Sector Performance" width={width} />
          <InkBox paddingX={2} flexWrap="wrap">
            {data.sectors.map((sec, i) => (
              <React.Fragment key={sec.symbol}>
                {i > 0 && <Text>  </Text>}
                <Text color={sec.changePercent >= 0 ? semantic.positive : semantic.negative}>
                  {sec.name} {sec.changePercent >= 0 ? '+' : ''}{sec.changePercent.toFixed(1)}%
                </Text>
              </React.Fragment>
            ))}
          </InkBox>
        </>
      )}

      {/* Top Gainers */}
      {data.gainers.length > 0 && (
        <>
          <SectionHeader title="Top Gainers" width={width} />
          <InkBox flexDirection="column" paddingX={2}>
            {data.gainers.slice(0, 5).map((m) => (
              <MoverRow
                key={m.symbol}
                symbol={m.symbol}
                name={m.name}
                changePercent={m.changePercent}
                price={m.price}
              />
            ))}
          </InkBox>
        </>
      )}

      {/* Top Losers */}
      {data.losers.length > 0 && (
        <>
          <SectionHeader title="Top Losers" width={width} />
          <InkBox flexDirection="column" paddingX={2}>
            {data.losers.slice(0, 5).map((m) => (
              <MoverRow
                key={m.symbol}
                symbol={m.symbol}
                name={m.name}
                changePercent={m.changePercent}
                price={m.price}
              />
            ))}
          </InkBox>
        </>
      )}

      {/* Market Breadth */}
      <InkBox paddingX={2}>
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
      </InkBox>

      {/* Upcoming Earnings */}
      {data.upcomingEarnings.length > 0 && (
        <>
          <SectionHeader title="Upcoming Earnings" width={width} />
          <InkBox flexDirection="column" paddingX={2}>
            {data.upcomingEarnings.slice(0, 4).map((e) => (
              <InkBox key={e.symbol}>
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
              </InkBox>
            ))}
          </InkBox>
        </>
      )}

      {/* Top News */}
      {data.topNews.length > 0 && (
        <>
          <SectionHeader title="Headlines" width={width} />
          <InkBox flexDirection="column" paddingX={2}>
            {data.topNews.slice(0, 4).map((news, i) => (
              <InkBox key={i}>
                <Text color={palette.textTertiary}>{symbols.bullet} </Text>
                <Text color={palette.text}>
                  {news.title.length > 65 ? news.title.substring(0, 62) + '...' : news.title}
                </Text>
              </InkBox>
            ))}
          </InkBox>
        </>
      )}

      {/* Footer */}
      <InkBox paddingX={1} marginTop={1}>
        <Text color={palette.textTertiary}>
          Generated at {data.asOfDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </InkBox>
      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default MarketBriefView;
