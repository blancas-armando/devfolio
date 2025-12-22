/**
 * NewsFeed Component
 *
 * Displays a list of news articles with sentiment indicators.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { NewsArticle } from '../../services/market.js';
import { Panel, PanelRow, Section } from '../../components/core/Panel/index.js';
import { palette, semantic } from '../../design/tokens.js';
import { symbols } from '../../design/symbols.js';
import { analyzeSentiment, getSentimentIndicator } from '../../utils/sentiment.js';

export interface NewsFeedProps {
  articles: NewsArticle[];
  symbols?: string[];
  maxArticles?: number;
}

// Format time ago
function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

// News article row component
function NewsArticleRow({
  article,
  index,
}: {
  article: NewsArticle;
  index: number;
}): React.ReactElement {
  const sentiment = analyzeSentiment(article.title);
  const sentimentIndicator = getSentimentIndicator(sentiment);
  const timeAgo = formatTimeAgo(article.publishedAt);

  const sentimentColor = sentiment === 'positive'
    ? semantic.positive
    : sentiment === 'negative'
      ? semantic.negative
      : palette.textTertiary;

  // Truncate title
  const maxTitleLen = 58;
  const truncTitle = article.title.length > maxTitleLen
    ? article.title.slice(0, maxTitleLen - 3) + '...'
    : article.title;

  const symbolsStr = article.symbols.slice(0, 3).join(', ');

  return (
    <>
      {/* Title line */}
      <PanelRow>
        <Text color={palette.info}>[{index + 1}]</Text>
        <Text> </Text>
        <Text color={sentimentColor}>{sentimentIndicator}</Text>
        <Text> </Text>
        <Text color={palette.text}>{truncTitle}</Text>
      </PanelRow>

      {/* Meta line */}
      <PanelRow>
        <InkBox marginLeft={4}>
          <Text color={palette.textTertiary}>{article.publisher}</Text>
          <Text color={palette.textTertiary}> {symbols.bullet} </Text>
          <Text color={palette.textTertiary}>{timeAgo}</Text>
          {symbolsStr && (
            <>
              <Text color={palette.textTertiary}> {symbols.bullet} </Text>
              <Text color={semantic.command}>{symbolsStr}</Text>
            </>
          )}
        </InkBox>
      </PanelRow>
    </>
  );
}

export function NewsFeed({
  articles,
  symbols: forSymbols,
  maxArticles = 12,
}: NewsFeedProps): React.ReactElement {
  const displayArticles = articles.slice(0, maxArticles);

  const title = forSymbols && forSymbols.length > 0
    ? `News: ${forSymbols.join(', ')}`
    : 'Market News';

  return (
    <Panel width={72} title={title}>
      {/* Articles */}
      {displayArticles.length === 0 ? (
        <PanelRow>
          <Text color={palette.textTertiary}>No recent news available</Text>
        </PanelRow>
      ) : (
        <>
          {displayArticles.map((article, index) => (
            <React.Fragment key={article.link}>
              <NewsArticleRow article={article} index={index} />
              {index < displayArticles.length - 1 && <PanelRow><Text> </Text></PanelRow>}
            </React.Fragment>
          ))}
        </>
      )}

      {/* Footer */}
      <Section>
        <PanelRow>
          <Text color={palette.textTertiary}>Type "read N" to read article</Text>
        </PanelRow>
      </Section>
    </Panel>
  );
}

export default NewsFeed;
