/**
 * MarketPulse Component
 *
 * Real-time market snapshot showing indices, sectors,
 * top movers, and alerts.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { MarketPulse, PulseAlert, AlertSeverity, MarketStatus } from '../../services/pulse.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';

export interface MarketPulseProps {
  pulse: MarketPulse;
}

// Market status label
function getStatusColor(status: MarketStatus): string {
  switch (status) {
    case 'pre-market': return semantic.warning;
    case 'open': return semantic.positive;
    case 'after-hours': return semantic.warning;
    case 'closed': return palette.textTertiary;
  }
}

function getStatusLabel(status: MarketStatus): string {
  switch (status) {
    case 'pre-market': return 'PRE-MARKET';
    case 'open': return 'OPEN';
    case 'after-hours': return 'AFTER-HOURS';
    case 'closed': return 'CLOSED';
  }
}

// Alert severity colors
function getAlertColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return semantic.negative;
    case 'warning': return semantic.warning;
    case 'info': return palette.info;
    case 'positive': return semantic.positive;
  }
}

// Index row component
function IndexRow({ name, price, changePercent, nearHigh, nearLow }: {
  name: string;
  price: number;
  changePercent: number;
  nearHigh?: boolean;
  nearLow?: boolean;
}): React.ReactElement {
  const isUp = changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const priceStr = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const changeStr = `${isUp ? '+' : ''}${changePercent.toFixed(2)}%`;

  return (
    <PanelRow>
      <InkBox width={16}>
        <Text color={palette.text}>{name}</Text>
      </InkBox>
      <InkBox width={14}>
        <Text color={palette.text}>{priceStr}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={isUp ? semantic.positive : semantic.negative}>
          {arrow} {changeStr}
        </Text>
      </InkBox>
      {nearHigh && <Text color={palette.textTertiary}> [near high]</Text>}
      {nearLow && <Text color={palette.textTertiary}> [near low]</Text>}
    </PanelRow>
  );
}

// Mover row component
function MoverRow({ symbol, name, changePercent }: {
  symbol: string;
  name: string;
  changePercent: number;
}): React.ReactElement {
  const isUp = changePercent >= 0;
  const arrow = isUp ? symbols.arrowUp : symbols.arrowDown;
  const pctStr = `${isUp ? '+' : ''}${changePercent.toFixed(1)}%`;

  return (
    <PanelRow>
      <Text color={isUp ? semantic.positive : semantic.negative}>{arrow} </Text>
      <InkBox width={8}>
        <Text color={palette.text}>{symbol}</Text>
      </InkBox>
      <InkBox width={10}>
        <Text color={isUp ? semantic.positive : semantic.negative}>{pctStr}</Text>
      </InkBox>
      <Text color={palette.textTertiary}>{name.substring(0, 40)}</Text>
    </PanelRow>
  );
}

// Alert row component
function AlertRow({ alert }: { alert: PulseAlert }): React.ReactElement {
  const color = getAlertColor(alert.severity);
  return (
    <PanelRow>
      <Text color={color}>{symbols.bullet} </Text>
      <Text color={color}>{alert.title}</Text>
      <Text color={palette.textTertiary}>  {alert.detail}</Text>
    </PanelRow>
  );
}

export function MarketPulseView({ pulse }: MarketPulseProps): React.ReactElement {
  const time = pulse.asOfDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <Panel width={72} title="MARKET PULSE">
      {/* Status header */}
      <PanelRow>
        <Text color={getStatusColor(pulse.marketStatus)}>{getStatusLabel(pulse.marketStatus)}</Text>
        <Text color={palette.textTertiary}> {time}</Text>
      </PanelRow>

      {/* Futures (pre-market) */}
      {pulse.futures && pulse.futures.length > 0 && (
        <Section title="Futures">
          <PanelRow>
            {pulse.futures.map((f, i) => (
              <React.Fragment key={f.symbol}>
                {i > 0 && <Text>    </Text>}
                <Text color={palette.text}>{f.symbol} </Text>
                <Text color={f.changePercent >= 0 ? semantic.positive : semantic.negative}>
                  {f.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown}
                  {f.changePercent >= 0 ? '+' : ''}{f.changePercent.toFixed(2)}%
                </Text>
              </React.Fragment>
            ))}
          </PanelRow>
        </Section>
      )}

      {/* Indices */}
      <Section title="Indices">
        {pulse.indices.map((idx) => {
          let nearHigh = false;
          let nearLow = false;
          if (idx.dayHigh && idx.dayLow && idx.dayHigh !== idx.dayLow) {
            const range = idx.dayHigh - idx.dayLow;
            const position = (idx.price - idx.dayLow) / range;
            nearHigh = position >= 0.8;
            nearLow = position <= 0.2;
          }
          return (
            <IndexRow
              key={idx.symbol}
              name={idx.name}
              price={idx.price}
              changePercent={idx.changePercent}
              nearHigh={nearHigh}
              nearLow={nearLow}
            />
          );
        })}
      </Section>

      {/* Indicators row (VIX, DXY, Breadth) */}
      <PanelRow>
        {pulse.vix !== null && (
          <>
            <Text color={palette.text}>VIX </Text>
            <Text color={pulse.vix > 25 ? semantic.negative : pulse.vix > 20 ? semantic.warning : semantic.positive}>
              {pulse.vix.toFixed(1)}
            </Text>
            <Text>  |  </Text>
          </>
        )}
        {pulse.dxy && (
          <>
            <Text color={palette.text}>DXY </Text>
            <Text color={pulse.dxy.changePercent >= 0 ? semantic.positive : semantic.negative}>
              {pulse.dxy.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown}
              {Math.abs(pulse.dxy.changePercent).toFixed(1)}%
            </Text>
            <Text>  |  </Text>
          </>
        )}
        <Text color={palette.text}>{pulse.breadth.advancing}/{pulse.breadth.declining} </Text>
        <Text color={
          pulse.breadth.declining > 0 && (pulse.breadth.advancing / pulse.breadth.declining) > 1.5
            ? semantic.positive
            : pulse.breadth.declining > 0 && (pulse.breadth.advancing / pulse.breadth.declining) < 0.7
              ? semantic.negative
              : semantic.warning
        }>
          ({pulse.breadth.declining > 0 ? (pulse.breadth.advancing / pulse.breadth.declining).toFixed(1) : '>'}:1)
        </Text>
      </PanelRow>

      {/* Sectors */}
      {(pulse.topSectors.length > 0 || pulse.bottomSectors.length > 0) && (
        <Section title="Sectors">
          {pulse.topSectors.length > 0 && (
            <PanelRow>
              <Text color={palette.textTertiary}>{symbols.arrowUp} </Text>
              {pulse.topSectors.map((s, i) => (
                <React.Fragment key={s.name}>
                  {i > 0 && <Text>  </Text>}
                  <Text color={s.changePercent >= 0 ? semantic.positive : semantic.negative}>
                    {s.name} {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(1)}%
                  </Text>
                </React.Fragment>
              ))}
            </PanelRow>
          )}
          {pulse.bottomSectors.length > 0 && (
            <PanelRow>
              <Text color={palette.textTertiary}>{symbols.arrowDown} </Text>
              {pulse.bottomSectors.map((s, i) => (
                <React.Fragment key={s.name}>
                  {i > 0 && <Text>  </Text>}
                  <Text color={s.changePercent >= 0 ? semantic.positive : semantic.negative}>
                    {s.name} {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(1)}%
                  </Text>
                </React.Fragment>
              ))}
            </PanelRow>
          )}
        </Section>
      )}

      {/* Top Movers */}
      {pulse.topMovers.length > 0 && (
        <Section title="Top Movers">
          {pulse.topMovers.slice(0, 5).map((m) => (
            <MoverRow
              key={m.symbol}
              symbol={m.symbol}
              name={m.name}
              changePercent={m.changePercent}
            />
          ))}
        </Section>
      )}

      {/* Top Headline */}
      {pulse.topHeadline && (
        <Section title="Headline">
          <PanelRow>
            <Text color={palette.text}>
              {pulse.topHeadline.length > 65 ? pulse.topHeadline.substring(0, 62) + '...' : pulse.topHeadline}
            </Text>
          </PanelRow>
        </Section>
      )}

      {/* AI Take */}
      {pulse.aiTake && (
        <Section title="AI Take">
          <PanelRow>
            <InkBox width={66}>
              <Text color={palette.text} wrap="wrap">{pulse.aiTake}</Text>
            </InkBox>
          </PanelRow>
        </Section>
      )}

      {/* Watchlist Snapshot */}
      {pulse.watchlistSnapshot.length > 0 && (
        <Section title="Your Watchlist">
          <PanelRow>
            {pulse.watchlistSnapshot.map((w, i) => (
              <React.Fragment key={w.symbol}>
                {i > 0 && <Text>   </Text>}
                <Text color={palette.text}>{w.symbol} </Text>
                <Text color={w.changePercent >= 0 ? semantic.positive : semantic.negative}>
                  {w.changePercent >= 0 ? symbols.arrowUp : symbols.arrowDown}
                  {Math.abs(w.changePercent).toFixed(1)}%
                </Text>
              </React.Fragment>
            ))}
          </PanelRow>
        </Section>
      )}

      {/* Alerts */}
      {pulse.alerts.length > 0 && (
        <Section title="Your Alerts">
          {pulse.alerts.slice(0, 4).map((alert, i) => (
            <AlertRow key={i} alert={alert} />
          ))}
          {pulse.alerts.length > 4 && (
            <PanelRow>
              <Text color={palette.textTertiary}>
                + {pulse.alerts.length - 4} more (pulse config to adjust)
              </Text>
            </PanelRow>
          )}
        </Section>
      )}
    </Panel>
  );
}

export default MarketPulseView;
