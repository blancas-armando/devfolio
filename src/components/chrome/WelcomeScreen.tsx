/**
 * WelcomeScreen Component
 *
 * Branded welcome screen with ASCII logo
 * and getting started tips.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { logoLines, logoCompactLines, tagline, decorative } from '../../design/ascii-logo.js';
import { palette } from '../../design/tokens.js';
import { width as widthConstants } from '../../design/spacing.js';

export interface WelcomeScreenProps {
  /** Use compact logo for smaller terminals */
  compact?: boolean;
  /** Show tips */
  showTips?: boolean;
  /** Version string */
  version?: string;
}

export function WelcomeScreen({
  compact = false,
  showTips = true,
  version,
}: WelcomeScreenProps): React.ReactElement {
  const logo = compact ? logoCompactLines : logoLines;

  return (
    <InkBox flexDirection="column" alignItems="center" marginTop={1}>
      {/* ASCII Logo */}
      <InkBox flexDirection="column" alignItems="center">
        {logo.map((line, i) => (
          <Text key={i} color={palette.accent}>{line}</Text>
        ))}
      </InkBox>

      {/* Tagline */}
      <InkBox marginTop={1}>
        <Text color={palette.textSecondary}>{tagline}</Text>
      </InkBox>

      {/* Version */}
      {version && (
        <InkBox marginTop={1}>
          <Text color={palette.textMuted}>v{version}</Text>
        </InkBox>
      )}

      {/* Tips */}
      {showTips && (
        <InkBox flexDirection="column" marginTop={2} marginBottom={1}>
          <Text color={palette.textSecondary}>Tips for getting started:</Text>
          <InkBox flexDirection="column" marginTop={1} marginLeft={2}>
            <TipItem number={1}>
              Type <Cmd>brief</Cmd> for today's market summary
            </TipItem>
            <TipItem number={2}>
              Type <Cmd>s AAPL</Cmd> to look up a stock
            </TipItem>
            <TipItem number={3}>
              Ask anything about markets in natural language
            </TipItem>
            <TipItem number={4}>
              <Cmd>help</Cmd> for all commands
            </TipItem>
          </InkBox>
        </InkBox>
      )}
    </InkBox>
  );
}

// Tip item component
interface TipItemProps {
  number: number;
  children: React.ReactNode;
}

function TipItem({ number, children }: TipItemProps): React.ReactElement {
  return (
    <InkBox>
      <Text color={palette.textTertiary}>{number}. </Text>
      <Text color={palette.textSecondary}>{children}</Text>
    </InkBox>
  );
}

// Command highlight
interface CmdProps {
  children: React.ReactNode;
}

function Cmd({ children }: CmdProps): React.ReactElement {
  return <Text color={palette.accent}>{children}</Text>;
}

// Minimal welcome (just logo and version)
export interface MinimalWelcomeProps {
  version?: string;
}

export function MinimalWelcome({
  version,
}: MinimalWelcomeProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" alignItems="center" marginTop={1} marginBottom={1}>
      <Text color={palette.accent} bold>DevFolio</Text>
      {version && (
        <Text color={palette.textMuted}>v{version}</Text>
      )}
    </InkBox>
  );
}

// Header banner (for top of app)
export interface HeaderBannerProps {
  title?: string;
  subtitle?: string;
}

export function HeaderBanner({
  title = 'DevFolio',
  subtitle,
}: HeaderBannerProps): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginBottom={1}>
      <Text color={palette.accent} bold>{title}</Text>
      {subtitle && (
        <Text color={palette.textTertiary}>{subtitle}</Text>
      )}
    </InkBox>
  );
}

// Quick start card
export function QuickStartCard(): React.ReactElement {
  return (
    <InkBox flexDirection="column" marginTop={1} marginBottom={1}>
      <Text color={palette.textSecondary} bold>Quick Start</Text>
      <InkBox flexDirection="column" marginTop={1} marginLeft={2}>
        <QuickCommand cmd="brief" desc="Daily market summary" />
        <QuickCommand cmd="s AAPL" desc="Stock profile" />
        <QuickCommand cmd="pulse" desc="What's moving now" />
        <QuickCommand cmd="watchlist" desc="Your watchlist" />
      </InkBox>
    </InkBox>
  );
}

interface QuickCommandProps {
  cmd: string;
  desc: string;
}

function QuickCommand({ cmd, desc }: QuickCommandProps): React.ReactElement {
  return (
    <InkBox>
      <Text color={palette.accent}>{cmd.padEnd(12)}</Text>
      <Text color={palette.textTertiary}>{desc}</Text>
    </InkBox>
  );
}
