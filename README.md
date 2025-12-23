<p align="center">
  <img src="docs/assets/devfolio-banner.png" alt="DevFolio" width="600" />
</p>

<p align="center">
  <strong>A Bloomberg Terminal for your command line.</strong><br/>
  AI-powered financial analysis for developers who invest.
</p>

<p align="center">
  <a href="#installation">Install</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#why-i-built-this">Why I Built This</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node Version" />
  <img src="https://img.shields.io/badge/typescript-5.7-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

<!-- TODO: Add a GIF demo here showing the app in action -->
<!-- Suggested: Record a 30-second demo showing: brief command, stock lookup, AI chat -->

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│    ██████╗ ███████╗██╗   ██╗███████╗ ██████╗ ██╗     ██╗ ██████╗             │
│    ██╔══██╗██╔════╝██║   ██║██╔════╝██╔═══██╗██║     ██║██╔═══██╗            │
│    ██║  ██║█████╗  ██║   ██║█████╗  ██║   ██║██║     ██║██║   ██║            │
│    ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║   ██║██║     ██║██║   ██║            │
│    ██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗██║╚██████╔╝            │
│    ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝             │
│                                                                              │
│    Real-time market data • AI analysis • SEC filings • Options chains        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  > s NVDA 1y                                                                 │
│                                                                              │
│  NVIDIA Corporation (NVDA)                                    $142.50 +2.3%  │
│  Semiconductors | Santa Clara, CA                                            │
│                                                                              │
│  150 ┤                                                           ╭───        │
│  125 ┤                                              ╭────────────╯           │
│  100 ┤                        ╭─────────────────────╯                        │
│   75 ┤   ╭────────────────────╯                                              │
│   50 ┼───╯                                                                   │
│      Jan     Mar     May     Jul     Sep     Nov     Jan                     │
│                                                                              │
│  P/E: 65.2  │  Mkt Cap: $3.5T  │  52W: $45.01 - $152.89  │  Vol: 42.1M       │
│                                                                              │
│  AI: NVDA continues to dominate the AI chip market with 80%+ data center    │
│  GPU share. Strong demand from hyperscalers and enterprise AI adoption.     │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

## Why I Built This

I'm a developer who invests. I spend most of my day in the terminal, and switching to browser-based tools for stock research always felt like friction.

I wanted something that:
- Lives where I already work (the terminal)
- Gives me real data, not toy examples
- Uses AI to surface insights, not just display numbers
- Feels like a professional tool, not a side project

So I built DevFolio—a terminal-native financial analysis platform that combines free real-time market data with multi-provider AI analysis.

**This is not a startup or a product.** It's a personal tool I built to learn and use, now open-sourced for anyone who wants it.

### What I Learned Building This

- **Terminal UI Architecture**: Building responsive, stateful UIs with React + Ink pushed me to think differently about component design
- **Multi-Provider AI Abstraction**: Designing a provider-agnostic AI layer with automatic fallback, streaming, and tool calling
- **Real-World API Integration**: Parsing messy financial data from Yahoo Finance, SEC EDGAR, and CoinGecko
- **RAG Implementation**: Building retrieval-augmented generation for SEC filing search using SQLite FTS5
- **Caching Strategies**: Multi-layer caching with different TTLs for quotes vs fundamentals vs AI responses

---

## Features

### Market Intelligence

| Feature | Description |
|---------|-------------|
| **AI Market Brief** | Daily market narrative with indices, sectors, and outlook |
| **Market Pulse** | Real-time alerts with customizable thresholds |
| **Live Mode** | 10-second quote refresh for active monitoring |
| **News Reader** | Financial news with AI sentiment analysis |

### Stock Analysis

| Feature | Description |
|---------|-------------|
| **Stock Profiles** | Company data, ASCII charts, metrics, AI quick takes |
| **Research Reports** | AI-generated deep-dive analysis |
| **Financial Statements** | Income, balance sheet, cash flow |
| **Stock Comparison** | Side-by-side with AI verdict |
| **Earnings Analysis** | Historical earnings + SEC data |

### Options, Crypto, ETFs

| Feature | Description |
|---------|-------------|
| **Options Chains** | Full chain with Greeks (delta, gamma, theta, vega) |
| **IV Surface** | Implied volatility analysis |
| **Cryptocurrency** | Top 50 via CoinGecko (free, no key) |
| **ETF Profiles** | Holdings, performance, expense ratios |

### SEC Filings

| Feature | Description |
|---------|-------------|
| **Filing Browser** | Read 10-K, 10-Q, 8-K directly in terminal |
| **AI Extraction** | Key section summarization |
| **RAG Search** | Full-text search over filings with FTS5 |

### AI Capabilities

| Feature | Description |
|---------|-------------|
| **Multi-Provider** | Groq, OpenAI, Anthropic, Ollama |
| **Tool Calling** | AI can fetch live data during conversation |
| **Conversational Memory** | Multi-turn context with session persistence |
| **Preference Learning** | AI learns your investment style over time |

---

## Installation

```bash
# Run directly (no install)
npx devfolio

# Or install globally
npm install -g devfolio
```

### Setup

All market data is **free**. AI features use BYOK (Bring Your Own Key).

```bash
# Recommended: Groq (free tier, fastest)
export GROQ_API_KEY=your_key_here

# Or use other providers
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

Get a free Groq key at [console.groq.com](https://console.groq.com).

---

## Quick Start

```bash
# Start DevFolio
devfolio

# Get AI market analysis
> brief

# Look up a stock with 1-year chart
> s NVDA 1y

# AI research report
> r AAPL

# Compare stocks with AI verdict
> cs AAPL MSFT GOOGL

# Check options chain
> options TSLA

# Read SEC filings
> filings AMZN
> filing 1

# Chat naturally
> what do you think about NVDA given the AI chip competition?
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DevFolio Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Terminal UI (Ink + React)                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │  Views   │ │ Widgets  │ │  Input   │ │  Output  │ │  Layout  │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│                    ┌────────────────┴────────────────┐                      │
│                    ▼                                 ▼                      │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────┐    │
│  │      AI Infrastructure      │    │         Data Services           │    │
│  │  ┌───────────────────────┐  │    │  ┌───────────────────────────┐  │    │
│  │  │   Provider Adapters   │  │    │  │    Market Data Service    │  │    │
│  │  │  Groq│OpenAI│Anthropic│  │    │  │  Yahoo Finance│CoinGecko  │  │    │
│  │  └───────────────────────┘  │    │  └───────────────────────────┘  │    │
│  │  ┌───────────────────────┐  │    │  ┌───────────────────────────┐  │    │
│  │  │     Chat Agent        │  │    │  │      SEC EDGAR Service    │  │    │
│  │  │  Tools│Memory│Stream  │  │    │  │    Filings│RAG│Search     │  │    │
│  │  └───────────────────────┘  │    │  └───────────────────────────┘  │    │
│  │  ┌───────────────────────┐  │    │  ┌───────────────────────────┐  │    │
│  │  │   Cost Tracking       │  │    │  │     Options Service       │  │    │
│  │  │   Token│$│Provider    │  │    │  │   Chains│Greeks│IV        │  │    │
│  │  └───────────────────────┘  │    │  └───────────────────────────┘  │    │
│  └─────────────────────────────┘    └─────────────────────────────────┘    │
│                    │                                 │                      │
│                    └────────────────┬────────────────┘                      │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Persistence Layer (SQLite)                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │Watchlist │ │Portfolio │ │  Memory  │ │   Prefs  │ │ FTS5/RAG │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Multi-Provider AI Abstraction**
```typescript
// Single interface, multiple backends
const response = await aiClient.complete({
  prompt: "Analyze AAPL",
  stream: true,
  tools: [lookupStock, compareStocks]
});
// Works with Groq, OpenAI, Anthropic, or Ollama
```

**Layered Caching**
```typescript
// Different TTLs for different data types
CACHE_TTL = {
  quotes: 10_000,        // 10 seconds (real-time)
  fundamentals: 3600_000, // 1 hour (stable)
  aiResponses: 300_000,   // 5 minutes (context-dependent)
}
```

**RAG for SEC Filings**
```typescript
// Full-text search over chunked filings
const results = await ragSearch({
  query: "revenue guidance",
  symbol: "AAPL",
  limit: 5
});
// Uses SQLite FTS5 for fast retrieval
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript 5.7 |
| **UI Framework** | React 18 + Ink 5 (terminal rendering) |
| **Market Data** | yahoo-finance2, CoinGecko |
| **SEC Data** | SEC EDGAR API |
| **AI Providers** | Groq, OpenAI, Anthropic, Ollama |
| **Database** | SQLite 3 (better-sqlite3) with FTS5 |
| **Validation** | Zod |
| **Build** | tsup (esbuild) |
| **Testing** | Vitest |

---

## Commands Reference

<details>
<summary><strong>Market Commands</strong></summary>

| Command | Description |
|---------|-------------|
| `b`, `brief` | AI market analysis |
| `pulse` | Real-time market alerts |
| `live [SYM...]` | Live mode (10s refresh) |
| `news [SYM]` | News with sentiment |
| `screen <preset>` | Stock screener |

</details>

<details>
<summary><strong>Stock Commands</strong></summary>

| Command | Description |
|---------|-------------|
| `s <SYM> [TF]` | Stock profile with chart |
| `r <SYM>` | AI research report |
| `e <SYM>` | Earnings analysis |
| `fin <SYM>` | Financial statements |
| `cs <S1> <S2>...` | Compare stocks |
| `why <SYM>` | Explain price movement |

</details>

<details>
<summary><strong>Options & Crypto</strong></summary>

| Command | Description |
|---------|-------------|
| `options <SYM>` | Options overview |
| `chain <SYM> [exp]` | Full options chain |
| `crypto` | Top 50 cryptocurrencies |
| `c <SYM>` | Crypto profile |

</details>

<details>
<summary><strong>Portfolio & SEC</strong></summary>

| Command | Description |
|---------|-------------|
| `w`, `watchlist` | View watchlist |
| `p`, `portfolio` | View portfolio |
| `add <SYM>` | Add to watchlist |
| `filings <SYM>` | SEC filings |
| `filing <N>` | Read filing |

</details>

---

## Data Sources

All market data is **free** with no API keys required:

| Data | Provider | Cost |
|------|----------|------|
| Stocks, ETFs, Options | Yahoo Finance | Free |
| SEC Filings | SEC EDGAR | Free |
| Cryptocurrency | CoinGecko | Free |

AI features require a key from any supported provider. Groq offers a generous free tier.

---

## Project Structure

```
src/
├── app/                    # Main application + routing
├── ai/                     # AI infrastructure
│   ├── providers/          # Groq, OpenAI, Anthropic, Ollama
│   ├── client.ts           # Multi-provider orchestrator
│   ├── agent.ts            # Chat agent with tools
│   └── tools.ts            # AI function definitions
├── services/               # Data fetching layer
│   ├── market.ts           # Stocks, quotes, charts
│   ├── options.ts          # Options chains, Greeks
│   ├── sec.ts              # SEC EDGAR integration
│   ├── crypto.ts           # CoinGecko client
│   └── rag/                # RAG for filing search
├── views/                  # Full-page view components
├── components/             # Reusable UI components
├── db/                     # SQLite persistence
│   ├── memory.ts           # Chat memory
│   ├── preferences.ts      # Preference learning
│   └── watchlist.ts        # Portfolio data
├── alerts/                 # Alert system
├── hooks/                  # React hooks
├── design/                 # Design tokens
└── utils/                  # Utilities
```

**228 TypeScript files** organized by domain with single-responsibility modules.

---

## Development

```bash
git clone https://github.com/blancas-armando/devfolio.git
cd devfolio
npm install

# Development
npm run dev

# Type check
npm run typecheck

# Test
npm test

# Build
npm run build
```

---

## License

MIT

---

<p align="center">
  Built by <a href="https://github.com/blancas-armando">Armando Blancas</a>
</p>
