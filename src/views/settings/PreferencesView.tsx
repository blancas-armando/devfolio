/**
 * PreferencesView Component
 *
 * Displays and manages learned user preferences.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { UserPreference } from '../../db/preferences.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';

export interface PreferencesViewProps {
  preferences: UserPreference[];
  mode?: 'view' | 'reset' | 'reset-key';
  resetKey?: string;
  resetCount?: number;
}

// Humanize preference key
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Render confidence bar
function ConfidenceBar({ confidence }: { confidence: number }): React.ReactElement {
  const filled = Math.round(confidence * 10);
  const empty = 10 - filled;
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  const color = confidence >= 0.7 ? semantic.positive : confidence >= 0.4 ? semantic.warning : palette.textTertiary;

  return (
    <Text color={color}>{bar} {Math.round(confidence * 100)}%</Text>
  );
}

// Preference row component
function PreferenceRow({ pref }: { pref: UserPreference }): React.ReactElement {
  const lastUpdated = pref.lastUpdated.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <PanelRow>
      <InkBox width={20}>
        <Text color={palette.text}>{formatKey(pref.key)}</Text>
      </InkBox>
      <InkBox width={16}>
        <Text color={semantic.command}>{pref.value}</Text>
      </InkBox>
      <InkBox width={18}>
        <ConfidenceBar confidence={pref.confidence} />
      </InkBox>
      <Text color={palette.textTertiary}>{lastUpdated}</Text>
    </PanelRow>
  );
}

// Empty state component
function EmptyPreferences(): React.ReactElement {
  return (
    <Panel width={68} title="Learned Preferences">
      <PanelRow>
        <Text color={palette.info}>No preferences learned yet</Text>
      </PanelRow>
      <PanelRow><Text> </Text></PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>
          DevFolio learns your preferences from conversations.
        </Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>
          Try chatting about your investment style, risk tolerance,
        </Text>
      </PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>
          or sectors you're interested in.
        </Text>
      </PanelRow>
      <PanelRow><Text> </Text></PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>Examples:</Text>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={palette.textSecondary}>"I prefer conservative, dividend-focused investments"</Text>
        </InkBox>
      </PanelRow>
      <PanelRow>
        <InkBox marginLeft={2}>
          <Text color={palette.textSecondary}>"I'm interested in tech and healthcare stocks"</Text>
        </InkBox>
      </PanelRow>
    </Panel>
  );
}

// Reset confirmation view
function ResetConfirmation({ count, key }: { count: number; key?: string }): React.ReactElement {
  return (
    <Panel width={50} title="Preferences Reset">
      <PanelRow>
        <Text color={semantic.positive}>
          {key ? `Cleared "${formatKey(key)}" preference` : `Cleared ${count} preference${count !== 1 ? 's' : ''}`}
        </Text>
      </PanelRow>
      <PanelRow><Text> </Text></PanelRow>
      <PanelRow>
        <Text color={palette.textTertiary}>
          DevFolio will learn new preferences from your conversations.
        </Text>
      </PanelRow>
    </Panel>
  );
}

export function PreferencesView({
  preferences,
  mode = 'view',
  resetKey,
  resetCount = 0,
}: PreferencesViewProps): React.ReactElement {
  // Show reset confirmation
  if (mode === 'reset' || mode === 'reset-key') {
    return <ResetConfirmation count={resetCount} key={resetKey} />;
  }

  // Show empty state
  if (preferences.length === 0) {
    return <EmptyPreferences />;
  }

  return (
    <Panel width={68} title="Learned Preferences">
      {/* Column headers */}
      <PanelRow>
        <InkBox width={20}>
          <Text color={palette.textTertiary}>Preference</Text>
        </InkBox>
        <InkBox width={16}>
          <Text color={palette.textTertiary}>Value</Text>
        </InkBox>
        <InkBox width={18}>
          <Text color={palette.textTertiary}>Confidence</Text>
        </InkBox>
        <Text color={palette.textTertiary}>Updated</Text>
      </PanelRow>

      {/* Preference rows */}
      {preferences.map((pref) => (
        <PreferenceRow key={pref.key} pref={pref} />
      ))}

      {/* Footer with commands */}
      <Section>
        <PanelRow>
          <Text color={palette.textTertiary}>Commands:</Text>
        </PanelRow>
        <PanelRow>
          <InkBox marginLeft={2}>
            <Text color={semantic.command}>preferences reset         </Text>
            <Text color={palette.textTertiary}>Clear all preferences</Text>
          </InkBox>
        </PanelRow>
        <PanelRow>
          <InkBox marginLeft={2}>
            <Text color={semantic.command}>preferences reset {'<key>'} </Text>
            <Text color={palette.textTertiary}>Clear specific preference</Text>
          </InkBox>
        </PanelRow>
      </Section>
    </Panel>
  );
}

export default PreferencesView;
