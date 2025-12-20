# DevFolio - AI-Powered Financial Terminal

## Project Overview

DevFolio is a terminal-based financial application that combines real-time market data with AI-powered analysis. It provides a comprehensive view of stocks, ETFs, market conditions, and news - all rendered in a beautiful ASCII-based terminal UI.

## Development Practices

### Trunk-Based Development
This project follows trunk-based development:
- **Small, frequent commits** - Each commit should be a single logical change
- **Always deployable** - Main branch should always be in a working state
- **No long-lived branches** - Feature work merged quickly
- **Commit messages** - Use conventional format: `type: description`
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `refactor:` - Code restructuring
  - `docs:` - Documentation
  - `chore:` - Build, deps, config

### Code Organization Principles
- **Max 300 lines per file** - Split large files into focused modules
- **Single responsibility** - Each file/function does one thing
- **Explicit imports** - No barrel files that obscure dependencies
- **Colocate related code** - Keep display logic near its data types
- **No emojis** - Never use emojis in code, output, or UI. Use ASCII/Unicode symbols (arrows, boxes, etc.) instead

## Architecture

```
src/
├── index.ts              # Entry point, process handling
├── cli/
│   ├── index.ts          # Main REPL loop
│   ├── commands.ts       # Command parsing and routing
│   ├── state.ts          # Shared state (lastNews, lastFilings)
│   ├── ui.ts             # UI primitives (drawBox, spinner, etc.)
│   └── display/
│       ├── index.ts      # Display function exports
│       ├── market.ts     # Brief (daily summary), market overview displays
│       ├── stock.ts      # Stock profile, comparison
│       ├── etf.ts        # ETF displays
│       ├── earnings.ts   # Earnings report display
│       ├── filings.ts    # SEC filings display
│       ├── news.ts       # News feed, article display
│       ├── portfolio.ts  # Watchlist, portfolio displays
│       ├── pulse.ts      # Pulse (real-time snapshot) display
│       ├── screener.ts   # Stock screener display
│       └── help.ts       # Help screen
├── ai/
│   ├── agent.ts          # Groq LLM integration for chat
│   ├── executor.ts       # Tool execution handler
│   ├── tools.ts          # AI tool definitions
│   └── prompts.ts        # System prompts
├── services/
│   ├── market.ts         # Yahoo Finance: quotes, profiles
│   ├── etf.ts            # ETF profiles and holdings
│   ├── brief.ts          # Daily market summary (run once a day)
│   ├── pulse.ts          # Real-time snapshot (run frequently)
│   ├── screener.ts       # Stock screener + related stocks
│   ├── research.ts       # AI research reports
│   ├── earnings.ts       # Earnings + SEC data
│   └── sec.ts            # SEC EDGAR API
├── db/
│   ├── index.ts          # Database initialization
│   ├── config.ts         # User preferences (pulse thresholds)
│   ├── watchlist.ts      # Watchlist operations
│   └── portfolio.ts      # Portfolio operations
├── types/
│   └── index.ts          # Shared TypeScript interfaces
├── utils/
│   └── format.ts         # Formatting utilities
└── constants/
    └── index.ts          # App constants, demo data
```

## Key Technologies

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.7
- **UI**: chalk + readline (terminal colors and input)
- **Data Source**: yahoo-finance2
- **AI/LLM**: Groq API with Llama 3.3 70B
- **Database**: SQLite 3 via better-sqlite3
- **Build Tool**: tsup
- **Testing**: Vitest

## CLI Commands

| Command | Description |
|---------|-------------|
| `b`, `brief` | Daily market summary - run once a day for full story |
| `pulse` | Real-time snapshot - run often to see what's moving now |
| `pulse config` | View/edit pulse alert thresholds |
| `screen <preset>` | Stock screener (gainers, losers, tech, healthcare, finance...) |
| `s <SYM>` | Stock profile with chart, AI quick take, + related stocks |
| `r <SYM>` | AI research report |
| `e <SYM>` | Earnings report with SEC data |
| `why <SYM>` | AI explanation of stock movement |
| `etf <SYM>` | ETF profile with holdings |
| `compare <S1> <S2>` | Compare ETFs |
| `cs <S1> <S2>...` | Compare stocks |
| `filings <SYM>` | List SEC filings (10-K, 10-Q, 8-K) |
| `filing <N>` | Read SEC filing |
| `news [SYM]` | Market or stock news with sentiment |
| `read <N>` | Read article |
| `w`, `watchlist` | View watchlist with events |
| `p`, `portfolio` | View portfolio |
| `add <SYM>` | Add to watchlist |
| `rm <SYM>` | Remove from watchlist |
| `clear`, `home` | Clear screen |
| `?`, `help` | Show help |
| `q`, `quit` | Exit |

## Services

### market.ts
Primary data service:
- `getQuotes(symbols)` - Real-time quotes
- `getCompanyProfile(symbol)` - Full company data with chart
- `compareStocks(symbols)` - Fetch multiple profiles
- `getMarketOverview()` - Indices, sectors, VIX, movers
- `getMarketBriefData()` - Comprehensive data for AI brief
- `getEventsCalendar(symbols)` - Upcoming earnings/dividends
- `getNewsFeed(symbols?)` - News articles
- `fetchArticleContent(url)` - Extract article text

### AI Services
- `brief.ts` - `getMarketBrief()` - Comprehensive daily summary with full AI narrative
- `pulse.ts` - `getMarketPulse()` - Quick snapshot of what's moving right now
- `research.ts` - `generateResearchReport(symbol)` - Deep analysis
- `earnings.ts` - `generateEarningsReport(symbol)` - Earnings + SEC

### sec.ts
SEC EDGAR integration:
- `getRecentFilings(symbol)` - List 10-K, 10-Q, 8-K filings
- `getFilingText(filing)` - Extract filing content
- `extractKeySections(text)` - Pull key sections
- `identify8KItems(text)` - Decode 8-K event types

## AI Integration

### Streaming Responses
AI responses stream token-by-token for better UX:
```typescript
const stream = await groq.chat.completions.create({
  stream: true,
  // ...
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Tool Calling
AI can execute tools during chat:
- `lookup_stock` - Get stock profile
- `compare_stocks` - Compare multiple stocks
- `lookup_etf` - ETF profile
- `get_watchlist` - User's watchlist
- `search_symbol` - Symbol search

## Display System

### UI Primitives (cli/ui.ts)
- `drawBox(title, lines, width)` - ASCII box with border
- `showSpinner(message)` - Loading indicator
- `streamText(text)` - Character-by-character output
- Box characters: `╭ ╮ ╰ ╯ │ ─ ├ ┤`
- Colors: green (positive), red (negative), yellow (warning), cyan (info)

### Display Width
Standard widths for consistency:
- Full width: 78 characters
- Standard box: 66-72 characters
- Compact: 58 characters

## Database

SQLite at `~/.devfolio/data.db`:

```sql
CREATE TABLE watchlist (
  symbol TEXT PRIMARY KEY,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio (
  symbol TEXT PRIMARY KEY,
  shares REAL,
  avg_cost REAL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Development

```bash
npm install          # Install dependencies
npm run dev          # Run in development
npm run build        # Build to dist/
npm run typecheck    # Type check
npm test             # Run tests
npm test -- --watch  # Watch mode
```

## Adding Features

1. **New Command**:
   - Add handler in `cli/commands.ts`
   - Create display function in `cli/display/`
   - Update help in `cli/display/help.ts`

2. **New AI Feature**:
   - Add service function in `services/`
   - Use streaming for responses
   - Handle errors gracefully

3. **New Data Source**:
   - Create service in `services/`
   - Add caching with TTL
   - Export types from `types/`

## Performance

### Caching
Services cache with TTL:
```typescript
const CACHE_TTL = {
  quotes: 30_000,      // 30 seconds
  profile: 300_000,    // 5 minutes
  fundamentals: 3600_000, // 1 hour
};
```

### Bundle Size
Target: <150KB for dist/index.js
- Tree-shake unused code
- No unused dependencies
- Lazy-load AI client

## Error Handling

Standard error display:
```typescript
function displayError(message: string, hint?: string): void {
  console.log('');
  console.log(chalk.red(`  Error: ${message}`));
  if (hint) console.log(chalk.dim(`  ${hint}`));
  console.log('');
}
```

## Common Issues

1. **Rate Limiting** - Yahoo Finance limits requests; use caching
2. **API Key Missing** - GROQ_API_KEY required for AI features
3. **Network Errors** - Services return null; display handles gracefully
4. **Large Headers** - Use curl for article fetching (Node http parser limits)
