/**
 * News Display Functions
 * News feed, articles, and SEC filings
 */

import chalk from 'chalk';
import type { NewsArticle, ArticleContent } from '../../services/market.js';
import type { SECFiling, FilingSummary } from '../../services/sec.js';
import { generateFilingSummary } from '../../services/sec.js';
import { stripAnsi, wrapText, showSpinner, hyperlink } from '../ui.js';
import { setLastNewsArticles, setLastFilings } from '../state.js';
import { analyzeSentiment, getSentimentIndicator } from '../../utils/sentiment.js';

// ═══════════════════════════════════════════════════════════════════════════
// News Feed Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayNewsFeed(articles: NewsArticle[], forSymbols?: string[]): void {
  const width = 72;
  const innerWidth = width - 4;

  // Store articles for "read N" command
  setLastNewsArticles(articles.slice(0, 12));

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = forSymbols && forSymbols.length > 0
    ? `News: ${forSymbols.join(', ')}`
    : 'Market News';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));

  if (articles.length === 0) {
    const noNews = chalk.dim('No recent news available');
    console.log(chalk.cyan('│') + ' ' + noNews + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noNews).length)) + ' ' + chalk.cyan('│'));
  } else {
    articles.slice(0, 12).forEach((article, index) => {
      // Time ago
      const now = Date.now();
      const diffMs = now - article.publishedAt.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeAgo: string;
      if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }

      // Sentiment analysis
      const sentiment = analyzeSentiment(article.title);
      const sentimentIndicator = getSentimentIndicator(sentiment);
      const sentimentColor = sentiment === 'positive' ? chalk.green :
                             sentiment === 'negative' ? chalk.red : chalk.dim;

      // Article number with sentiment
      const numStr = chalk.cyan(`[${index + 1}]`);

      // Truncate title to fit (account for number prefix and sentiment indicator)
      const maxTitleLen = innerWidth - 8;
      const truncTitle = article.title.length > maxTitleLen
        ? article.title.slice(0, maxTitleLen - 3) + '...'
        : article.title;

      // Title line with number and sentiment
      const titleLine = `${numStr} ${sentimentColor(sentimentIndicator)} ${chalk.white(truncTitle)}`;
      const titleStripped = stripAnsi(titleLine);
      const titlePadding = Math.max(0, innerWidth - titleStripped.length);
      console.log(chalk.cyan('│') + ' ' + titleLine + ' '.repeat(titlePadding) + ' ' + chalk.cyan('│'));

      // Meta line (publisher + time + symbols)
      const symbolsStr = article.symbols.slice(0, 3).join(', ');
      const metaLine = `    ${chalk.dim(article.publisher)} · ${chalk.dim(timeAgo)}${symbolsStr ? ` · ${chalk.yellow(symbolsStr)}` : ''}`;
      const metaStripped = stripAnsi(metaLine);
      const metaPadding = Math.max(0, innerWidth - metaStripped.length);
      console.log(chalk.cyan('│') + ' ' + metaLine + ' '.repeat(metaPadding) + ' ' + chalk.cyan('│'));

      // Separator between articles (except last)
      if (index < Math.min(articles.length, 12) - 1) {
        console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));
      }
    });
  }

  // Footer with hint
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const hint = chalk.dim('Type "read N" to read article');
  console.log(chalk.cyan('│') + ' ' + hint + ' '.repeat(Math.max(0, innerWidth - stripAnsi(hint).length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Article Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayArticle(article: ArticleContent, source: string): void {
  const width = 76;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title (wrapped)
  const titleLines = wrapText(article.title, innerWidth);
  for (const line of titleLines) {
    const padding = Math.max(0, innerWidth - line.length);
    console.log(chalk.cyan('│') + ' ' + chalk.bold.white(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // Byline and source
  const byline = article.byline ? `By ${article.byline}` : '';
  const siteName = article.siteName || source;
  const metaLine = byline ? `${byline} · ${siteName}` : siteName;
  const metaPad = Math.max(0, innerWidth - metaLine.length);
  console.log(chalk.cyan('│') + ' ' + chalk.dim(metaLine) + ' '.repeat(metaPad) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╞' + '═'.repeat(width - 2) + '╡'));

  // Article content - clean and wrap
  const cleanText = article.textContent
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n')  // Keep paragraph breaks
    .trim();

  // Split into paragraphs and display
  const paragraphs = cleanText.split(/\n\n+/);
  let lineCount = 0;
  const maxLines = 60; // Limit to prevent overwhelming output

  for (const para of paragraphs) {
    if (lineCount >= maxLines) break;

    const lines = wrapText(para.trim(), innerWidth);
    for (const line of lines) {
      if (lineCount >= maxLines) break;

      const padding = Math.max(0, innerWidth - line.length);
      console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
      lineCount++;
    }

    // Empty line between paragraphs
    if (lineCount < maxLines) {
      console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));
      lineCount++;
    }
  }

  // If we hit the limit, show truncation message
  if (lineCount >= maxLines) {
    console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
    const truncMsg = chalk.dim('(Article truncated - showing first ~60 lines)');
    console.log(chalk.cyan('│') + ' ' + truncMsg + ' '.repeat(Math.max(0, innerWidth - stripAnsi(truncMsg).length)) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// SEC Filings Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayFilings(filings: SECFiling[], symbol: string): void {
  const width = 74;
  const innerWidth = width - 4;

  // Store filings for "filing N" command
  setLastFilings(filings.slice(0, 15), symbol.toUpperCase());

  console.log('');
  console.log(chalk.magenta('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = `SEC Filings: ${symbol.toUpperCase()}`;
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.magenta('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.magenta('│'));
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  if (filings.length === 0) {
    const noFilings = chalk.dim('No recent filings found');
    console.log(chalk.magenta('│') + ' ' + noFilings + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noFilings).length)) + ' ' + chalk.magenta('│'));
  } else {
    filings.slice(0, 15).forEach((filing, index) => {
      // Form type with color coding
      const formColor = filing.form === '10-K' ? chalk.cyan :
                        filing.form === '10-Q' ? chalk.blue :
                        filing.form === '8-K' ? chalk.yellow : chalk.white;

      // Filing number
      const numStr = chalk.magenta(`[${(index + 1).toString().padStart(2)}]`);

      // Form and date
      const formStr = formColor(filing.form.padEnd(6));
      const dateStr = chalk.dim(filing.filingDate);

      // Description (truncated)
      const maxDescLen = innerWidth - 22;
      const desc = filing.description.length > maxDescLen
        ? filing.description.slice(0, maxDescLen - 3) + '...'
        : filing.description;

      const line = `${numStr} ${formStr} ${dateStr}  ${chalk.white(desc)}`;
      const lineStripped = stripAnsi(line);
      const linePadding = Math.max(0, innerWidth - lineStripped.length);
      console.log(chalk.magenta('│') + ' ' + line + ' '.repeat(linePadding) + ' ' + chalk.magenta('│'));
    });
  }

  // Footer with hint
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
  const hint = chalk.dim('Type "filing N" to read filing (e.g., filing 1)');
  console.log(chalk.magenta('│') + ' ' + hint + ' '.repeat(Math.max(0, innerWidth - stripAnsi(hint).length)) + ' ' + chalk.magenta('│'));

  console.log(chalk.magenta('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

export async function displayFiling(filing: SECFiling, symbol: string): Promise<void> {
  const width = 78;
  const innerWidth = width - 4;

  // Show loading spinner while generating AI summary
  const stopSpinner = showSpinner('Analyzing filing...');

  const summary = await generateFilingSummary(filing, symbol);

  stopSpinner();

  console.log('');
  console.log(chalk.magenta('╭' + '─'.repeat(width - 2) + '╮'));

  // Header
  const formColor = filing.form === '10-K' ? chalk.cyan :
                    filing.form === '10-Q' ? chalk.blue :
                    filing.form === '8-K' ? chalk.yellow : chalk.white;

  const title = `${symbol.toUpperCase()} - ${formColor(filing.form)}`;
  const titleStripped = stripAnsi(title);
  const titlePad = Math.max(0, innerWidth - titleStripped.length);
  console.log(chalk.magenta('│') + ' ' + chalk.bold.white(symbol.toUpperCase()) + ' - ' + formColor(filing.form) + ' '.repeat(titlePad) + ' ' + chalk.magenta('│'));

  // Filing meta
  const meta = `Filed: ${filing.filingDate} | Report Date: ${filing.reportDate}`;
  console.log(chalk.magenta('│') + ' ' + chalk.dim(meta) + ' '.repeat(Math.max(0, innerWidth - meta.length)) + ' ' + chalk.magenta('│'));

  // Sentiment badge
  if (summary) {
    const sentimentColor = summary.sentiment === 'positive' ? chalk.green :
                           summary.sentiment === 'negative' ? chalk.red :
                           summary.sentiment === 'mixed' ? chalk.yellow : chalk.dim;
    const sentimentIcon = summary.sentiment === 'positive' ? '+' :
                          summary.sentiment === 'negative' ? '-' :
                          summary.sentiment === 'mixed' ? '~' : '=';
    const sentimentLine = sentimentColor(`[${sentimentIcon}] ${summary.sentiment.toUpperCase()}`);
    const sentimentStripped = stripAnsi(sentimentLine);
    console.log(chalk.magenta('│') + ' ' + sentimentLine + ' '.repeat(Math.max(0, innerWidth - sentimentStripped.length)) + ' ' + chalk.magenta('│'));
  }

  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));

  if (!summary) {
    // Error case - couldn't generate summary
    const errorMsg = chalk.red('Could not generate summary. Check your API key.');
    console.log(chalk.magenta('│') + ' ' + errorMsg + ' '.repeat(Math.max(0, innerWidth - stripAnsi(errorMsg).length)) + ' ' + chalk.magenta('│'));
  } else {
    // AI Summary Section
    const summaryLabel = chalk.bold.yellow('Summary');
    console.log(chalk.magenta('│') + ' ' + summaryLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(summaryLabel).length)) + ' ' + chalk.magenta('│'));

    const summaryLines = wrapText(summary.summary, innerWidth - 2);
    for (const line of summaryLines) {
      console.log(chalk.magenta('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.magenta('│'));
    }

    console.log(chalk.magenta('│') + ' '.repeat(innerWidth) + ' ' + chalk.magenta('│'));

    // Key Points Section
    if (summary.keyPoints.length > 0) {
      console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
      const keyLabel = chalk.bold.yellow('Key Points');
      console.log(chalk.magenta('│') + ' ' + keyLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(keyLabel).length)) + ' ' + chalk.magenta('│'));

      for (const point of summary.keyPoints.slice(0, 5)) {
        const pointLines = wrapText(`- ${point}`, innerWidth - 2);
        for (const line of pointLines) {
          console.log(chalk.magenta('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.magenta('│'));
        }
      }
    }

    // Material Events (for 8-K)
    if (summary.materialEvents && summary.materialEvents.length > 0) {
      console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
      const eventsLabel = chalk.bold.yellow('Material Events');
      console.log(chalk.magenta('│') + ' ' + eventsLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(eventsLabel).length)) + ' ' + chalk.magenta('│'));

      for (const event of summary.materialEvents.slice(0, 5)) {
        const eventLines = wrapText(`- ${event}`, innerWidth - 2);
        for (const line of eventLines) {
          console.log(chalk.magenta('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.magenta('│'));
        }
      }
    }

    // Sentiment Reason
    if (summary.sentimentReason) {
      console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
      const reasonLabel = chalk.bold.yellow('Investor Impact');
      console.log(chalk.magenta('│') + ' ' + reasonLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(reasonLabel).length)) + ' ' + chalk.magenta('│'));

      const reasonLines = wrapText(summary.sentimentReason, innerWidth - 2);
      for (const line of reasonLines) {
        console.log(chalk.magenta('│') + ' ' + chalk.dim(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.magenta('│'));
      }
    }
  }

  // Footer with clickable link to full document
  console.log(chalk.magenta('├' + '─'.repeat(width - 2) + '┤'));
  const linkLabel = chalk.bold('View Full Filing:');
  console.log(chalk.magenta('│') + ' ' + linkLabel + ' '.repeat(Math.max(0, innerWidth - stripAnsi(linkLabel).length)) + ' ' + chalk.magenta('│'));

  // Show clickable hyperlink (truncated display, full URL in link)
  const displayUrl = filing.fileUrl.length > innerWidth - 4
    ? filing.fileUrl.slice(0, innerWidth - 7) + '...'
    : filing.fileUrl;
  const linkLine = hyperlink(filing.fileUrl, displayUrl);
  console.log(chalk.magenta('│') + ' ' + linkLine + ' '.repeat(Math.max(0, innerWidth - displayUrl.length)) + ' ' + chalk.magenta('│'));

  console.log(chalk.magenta('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}
