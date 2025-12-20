/**
 * Market Display Functions
 * Market brief, overview, and calendar displays
 */

import chalk from 'chalk';
import type { MarketOverview, EventsCalendar } from '../../services/market.js';
import type { MarketBrief } from '../../services/brief.js';
import { stripAnsi, wrapText } from '../ui.js';

// ═══════════════════════════════════════════════════════════════════════════
// Market Overview Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayMarketOverview(overview: MarketOverview): void {
  const width = 72;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = 'Market Overview';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));

  // Indices section
  console.log(chalk.cyan('├─') + chalk.cyan(' Indices ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));

  for (const idx of overview.indices) {
    const arrow = idx.changePercent >= 0 ? '▲' : '▼';
    const color = idx.changePercent >= 0 ? chalk.green : chalk.red;
    const priceStr = idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const changeStr = color(`${arrow} ${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%`);
    const line = `${chalk.white(idx.name.padEnd(14))} ${priceStr.padStart(12)}  ${changeStr}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // VIX
  if (overview.vix !== null) {
    const vixColor = overview.vix > 20 ? chalk.red : overview.vix > 15 ? chalk.yellow : chalk.green;
    const vixLabel = overview.vix > 25 ? '(High Fear)' : overview.vix > 20 ? '(Elevated)' : overview.vix > 15 ? '(Normal)' : '(Low)';
    const vixLine = `${chalk.white('VIX'.padEnd(14))} ${overview.vix.toFixed(2).padStart(12)}  ${vixColor(vixLabel)}`;
    const vixStripped = stripAnsi(vixLine);
    const vixPad = Math.max(0, innerWidth - vixStripped.length);
    console.log(chalk.cyan('│') + ' ' + vixLine + ' '.repeat(vixPad) + ' ' + chalk.cyan('│'));
  }

  // Sector performance
  console.log(chalk.cyan('├─') + chalk.cyan(' Sector Performance ') + chalk.cyan('─'.repeat(Math.max(0, width - 24))) + chalk.cyan('┤'));

  for (const sector of overview.sectors.slice(0, 6)) {
    const pct = sector.changePercent;
    const color = pct >= 0 ? chalk.green : chalk.red;
    const pctStr = color(`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`);

    // Create a mini bar chart
    const barWidth = 30;
    const maxPct = Math.max(...overview.sectors.map(s => Math.abs(s.changePercent)), 1);
    const barLen = Math.round((Math.abs(pct) / maxPct) * barWidth);
    const bar = pct >= 0
      ? chalk.green('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen))
      : chalk.red('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen));

    const line = `${sector.name.padEnd(16)} ${bar} ${pctStr.padStart(8)}`;
    const stripped = stripAnsi(line);
    const padding = Math.max(0, innerWidth - stripped.length);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
  }

  // Top Movers
  console.log(chalk.cyan('├─') + chalk.cyan(' Top Movers ') + chalk.cyan('─'.repeat(Math.max(0, width - 16))) + chalk.cyan('┤'));

  // Gainers row
  const gainerStrs = overview.gainers.slice(0, 4).map(g =>
    chalk.green(`${g.symbol} +${g.changePercent.toFixed(1)}%`)
  );
  const gainerLine = `${chalk.dim('▲')} ${gainerStrs.join('  ')}`;
  const gainerStripped = stripAnsi(gainerLine);
  const gainerPad = Math.max(0, innerWidth - gainerStripped.length);
  console.log(chalk.cyan('│') + ' ' + gainerLine + ' '.repeat(gainerPad) + ' ' + chalk.cyan('│'));

  // Losers row
  const loserStrs = overview.losers.slice(0, 4).map(l =>
    chalk.red(`${l.symbol} ${l.changePercent.toFixed(1)}%`)
  );
  const loserLine = `${chalk.dim('▼')} ${loserStrs.join('  ')}`;
  const loserStripped = stripAnsi(loserLine);
  const loserPad = Math.max(0, innerWidth - loserStripped.length);
  console.log(chalk.cyan('│') + ' ' + loserLine + ' '.repeat(loserPad) + ' ' + chalk.cyan('│'));

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const asOfStr = `As of ${overview.asOfDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(Math.max(0, innerWidth - asOfStr.length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Events Calendar Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayEventsCalendar(calendar: EventsCalendar): void {
  const width = 72;
  const innerWidth = width - 4;

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Title
  const title = 'Upcoming Events (Next 30 Days)';
  const titlePad = Math.max(0, innerWidth - title.length);
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white(title) + ' '.repeat(titlePad) + ' ' + chalk.cyan('│'));

  // Earnings section
  console.log(chalk.cyan('├─') + chalk.cyan(' Earnings ') + chalk.cyan('─'.repeat(Math.max(0, width - 14))) + chalk.cyan('┤'));

  if (calendar.earnings.length === 0) {
    const noEarnings = chalk.dim('No upcoming earnings in the next 30 days');
    console.log(chalk.cyan('│') + ' ' + noEarnings + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noEarnings).length)) + ' ' + chalk.cyan('│'));
  } else {
    for (const event of calendar.earnings.slice(0, 8)) {
      const dateStr = event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const estStr = event.estimate !== null ? chalk.dim(`Est: $${event.estimate.toFixed(2)}`) : '';
      const nameTrunc = event.name.length > 25 ? event.name.slice(0, 22) + '...' : event.name;
      const line = `${chalk.yellow(dateStr.padEnd(8))} ${chalk.white(event.symbol.padEnd(6))} ${chalk.dim(nameTrunc.padEnd(26))} ${estStr}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  // Dividends section
  console.log(chalk.cyan('├─') + chalk.cyan(' Ex-Dividend Dates ') + chalk.cyan('─'.repeat(Math.max(0, width - 23))) + chalk.cyan('┤'));

  if (calendar.dividends.length === 0) {
    const noDividends = chalk.dim('No upcoming ex-dividend dates in the next 30 days');
    console.log(chalk.cyan('│') + ' ' + noDividends + ' '.repeat(Math.max(0, innerWidth - stripAnsi(noDividends).length)) + ' ' + chalk.cyan('│'));
  } else {
    for (const event of calendar.dividends.slice(0, 8)) {
      const dateStr = event.exDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const yieldStr = event.yield !== null ? chalk.green(`${(event.yield * 100).toFixed(2)}% yield`) : '';
      const amtStr = event.amount !== null ? chalk.dim(`$${event.amount.toFixed(2)}/share`) : '';
      const line = `${chalk.yellow(dateStr.padEnd(8))} ${chalk.white(event.symbol.padEnd(6))} ${amtStr.padEnd(20)} ${yieldStr}`;
      const stripped = stripAnsi(line);
      const padding = Math.max(0, innerWidth - stripped.length);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding) + ' ' + chalk.cyan('│'));
    }
  }

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const asOfStr = `As of ${calendar.asOfDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(asOfStr) + ' '.repeat(Math.max(0, innerWidth - asOfStr.length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Market Brief Display
// ═══════════════════════════════════════════════════════════════════════════

export function displayMarketBrief(brief: MarketBrief): void {
  const width = 78;
  const innerWidth = width - 4;
  const { data, narrative } = brief;

  const dateStr = data.asOfDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = data.asOfDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  console.log('');
  console.log(chalk.cyan('╭' + '─'.repeat(width - 2) + '╮'));

  // Header
  const title = 'MARKET BRIEF';
  const dateTime = `${dateStr} ${timeStr}`;
  const headerLine = `${chalk.bold.white(title)}${' '.repeat(Math.max(0, innerWidth - title.length - dateTime.length))}${chalk.dim(dateTime)}`;
  console.log(chalk.cyan('│') + ' ' + headerLine + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim('AI-generated market intelligence') + ' '.repeat(Math.max(0, innerWidth - 33)) + ' ' + chalk.cyan('│'));
  console.log(chalk.cyan('╞' + '═'.repeat(width - 2) + '╡'));

  // AI Narrative (if available)
  if (narrative) {
    // Headline
    const headlineLines = wrapText(narrative.headline, innerWidth);
    for (const line of headlineLines) {
      console.log(chalk.cyan('│') + ' ' + chalk.bold.yellow(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
    console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));

    // Summary
    const summaryLines = wrapText(narrative.summary, innerWidth);
    for (const line of summaryLines) {
      console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
    console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));
  }

  // Market Snapshot Section
  console.log(chalk.cyan('├─') + chalk.cyan(' MARKET SNAPSHOT ') + chalk.cyan('─'.repeat(Math.max(0, width - 21))) + chalk.cyan('┤'));

  // Indices header
  const idxHeader = `${'Index'.padEnd(14)} ${'Price'.padStart(12)} ${'Day'.padStart(8)} ${'Week'.padStart(8)} ${'YTD'.padStart(8)}`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(idxHeader) + ' '.repeat(Math.max(0, innerWidth - idxHeader.length)) + ' ' + chalk.cyan('│'));

  // Indices rows
  for (const idx of data.indices) {
    const dayColor = idx.changePercent >= 0 ? chalk.green : chalk.red;
    const weekColor = (idx.weekChange ?? 0) >= 0 ? chalk.green : chalk.red;
    const ytdColor = (idx.ytdChange ?? 0) >= 0 ? chalk.green : chalk.red;

    const dayStr = `${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%`;
    const weekStr = idx.weekChange !== null ? `${idx.weekChange >= 0 ? '+' : ''}${idx.weekChange.toFixed(1)}%` : 'n/a';
    const ytdStr = idx.ytdChange !== null ? `${idx.ytdChange >= 0 ? '+' : ''}${idx.ytdChange.toFixed(1)}%` : 'n/a';

    const line = `${chalk.white(idx.name.padEnd(14))} ${idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(12)} ${dayColor(dayStr.padStart(8))} ${weekColor(weekStr.padStart(8))} ${ytdColor(ytdStr.padStart(8))}`;
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  console.log(chalk.cyan('│') + ' '.repeat(innerWidth) + ' ' + chalk.cyan('│'));

  // Indicators row
  const ind = data.indicators;
  const indicatorParts: string[] = [];
  if (ind.vix) {
    const vixColor = ind.vix.value > 20 ? chalk.red : ind.vix.value > 15 ? chalk.yellow : chalk.green;
    indicatorParts.push(`VIX ${vixColor(ind.vix.value.toFixed(1))}`);
  }
  if (ind.treasury10Y) {
    const yieldChange = ind.treasury10Y.change >= 0 ? '+' : '';
    indicatorParts.push(`10Y ${ind.treasury10Y.value.toFixed(2)}% (${yieldChange}${(ind.treasury10Y.change * 100).toFixed(0)}bps)`);
  }
  if (ind.oil) {
    const oilColor = ind.oil.changePercent >= 0 ? chalk.green : chalk.red;
    indicatorParts.push(`Oil $${ind.oil.value.toFixed(0)} ${oilColor(`${ind.oil.changePercent >= 0 ? '+' : ''}${ind.oil.changePercent.toFixed(1)}%`)}`);
  }
  if (ind.bitcoin) {
    const btcColor = ind.bitcoin.changePercent >= 0 ? chalk.green : chalk.red;
    indicatorParts.push(`BTC $${(ind.bitcoin.value / 1000).toFixed(1)}k ${btcColor(`${ind.bitcoin.changePercent >= 0 ? '+' : ''}${ind.bitcoin.changePercent.toFixed(1)}%`)}`);
  }

  if (indicatorParts.length > 0) {
    const indLine = indicatorParts.join('  |  ');
    const indStripped = stripAnsi(indLine);
    console.log(chalk.cyan('│') + ' ' + indLine + ' '.repeat(Math.max(0, innerWidth - indStripped.length)) + ' ' + chalk.cyan('│'));
  }

  // Sector Performance
  console.log(chalk.cyan('├─') + chalk.cyan(' SECTOR PERFORMANCE ') + chalk.cyan('─'.repeat(Math.max(0, width - 24))) + chalk.cyan('┤'));

  const topSectors = data.sectors.slice(0, 5);
  const bottomSectors = data.sectors.slice(-3);

  for (const sec of topSectors) {
    const pct = sec.changePercent;
    const color = pct >= 0 ? chalk.green : chalk.red;
    const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;

    // Bar chart
    const barWidth = 25;
    const maxPct = Math.max(...data.sectors.map(s => Math.abs(s.changePercent)), 1);
    const barLen = Math.min(Math.round((Math.abs(pct) / maxPct) * barWidth), barWidth);
    const bar = pct >= 0
      ? chalk.green('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen))
      : chalk.red('█'.repeat(barLen)) + chalk.dim('░'.repeat(barWidth - barLen));

    const weekStr = sec.weekChange !== null ? ` (${sec.weekChange >= 0 ? '+' : ''}${sec.weekChange.toFixed(1)}% wk)` : '';
    const line = `${sec.name.padEnd(16)} ${bar} ${color(pctStr.padStart(7))}${chalk.dim(weekStr)}`;
    const stripped = stripAnsi(line);
    console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
  }

  // Show laggards indicator
  if (bottomSectors.length > 0 && bottomSectors[0].changePercent < 0) {
    const laggardLine = chalk.dim(`Laggards: ${bottomSectors.map(s => `${s.name} ${s.changePercent.toFixed(1)}%`).join(', ')}`);
    const laggardStripped = stripAnsi(laggardLine);
    console.log(chalk.cyan('│') + ' ' + laggardLine + ' '.repeat(Math.max(0, innerWidth - laggardStripped.length)) + ' ' + chalk.cyan('│'));
  }

  // Top Movers
  console.log(chalk.cyan('├─') + chalk.cyan(' TOP MOVERS ') + chalk.cyan('─'.repeat(Math.max(0, width - 16))) + chalk.cyan('┤'));

  // Gainers
  const gainerLine = data.gainers.slice(0, 5).map(g =>
    chalk.green(`${g.symbol} +${g.changePercent.toFixed(1)}%`)
  ).join('  ');
  const gainerStripped = stripAnsi(gainerLine);
  console.log(chalk.cyan('│') + ' ' + chalk.dim('UP   ') + gainerLine + ' '.repeat(Math.max(0, innerWidth - 5 - gainerStripped.length)) + ' ' + chalk.cyan('│'));

  // Losers
  const loserLine = data.losers.slice(0, 5).map(l =>
    chalk.red(`${l.symbol} ${l.changePercent.toFixed(1)}%`)
  ).join('  ');
  const loserStripped = stripAnsi(loserLine);
  console.log(chalk.cyan('│') + ' ' + chalk.dim('DOWN ') + loserLine + ' '.repeat(Math.max(0, innerWidth - 5 - loserStripped.length)) + ' ' + chalk.cyan('│'));

  // Breadth
  const breadthRatio = (data.breadth.advancing / Math.max(data.breadth.declining, 1)).toFixed(2);
  const breadthColor = parseFloat(breadthRatio) > 1.2 ? chalk.green : parseFloat(breadthRatio) < 0.8 ? chalk.red : chalk.yellow;
  const breadthLine = `Breadth: ${data.breadth.advancing} up / ${data.breadth.declining} down (${breadthColor(breadthRatio + ':1')})`;
  console.log(chalk.cyan('│') + ' ' + chalk.dim(breadthLine) + ' '.repeat(Math.max(0, innerWidth - breadthLine.length)) + ' ' + chalk.cyan('│'));

  // News Headlines
  if (data.topNews.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' TOP STORIES ') + chalk.cyan('─'.repeat(Math.max(0, width - 17))) + chalk.cyan('┤'));

    for (const news of data.topNews.slice(0, 4)) {
      const maxLen = innerWidth - 4;
      const title = news.title.length > maxLen ? news.title.slice(0, maxLen - 3) + '...' : news.title;
      console.log(chalk.cyan('│') + ' ' + chalk.dim('> ') + chalk.white(title) + ' '.repeat(Math.max(0, innerWidth - title.length - 2)) + ' ' + chalk.cyan('│'));
    }
  }

  // Upcoming Earnings
  if (data.upcomingEarnings.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' EARNINGS THIS WEEK ') + chalk.cyan('─'.repeat(Math.max(0, width - 24))) + chalk.cyan('┤'));

    for (const earning of data.upcomingEarnings.slice(0, 4)) {
      const earnDateStr = earning.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const estStr = earning.estimate !== null ? `Est: $${earning.estimate.toFixed(2)}` : '';
      const line = `${chalk.yellow(earnDateStr.padEnd(12))} ${chalk.white(earning.symbol.padEnd(6))} ${chalk.dim(earning.name.slice(0, 25).padEnd(26))} ${chalk.dim(estStr)}`;
      const stripped = stripAnsi(line);
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(Math.max(0, innerWidth - stripped.length)) + ' ' + chalk.cyan('│'));
    }
  }

  // AI Themes and Outlook (if available)
  if (narrative && narrative.keyThemes.length > 0) {
    console.log(chalk.cyan('├─') + chalk.cyan(' KEY THEMES ') + chalk.cyan('─'.repeat(Math.max(0, width - 16))) + chalk.cyan('┤'));
    const themesLine = narrative.keyThemes.map((t, i) => `${i + 1}. ${t}`).join('  ');
    const themesWrapped = wrapText(themesLine, innerWidth);
    for (const line of themesWrapped) {
      console.log(chalk.cyan('│') + ' ' + chalk.white(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
  }

  if (narrative && narrative.outlook) {
    console.log(chalk.cyan('├─') + chalk.cyan(' OUTLOOK ') + chalk.cyan('─'.repeat(Math.max(0, width - 13))) + chalk.cyan('┤'));
    const outlookWrapped = wrapText(narrative.outlook, innerWidth);
    for (const line of outlookWrapped) {
      console.log(chalk.cyan('│') + ' ' + chalk.dim(line) + ' '.repeat(Math.max(0, innerWidth - line.length)) + ' ' + chalk.cyan('│'));
    }
  }

  // Footer
  console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
  const footerHint = 'Ask: "why is NVDA up?" | "news AAPL" | "s MSFT" for details';
  console.log(chalk.cyan('│') + ' ' + chalk.dim(footerHint) + ' '.repeat(Math.max(0, innerWidth - footerHint.length)) + ' ' + chalk.cyan('│'));

  console.log(chalk.cyan('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}
