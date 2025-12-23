/**
 * EmptyState Component
 *
 * Unified empty state displays with icons,
 * messages, and actionable suggestions.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette, semantic } from '../../design/tokens.js';
import { borders, drawTop, drawBottom } from '../../design/borders.js';
import { status, bullets } from '../../design/symbols.js';
import type { IconName, ActionItem } from '../../design/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Icon Definitions
// ═══════════════════════════════════════════════════════════════════════════

const ICONS: Record<IconName, string[]> = {
  empty: [
    '    ___    ',
    '   /   \\   ',
    '  |     |  ',
    '   \\___/   ',
    '     |     ',
  ],
  search: [
    '   ____   ',
    '  /    \\  ',
    ' |      | ',
    '  \\____/  ',
    '      \\   ',
  ],
  error: [
    '    /\\    ',
    '   /  \\   ',
    '  /    \\  ',
    ' /  !!  \\ ',
    '/________\\',
  ],
  warning: [
    '    /\\    ',
    '   /  \\   ',
    '  /  ! \\  ',
    ' /______\\ ',
    '',
  ],
  info: [
    '   ____   ',
    '  /    \\  ',
    ' |  ()  | ',
    ' |  ||  | ',
    '  \\____/  ',
  ],
  success: [
    '   ____   ',
    '  /    \\  ',
    ' |  \\/  | ',
    ' |      | ',
    '  \\____/  ',
  ],
  folder: [
    '  _______ ',
    ' /       |',
    '|________|',
    '|________|',
    '',
  ],
  chart: [
    '|       __|',
    '|    __|  |',
    '| __|  |  |',
    '|_|__|__|_|',
    '',
  ],
  list: [
    '  --------',
    '  --------',
    '  --------',
    '  --------',
    '',
  ],
  settings: [
    '    __    ',
    '  _/  \\_  ',
    ' |  ..  | ',
    '  \\_  _/  ',
    '    --    ',
  ],
  none: ['', '', '', '', ''],
};

// ═══════════════════════════════════════════════════════════════════════════
// EmptyState Component
// ═══════════════════════════════════════════════════════════════════════════

export interface EmptyStateProps {
  /** Title message */
  title: string;
  /** Optional description text */
  description?: string;
  /** Icon to display */
  icon?: IconName;
  /** Suggested actions */
  actions?: ActionItem[];
  /** Compact mode (smaller padding) */
  compact?: boolean;
  /** Component width */
  width?: number;
  /** Show border around component */
  bordered?: boolean;
}

export function EmptyState({
  title,
  description,
  icon = 'empty',
  actions = [],
  compact = false,
  width = 60,
  bordered = false,
}: EmptyStateProps): React.ReactElement {
  const iconLines = ICONS[icon];
  const showIcon = icon !== 'none' && !compact;
  const paddingY = compact ? 0 : 1;

  const content = (
    <InkBox flexDirection="column" alignItems="center" paddingY={paddingY}>
      {/* Icon */}
      {showIcon && (
        <InkBox flexDirection="column" alignItems="center" marginBottom={1}>
          {iconLines.map((line, i) => (
            <Text key={i} color={palette.textMuted} dimColor>
              {line}
            </Text>
          ))}
        </InkBox>
      )}

      {/* Title */}
      <Text color={palette.text}>{title}</Text>

      {/* Description */}
      {description && (
        <InkBox marginTop={compact ? 0 : 1}>
          <Text color={palette.textSecondary}>{description}</Text>
        </InkBox>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <InkBox flexDirection="column" marginTop={1} alignItems="center">
          {actions.map((action, i) => (
            <InkBox key={i}>
              <Text color={palette.textMuted}>{bullets.bullet} </Text>
              <Text color={action.primary ? semantic.command : palette.textSecondary}>
                {action.command || action.label}
              </Text>
              {action.description && (
                <Text color={palette.textTertiary}> - {action.description}</Text>
              )}
            </InkBox>
          ))}
        </InkBox>
      )}
    </InkBox>
  );

  if (bordered) {
    return (
      <InkBox flexDirection="column">
        <Text color={palette.border}>{drawTop(width)}</Text>
        <InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
          <InkBox width={width - 2} justifyContent="center">
            {content}
          </InkBox>
          <Text color={palette.border}>{borders.vertical}</Text>
        </InkBox>
        <Text color={palette.border}>{drawBottom(width)}</Text>
      </InkBox>
    );
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// EmptyState Presets
// ═══════════════════════════════════════════════════════════════════════════

export const emptyStatePresets = {
  /** Empty watchlist */
  watchlist: (compact = false): EmptyStateProps => ({
    title: 'Your watchlist is empty',
    description: 'Start tracking stocks to see them here',
    icon: 'list',
    compact,
    actions: [
      { label: 'Add a stock', command: 'add AAPL', primary: true },
      { label: 'Browse stocks', command: 'screen gainers' },
    ],
  }),

  /** Empty portfolio */
  portfolio: (compact = false): EmptyStateProps => ({
    title: 'Your portfolio is empty',
    description: 'Add positions to track your investments',
    icon: 'chart',
    compact,
    actions: [
      { label: 'Add position', command: 'add AAPL 10 150.00', primary: true },
    ],
  }),

  /** No search results */
  searchNoResults: (query: string, compact = false): EmptyStateProps => ({
    title: `No results for "${query}"`,
    description: 'Try a different search term or check spelling',
    icon: 'search',
    compact,
    actions: [
      { label: 'Clear search', command: 'clear' },
    ],
  }),

  /** No news available */
  noNews: (symbol?: string, compact = false): EmptyStateProps => ({
    title: symbol ? `No recent news for ${symbol}` : 'No news available',
    description: 'Check back later for updates',
    icon: 'empty',
    compact,
  }),

  /** No filings available */
  noFilings: (symbol: string, compact = false): EmptyStateProps => ({
    title: `No SEC filings found for ${symbol}`,
    description: 'This may be a non-US stock or recently listed company',
    icon: 'folder',
    compact,
  }),

  /** Error loading data */
  loadError: (entityName = 'data', compact = false): EmptyStateProps => ({
    title: `Unable to load ${entityName}`,
    description: 'Please check your connection and try again',
    icon: 'error',
    compact,
    actions: [
      { label: 'Retry', command: 'retry', primary: true },
    ],
  }),

  /** Feature not available */
  notAvailable: (feature: string, compact = false): EmptyStateProps => ({
    title: `${feature} is not available`,
    description: 'This feature may require additional configuration',
    icon: 'warning',
    compact,
    actions: [
      { label: 'See setup', command: 'setup' },
    ],
  }),

  /** Coming soon placeholder */
  comingSoon: (feature: string, compact = false): EmptyStateProps => ({
    title: `${feature} coming soon`,
    description: 'This feature is under development',
    icon: 'settings',
    compact,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Components
// ═══════════════════════════════════════════════════════════════════════════

/** Pre-configured empty watchlist component */
export function EmptyWatchlist({ compact = false }: { compact?: boolean }): React.ReactElement {
  return <EmptyState {...emptyStatePresets.watchlist(compact)} />;
}

/** Pre-configured empty portfolio component */
export function EmptyPortfolio({ compact = false }: { compact?: boolean }): React.ReactElement {
  return <EmptyState {...emptyStatePresets.portfolio(compact)} />;
}

/** Pre-configured no search results component */
export function NoSearchResults({
  query,
  compact = false,
}: {
  query: string;
  compact?: boolean;
}): React.ReactElement {
  return <EmptyState {...emptyStatePresets.searchNoResults(query, compact)} />;
}

/** Pre-configured load error component */
export function LoadError({
  entityName = 'data',
  compact = false,
  onRetry,
}: {
  entityName?: string;
  compact?: boolean;
  onRetry?: () => void;
}): React.ReactElement {
  const props = emptyStatePresets.loadError(entityName, compact);
  return <EmptyState {...props} />;
}
