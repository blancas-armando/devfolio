/**
 * HelpScreen Component
 *
 * Displays all available commands organized by category.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';

interface CommandSection {
  title: string;
  commands: { cmd: string; desc: string }[];
}

const sections: CommandSection[] = [
  {
    title: 'MARKET',
    commands: [
      { cmd: 'b, brief', desc: 'AI market analysis' },
      { cmd: 'pulse', desc: 'Market alerts & AI take' },
      { cmd: 'sc, screen <p>', desc: 'Stock screener (gainers, value...)' },
      { cmd: 'n, news [SYM]', desc: 'Market or stock news' },
      { cmd: 'read <N>', desc: 'Read article N' },
    ],
  },
  {
    title: 'STOCKS',
    commands: [
      { cmd: 's <SYM> [TF]', desc: 'Stock profile (s AAPL 1y)' },
      { cmd: 'r <SYM>', desc: 'AI research report' },
      { cmd: 'e <SYM>', desc: 'Earnings report' },
      { cmd: 'fin <SYM> [type]', desc: 'Financial statements' },
      { cmd: 'hist <SYM>', desc: 'Historical trends & milestones' },
      { cmd: 'why <SYM>', desc: 'Explain stock movement' },
      { cmd: 'cs <S1> <S2>...', desc: 'Compare stocks' },
    ],
  },
  {
    title: 'ETFs',
    commands: [
      { cmd: 'etf <SYM>', desc: 'ETF profile (etf VTI)' },
      { cmd: 'compare <S1> <S2>', desc: 'Compare ETFs' },
    ],
  },
  {
    title: 'SEC FILINGS',
    commands: [
      { cmd: 'filings <SYM>', desc: 'List 10-K, 10-Q, 8-K' },
      { cmd: 'filing <N>', desc: 'Read filing N' },
      { cmd: 'filings <SYM> cache', desc: 'Index filings for search' },
      { cmd: 'filings <SYM> search <q>', desc: 'Search cached filings' },
      { cmd: 'filings <SYM> risks', desc: 'Compare risk factors' },
    ],
  },
  {
    title: 'PORTFOLIO',
    commands: [
      { cmd: 'w, watchlist', desc: 'View watchlist + events' },
      { cmd: 'p, portfolio', desc: 'View portfolio' },
      { cmd: 'add <SYM>', desc: 'Add to watchlist' },
      { cmd: 'rm <SYM>', desc: 'Remove from watchlist' },
      { cmd: 'groups', desc: 'List saved comparison groups' },
      { cmd: 'group load <n>', desc: 'Load and compare a group' },
    ],
  },
  {
    title: 'OTHER',
    commands: [
      { cmd: 'preferences', desc: 'View learned preferences' },
      { cmd: 'prefs reset', desc: 'Clear all preferences' },
      { cmd: 'recall', desc: 'View conversation history' },
      { cmd: 'recall search <q>', desc: 'Search past messages' },
      { cmd: 'export <target>', desc: 'Export data (watchlist, portfolio...)' },
      { cmd: 'setup', desc: 'Show API key configuration help' },
      { cmd: 'alert webhook <cmd>', desc: 'Manage alert webhooks' },
      { cmd: 'history [N]', desc: 'Show command history' },
      { cmd: 'tutorial', desc: 'Interactive tutorial' },
      { cmd: 'clear, home', desc: 'Clear screen' },
      { cmd: '?, help', desc: 'Show this help' },
      { cmd: 'q, quit', desc: 'Exit' },
    ],
  },
];

function CommandRow({ cmd, desc }: { cmd: string; desc: string }): React.ReactElement {
  return (
    <InkBox>
      <Text color={palette.border}>{borders.vertical}</Text>
      <Text>  </Text>
      <InkBox width={20}>
        <Text color={semantic.command}>{cmd}</Text>
      </InkBox>
      <Text color={palette.textTertiary}>{desc}</Text>
    </InkBox>
  );
}

function SectionHeader({ title, isFirst }: { title: string; isFirst: boolean }): React.ReactElement {
  const width = 66;
  const line = borders.horizontal.repeat(width - 2);

  return (
    <InkBox flexDirection="column">
      <Text color={palette.border}>
        {isFirst ? borders.topLeft : borders.leftTee}
        {line}
        {isFirst ? borders.topRight : borders.rightTee}
      </Text>
      <InkBox>
        <Text color={palette.border}>{borders.vertical}</Text>
        <Text> </Text>
        <Text bold color={semantic.command}>{title}</Text>
      </InkBox>
    </InkBox>
  );
}

export function HelpScreen(): React.ReactElement {
  const width = 66;
  const line = borders.horizontal.repeat(width - 2);

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Title */}
      <InkBox>
        <Text color={palette.border}>{borders.topLeft}{line}{borders.topRight}</Text>
      </InkBox>
      <InkBox>
        <Text color={palette.border}>{borders.vertical}</Text>
        <Text> </Text>
        <Text bold color={palette.text}>DevFolio Commands</Text>
      </InkBox>

      {/* Sections */}
      {sections.map((section, i) => (
        <InkBox key={section.title} flexDirection="column">
          <Text color={palette.border}>
            {borders.leftTee}{line}{borders.rightTee}
          </Text>
          <InkBox>
            <Text color={palette.border}>{borders.vertical}</Text>
            <Text> </Text>
            <Text bold color={semantic.command}>{section.title}</Text>
          </InkBox>
          {section.commands.map((cmd) => (
            <CommandRow key={cmd.cmd} cmd={cmd.cmd} desc={cmd.desc} />
          ))}
        </InkBox>
      ))}

      {/* Bottom border */}
      <Text color={palette.border}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>

      {/* Tips */}
      <InkBox flexDirection="column" marginTop={1} marginLeft={2}>
        <Text bold color={palette.info}>Tips</Text>
        <Text color={palette.textTertiary}>- Press Tab for command/symbol completion</Text>
        <Text color={palette.textTertiary}>- Press Ctrl+C to cancel long operations</Text>
        <Text color={palette.textTertiary}>- Timeframes: 1d, 5d, 1m, 3m, 6m, 1y, 5y (e.g. s AAPL 1y)</Text>
        <Text color={palette.textTertiary}>- Use natural language: "tell me about Apple"</Text>
      </InkBox>
    </InkBox>
  );
}

export default HelpScreen;
