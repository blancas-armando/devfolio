/**
 * NewsFeed Component
 *
 * Displays a list of news articles with sentiment indicators.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { NewsArticle } from '../../services/market.js';
import { palette, semantic } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
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
  const maxTitleLen = 60;
  const truncTitle = article.title.length > maxTitleLen
    ? article.title.slice(0, maxTitleLen - 3) + '...'
    : article.title;

  const symbolsStr = article.symbols.slice(0, 3).join(', ');

  return (
    <InkBox flexDirection="column">
      {/* Title line */}
      <InkBox>
        <Text color={palette.info}>[{index + 1}]</Text>
        <Text> </Text>
        <Text color={sentimentColor}>{sentimentIndicator}</Text>
        <Text> </Text>
        <Text color={palette.text}>{truncTitle}</Text>
      </InkBox>

      {/* Meta line */}
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
    </InkBox>
  );
}

export function NewsFeed({
  articles,
  symbols: forSymbols,
  maxArticles = 12,
}: NewsFeedProps): React.ReactElement {
  const width = 72;
  const line = borders.horizontal.repeat(width - 2);
  const displayArticles = articles.slice(0, maxArticles);

  const title = forSymbols && forSymbols.length > 0
    ? `News: ${forSymbols.join(', ')}`
    : 'Market News';

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox>
        <Text color={palette.info}>{borders.vertical} </Text>
        <Text bold color={palette.text}>{title}</Text>
      </InkBox>
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>

      {/* Articles */}
      {displayArticles.length === 0 ? (
        <InkBox paddingX={2}>
          <Text color={palette.textTertiary}>No recent news available</Text>
        </InkBox>
      ) : (
        <InkBox flexDirection="column" paddingX={1}>
          {displayArticles.map((article, index) => (
            <InkBox key={article.link} flexDirection="column" marginBottom={index < displayArticles.length - 1 ? 1 : 0}>
              <NewsArticleRow article={article} index={index} />
            </InkBox>
          ))}
        </InkBox>
      )}

      {/* Footer */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox>
        <Text color={palette.info}>{borders.vertical} </Text>
        <Text color={palette.textTertiary}>Type "read N" to read article</Text>
      </InkBox>
      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default NewsFeed;
