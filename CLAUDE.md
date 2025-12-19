# DevFolio - AI-Powered Financial Terminal

## Project Overview

DevFolio is a terminal-based financial application that combines real-time market data with AI-powered analysis. It provides a comprehensive view of stocks, ETFs, market conditions, and news - all rendered in a beautiful ASCII-based terminal UI.

## Architecture

```
src/
├── index.tsx          # Entry point
├── app.tsx            # Main application logic, CLI commands, display functions
├── ai/
│   ├── agent.ts       # Groq LLM integration for natural language chat
│   ├── executor.ts    # Tool execution handler
│   ├── tools.ts       # AI tool definitions (lookup_stock, compare_stocks, etc.)
│   └── prompts.ts     # System prompts for AI
├── services/
│   ├── market.ts      # Yahoo Finance data: quotes, profiles, market overview
│   ├── etf.ts         # ETF profiles and holdings
│   ├── brief.ts       # AI-synthesized market brief
│   ├── research.ts    # AI research report generation
│   ├── earnings.ts    # Earnings reports with SEC data
│   └── sec.ts         # SEC EDGAR API integration
├── db/
│   ├── watchlist.ts   # SQLite watchlist operations
│   └── portfolio.ts   # SQLite portfolio operations
├── components/        # React/Ink UI components (TUI rendering)
├── hooks/             # React hooks for state management
├── types/             # TypeScript interfaces
├── constants/         # App constants and demo data
└── utils/             # Formatting utilities
```

## Key Technologies

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.7
- **UI Framework**: React via Ink (terminal UI)
- **Data Source**: yahoo-finance2 package
- **AI/LLM**: Groq API with Llama 3.3 70B
- **Database**: SQLite 3 via better-sqlite3
- **Build Tool**: tsup
- **Testing**: Vitest

## Data Flow

1. **User Input** -> CLI command parser in `app.tsx`
2. **Data Fetching** -> Services (`market.ts`, `etf.ts`, etc.) call Yahoo Finance
3. **AI Processing** -> For `brief`, `research`, chat: Groq API synthesizes data
4. **Display** -> `display*()` functions render ASCII boxes to terminal

## CLI Commands

| Command | Function | Description |
|---------|----------|-------------|
| `b`, `brief` | `showBrief()` | AI market brief with full analysis |
| `m`, `market` | `showMarket()` | Market overview (indices, sectors, movers) |
| `s <SYM>` | `showStock()` | Company profile with chart |
| `etf <SYM>` | `showETF()` | ETF profile with holdings |
| `compare <S1> <S2>` | `showETFComparison()` | Compare ETFs |
| `cs <S1> <S2>...` | `showStockComparison()` | Compare stocks |
| `r <SYM>` | `showReport()` | AI research report |
| `e <SYM>` | `showEarnings()` | Earnings report |
| `w`, `watchlist` | `showWatchlist()` | View watchlist |
| `p`, `portfolio` | `showPortfolio()` | View portfolio |
| `add <SYM>` | - | Add to watchlist |
| `cal`, `events` | `showCalendar()` | Upcoming earnings/dividends |
| `news [SYM]` | `showNews()` | Market or stock news |
| `read <N>` | - | Read article N in terminal |
| `clear`, `home` | `showHomeScreen()` | Clear and show home |
| `?`, `help` | `showHelp()` | Show help |
| Natural language | `chat()` | AI chat with tools |

## Services

### market.ts
Primary data service. Key functions:
- `getQuotes(symbols)` - Real-time quotes
- `getCompanyProfile(symbol)` - Full company data with chart
- `compareStocks(symbols)` - Fetch multiple profiles
- `getMarketOverview()` - Indices, sectors, VIX, top movers
- `getMarketBriefData()` - Comprehensive data for AI brief
- `getEventsCalendar(symbols)` - Upcoming earnings/dividends
- `getNewsFeed(symbols?)` - News articles
- `fetchArticleContent(url)` - Extract article text via Readability

### etf.ts
- `getETFProfile(symbol)` - Holdings, sectors, performance
- `compareETFs(symbols)` - Compare multiple ETFs

### brief.ts
- `getMarketBrief()` - Combines market data with AI narrative

### research.ts
- `generateResearchReport(symbol)` - AI-generated stock analysis

### earnings.ts
- `generateEarningsReport(symbol)` - Earnings with SEC filings

## AI Integration

### Tools (ai/tools.ts)
AI can call these tools during chat:
- `get_stock_quote` - Real-time price
- `lookup_stock` - Company profile
- `compare_stocks` - Multi-stock comparison
- `lookup_etf` - ETF profile
- `compare_etfs` - ETF comparison
- `get_watchlist` - User's watchlist
- `search_symbol` - Symbol lookup

### Prompts (ai/prompts.ts)
System prompt configures AI as financial assistant with:
- Market data interpretation
- When to use which tools
- Response formatting guidelines

## Display System

All `display*()` functions in `app.tsx` render ASCII boxes:
- Use `chalk` for colors
- Box characters: `╭ ╮ ╰ ╯ │ ─ ├ ┤ ╞ ╡`
- Color coding: green (positive), red (negative), yellow (warnings)
- Width typically 70-78 characters

### Key Display Functions
- `displayMarketBrief()` - Full market intelligence
- `displayMarketOverview()` - Quick market snapshot
- `displayCompanyProfile()` - Stock profile with chart
- `displayETFProfile()` - ETF with holdings
- `displayStockComparison()` - Side-by-side stocks
- `displayNewsFeed()` - News list
- `displayArticle()` - Full article content

## Database

SQLite database at `~/.devfolio/data.db`:

**watchlist table**
- symbol, added_at

**portfolio table**
- symbol, shares, avg_cost, added_at

## Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Build with tsup to dist/
npm run dev          # Run the CLI app
npm test             # Run Vitest tests
```

## Key Patterns

### Caching
Services use in-memory cache with TTL:
```typescript
const cache = new Map<string, { data: unknown; expires: number }>();
function getCached<T>(key: string): T | null { ... }
function setCache(key: string, data: unknown, ttlMs: number) { ... }
```

### Error Handling
Services return `null` on error, display functions handle gracefully:
```typescript
const profile = await getCompanyProfile(symbol);
if (!profile) {
  console.log(chalk.red('Could not fetch data'));
  return;
}
```

### Yahoo Finance Modules
Common quoteSummary modules:
- `price` - Current price data
- `summaryDetail` - Key stats
- `financialData` - Margins, growth
- `defaultKeyStatistics` - P/E, beta
- `topHoldings` - ETF holdings
- `fundProfile` - ETF details
- `calendarEvents` - Earnings dates

## Adding New Features

1. **New Data** - Add to `services/market.ts` or create new service
2. **New Display** - Add `display*()` function in `app.tsx`
3. **New Command** - Add handler and update help text in `app.tsx`
4. **New AI Tool** - Add to `tools.ts` and `executor.ts`

## Testing

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

Test files use `.test.ts` or `.test.tsx` suffix.

## Common Issues

1. **Yahoo Finance Rate Limiting** - Add delays between requests, use caching
2. **Header Overflow** - Yahoo sends large headers; use curl for article fetching
3. **Missing API Key** - Ensure GROQ_API_KEY is set for AI features
4. **Chart Rendering** - Uses `asciichart` package, needs numeric array data

## File Size Reference

After build, `dist/index.js` is typically 170-200KB.
