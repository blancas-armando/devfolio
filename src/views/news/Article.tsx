/**
 * Article Component
 *
 * Full article display with content, byline, and source.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { ArticleContent } from '../../services/market.js';
import { palette } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';

export interface ArticleProps {
  article: ArticleContent;
  url?: string;
}

// Wrap text to width
function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

export function ArticleView({ article, url }: ArticleProps): React.ReactElement {
  const width = 78;
  const contentWidth = width - 4;
  const line = borders.horizontal.repeat(width - 2);

  // Clean and format text content
  const cleanText = article.textContent
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Split into paragraphs and wrap each
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>

      {/* Title */}
      <InkBox paddingX={1}>
        <Text bold color={palette.text} wrap="wrap">{article.title}</Text>
      </InkBox>

      {/* Byline and source */}
      <InkBox paddingX={1}>
        {article.byline && (
          <Text color={palette.textSecondary}>{article.byline}</Text>
        )}
        {article.byline && article.siteName && (
          <Text color={palette.textTertiary}> {symbols.bullet} </Text>
        )}
        {article.siteName && (
          <Text color={palette.textTertiary}>{article.siteName}</Text>
        )}
      </InkBox>

      {/* Divider */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>

      {/* Excerpt (if different from first paragraph) */}
      {article.excerpt && !cleanText.startsWith(article.excerpt.substring(0, 50)) && (
        <InkBox paddingX={1} marginBottom={1}>
          <Text color={palette.textSecondary} italic wrap="wrap">{article.excerpt}</Text>
        </InkBox>
      )}

      {/* Content paragraphs */}
      <InkBox flexDirection="column" paddingX={1}>
        {paragraphs.slice(0, 15).map((para, i) => (
          <InkBox key={i} marginBottom={1}>
            <Text color={palette.text} wrap="wrap">{para}</Text>
          </InkBox>
        ))}
        {paragraphs.length > 15 && (
          <InkBox>
            <Text color={palette.textTertiary}>
              ... ({paragraphs.length - 15} more paragraphs)
            </Text>
          </InkBox>
        )}
      </InkBox>

      {/* URL */}
      {url && (
        <InkBox paddingX={1} marginTop={1}>
          <Text color={palette.textTertiary}>Source: </Text>
          <Text color={palette.info}>{url.length > 60 ? url.substring(0, 57) + '...' : url}</Text>
        </InkBox>
      )}

      {/* Footer */}
      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default ArticleView;
