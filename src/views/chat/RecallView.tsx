/**
 * RecallView Component
 *
 * Displays conversation history, sessions, and tracked symbols.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ChatMessage, ChatSession, ConversationSymbol } from '../../db/memory.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';

type RecallMode = 'messages' | 'search' | 'symbols' | 'sessions';

export interface RecallViewProps {
  mode: RecallMode;
  messages?: ChatMessage[];
  sessions?: Array<ChatSession & { messageCount: number }>;
  symbols?: ConversationSymbol[];
  searchQuery?: string;
}

// Format date relative to now
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Truncate content with ellipsis
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

// Message row component
function MessageRow({ message }: { message: ChatMessage }): React.ReactElement {
  const isUser = message.role === 'user';
  const prefix = isUser ? 'You:' : 'AI:';
  const color = isUser ? palette.accent : palette.text;

  return (
    <PanelRow>
      <InkBox width={5}>
        <Text color={palette.textTertiary}>{prefix}</Text>
      </InkBox>
      <InkBox width={50}>
        <Text color={color}>{truncate(message.content, 48)}</Text>
      </InkBox>
      <Text color={palette.textTertiary}>{formatRelativeDate(message.createdAt)}</Text>
    </PanelRow>
  );
}

// Session row component
function SessionRow({ session }: { session: ChatSession & { messageCount: number } }): React.ReactElement {
  return (
    <PanelRow>
      <InkBox width={8}>
        <Text color={palette.textTertiary}>#{session.id}</Text>
      </InkBox>
      <InkBox width={15}>
        <Text color={palette.text}>{formatRelativeDate(session.lastActiveAt)}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={semantic.command}>{session.messageCount} msgs</Text>
      </InkBox>
      <Text color={palette.textTertiary}>
        {session.contextSummary ? truncate(session.contextSummary, 30) : 'No summary'}
      </Text>
    </PanelRow>
  );
}

// Symbol row component
function SymbolRow({ symbol }: { symbol: ConversationSymbol }): React.ReactElement {
  return (
    <PanelRow>
      <InkBox width={10}>
        <Text bold color={palette.text}>{symbol.symbol}</Text>
      </InkBox>
      <InkBox width={15}>
        <Text color={palette.textTertiary}>{formatRelativeDate(symbol.mentionedAt)}</Text>
      </InkBox>
      <Text color={palette.textSecondary}>
        {symbol.context ? truncate(symbol.context, 40) : '-'}
      </Text>
    </PanelRow>
  );
}

// Empty state
function EmptyState({ mode }: { mode: RecallMode }): React.ReactElement {
  const messages: Record<RecallMode, string> = {
    messages: 'No conversation history yet. Start chatting to build history.',
    search: 'No messages match your search.',
    symbols: 'No symbols tracked yet. Mention stock tickers in your conversations.',
    sessions: 'No sessions found.',
  };

  return (
    <Panel width={68} title="Recall">
      <PanelRow>
        <Text color={palette.info}>{messages[mode]}</Text>
      </PanelRow>
    </Panel>
  );
}

export function RecallView({
  mode,
  messages = [],
  sessions = [],
  symbols = [],
  searchQuery,
}: RecallViewProps): React.ReactElement {
  // Handle empty states
  if (mode === 'messages' && messages.length === 0) return <EmptyState mode={mode} />;
  if (mode === 'search' && messages.length === 0) return <EmptyState mode={mode} />;
  if (mode === 'symbols' && symbols.length === 0) return <EmptyState mode={mode} />;
  if (mode === 'sessions' && sessions.length === 0) return <EmptyState mode={mode} />;

  const title = mode === 'search'
    ? `Search: "${searchQuery}"`
    : mode === 'symbols'
      ? 'Tracked Symbols'
      : mode === 'sessions'
        ? 'Sessions'
        : 'Conversation History';

  return (
    <Panel width={68} title={title}>
      {/* Messages view */}
      {(mode === 'messages' || mode === 'search') && (
        <>
          <PanelRow>
            <InkBox width={5}>
              <Text color={palette.textTertiary}>Who</Text>
            </InkBox>
            <InkBox width={50}>
              <Text color={palette.textTertiary}>Message</Text>
            </InkBox>
            <Text color={palette.textTertiary}>When</Text>
          </PanelRow>
          {messages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))}
        </>
      )}

      {/* Sessions view */}
      {mode === 'sessions' && (
        <>
          <PanelRow>
            <InkBox width={8}>
              <Text color={palette.textTertiary}>ID</Text>
            </InkBox>
            <InkBox width={15}>
              <Text color={palette.textTertiary}>Last Active</Text>
            </InkBox>
            <InkBox width={12}>
              <Text color={palette.textTertiary}>Messages</Text>
            </InkBox>
            <Text color={palette.textTertiary}>Context</Text>
          </PanelRow>
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </>
      )}

      {/* Symbols view */}
      {mode === 'symbols' && (
        <>
          <PanelRow>
            <InkBox width={10}>
              <Text color={palette.textTertiary}>Symbol</Text>
            </InkBox>
            <InkBox width={15}>
              <Text color={palette.textTertiary}>Mentioned</Text>
            </InkBox>
            <Text color={palette.textTertiary}>Context</Text>
          </PanelRow>
          {symbols.map((sym) => (
            <SymbolRow key={sym.id} symbol={sym} />
          ))}
        </>
      )}

      {/* Footer with commands */}
      <Section>
        <PanelRow>
          <Text color={palette.textTertiary}>Commands:</Text>
        </PanelRow>
        <PanelRow>
          <InkBox marginLeft={2}>
            <Text color={semantic.command}>recall              </Text>
            <Text color={palette.textTertiary}>Recent messages</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox marginLeft={2}>
            <Text color={semantic.command}>recall search {'<q>'}  </Text>
            <Text color={palette.textTertiary}>Search messages</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox marginLeft={2}>
            <Text color={semantic.command}>recall symbols      </Text>
            <Text color={palette.textTertiary}>Tracked symbols</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox marginLeft={2}>
            <Text color={semantic.command}>recall sessions     </Text>
            <Text color={palette.textTertiary}>Session history</Text>
          </InkBox>
        </PanelRow>
      </Section>
    </Panel>
  );
}

export default RecallView;
