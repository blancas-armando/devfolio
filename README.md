# DevFolio

AI-powered financial terminal for developers who invest. Track stocks, ETFs, options, and crypto—get AI-driven insights—all from your terminal.

```
╭──────────────────────────────────────────────────────────────────╮
│  ╔═════════════════════════════════════════════════════════════╗ │
│  ║  ██████╗ ███████╗██╗   ██╗███████╗ ██████╗ ██╗     ██╗ ██████║ │
│  ║  ██╔══██╗██╔════╝██║   ██║██╔════╝██╔═══██╗██║     ██║██╔═══██║ │
│  ║  ██║  ██║█████╗  ██║   ██║█████╗  ██║   ██║██║     ██║██║   ██║ │
│  ║  ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║   ██║██║     ██║██║   ██║ │
│  ║  ██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗██║╚██████╔║ │
│  ║  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝║ │
│  ╚═════════════════════════════════════════════════════════════╝ │
│                                                                  │
│  AI-Powered Financial Terminal for Developers                    │
├──────────────────────────────────────────────────────────────────┤
│  > s NVDA                                                        │
╰──────────────────────────────────────────────────────────────────╯
```

## Features

### Market Intelligence
- **AI Market Brief** — Daily market analysis with indices, sectors, and outlook
- **Market Pulse** — Real-time alerts with customizable thresholds
- **Proactive Alerts** — Get notified of price drops, spikes, and upcoming earnings
- **News Reader** — Financial news with AI sentiment analysis

### Stock Analysis
- **Stock Profiles** — Company data, charts, metrics, and AI quick takes
- **Research Reports** — AI-generated stock research primers
- **Financial Statements** — Income statements, balance sheets, cash flow
- **Earnings Analysis** — Historical earnings with SEC data integration
- **Stock Comparisons** — Side-by-side analysis with AI verdict

### Options & Derivatives
- **Options Chains** — Full chain with strikes, expiries, and Greeks
- **IV Analysis** — Implied volatility surface visualization
- **Unusual Activity** — Detection of high volume/OI ratios

### Cryptocurrency
- **Top 50 Cryptos** — Real-time prices via CoinGecko (free, no API key)
- **Crypto Profiles** — Detailed coin information and metrics
- **Market Overview** — Total cap, BTC dominance, gainers/losers

### ETFs
- **ETF Profiles** — Holdings, performance, and expense ratios
- **ETF Comparison** — Side-by-side analysis with overlap detection

### SEC Filings
- **10-K, 10-Q, 8-K** — Read filings directly in terminal
- **AI Analysis** — Key section extraction and summarization

### Portfolio Management
- **Watchlist** — Track stocks with live quotes and events
- **Portfolio** — Holdings with P/L and AI health scoring
- **Live Mode** — 10-second quote refresh for active monitoring

### AI Capabilities
- **Multi-Provider** — Groq, OpenAI, Anthropic, or local Ollama
- **Conversational Memory** — Multi-turn chats with context
- **Preference Learning** — AI learns your investment style
- **Natural Language** — Ask anything about stocks and markets

## Installation

```bash
npm install -g devfolio
```

Or run directly:

```bash
npx devfolio
```

## Setup

DevFolio uses **BYOK (Bring Your Own Key)** for AI features. All market data is free.

### Quick Start (Free)

1. Get a free API key from [Groq](https://console.groq.com)
2. Set your API key:
   ```bash
   export GROQ_API_KEY=your_key_here
   ```
3. Run DevFolio:
   ```bash
   devfolio
   ```

### Alternative AI Providers

```bash
# OpenAI
export OPENAI_API_KEY=sk-...

# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...

# Ollama (local, no key needed)
export OLLAMA_URL=http://localhost:11434
```

### Data Sources (All Free)

| Data | Provider | API Key? |
|------|----------|----------|
| Stocks, ETFs | Yahoo Finance | No |
| Options | Yahoo Finance | No |
| SEC Filings | SEC EDGAR | No |
| Cryptocurrency | CoinGecko | No |

## Commands

### Market

| Command | Description |
|---------|-------------|
| `b`, `brief` | AI market analysis with indices, sectors, outlook |
| `pulse` | Market alerts with personalized thresholds + AI take |
| `pulse config` | View/edit pulse alert thresholds |
| `alerts` | View pending alerts |
| `live` | Toggle live mode (10s refresh) for watchlist |
| `live <SYM...>` | Live mode for specific symbols |
| `sc`, `screen <preset>` | Stock screener (gainers, losers, tech, value...) |
| `n`, `news [SYM]` | Market or stock news with sentiment |
| `read <N>` | Read article N |

### Stocks

| Command | Description |
|---------|-------------|
| `s <SYM> [TF]` | Stock profile with chart (e.g., `s AAPL 1y`) |
| `fin <SYM>` | All financial statements |
| `fin <SYM> income` | Income statement only |
| `fin <SYM> balance` | Balance sheet only |
| `fin <SYM> cashflow` | Cash flow statement only |
| `r <SYM>` | AI research primer report |
| `e <SYM>` | Earnings report with SEC data |
| `why <SYM>` | AI explanation of stock movement |
| `cs <S1> <S2>...` | Compare stocks side-by-side with AI verdict |

### Options

| Command | Description |
|---------|-------------|
| `options <SYM>` | Options overview with unusual activity |
| `chain <SYM> [expiry]` | Full options chain with Greeks |
| `iv <SYM>` | Implied volatility analysis |

### Cryptocurrency

| Command | Description |
|---------|-------------|
| `crypto` | Top 50 cryptocurrencies |
| `c <SYM>` | Crypto profile (e.g., `c BTC`, `c ETH`) |

### ETFs

| Command | Description |
|---------|-------------|
| `etf <SYM>` | ETF profile with holdings |
| `compare <S1> <S2>` | Compare ETFs side-by-side |

### SEC Filings

| Command | Description |
|---------|-------------|
| `filings <SYM>` | List recent 10-K, 10-Q, 8-K filings |
| `filing <N>` | Read filing N |

### Portfolio

| Command | Description |
|---------|-------------|
| `w`, `watchlist` | View watchlist with live quotes |
| `p`, `portfolio` | View portfolio with AI health score |
| `add <SYM>` | Add to watchlist |
| `rm <SYM>` | Remove from watchlist |
| `groups` | List saved comparison groups |
| `group load <name>` | Load and compare a saved group |

### AI Configuration

| Command | Description |
|---------|-------------|
| `config ai` | View AI configuration |
| `config ai.provider <name>` | Set default AI provider |
| `config ai.feature.<name>.provider <provider>` | Set provider per feature |
| `cost` | View session AI cost summary |

### Other

| Command | Description |
|---------|-------------|
| `history [N]` | Show command history |
| `tutorial` | Interactive guided tour |
| `clear`, `home` | Clear screen / show home |
| `?`, `help` | Show all commands |
| `q`, `quit` | Exit |

## Usage Examples

```bash
# Get AI market analysis
> brief

# View stock with 1-year chart
> s NVDA 1y

# AI research report
> r AAPL

# Compare tech stocks with AI verdict
> cs AAPL MSFT GOOGL AMZN

# Options chain for AAPL
> options AAPL
> chain AAPL 2024-01-19

# Check crypto prices
> crypto
> c BTC

# Financial statements
> fin AAPL
> fin AAPL income

# Stock screener
> screen gainers
> screen tech

# Read SEC filings
> filings TSLA
> filing 1

# Market pulse with custom thresholds
> pulse config
> pulse set vixThreshold 25

# Live mode for active trading
> live AAPL NVDA TSLA

# View alerts
> alerts

# Check AI cost for session
> cost

# Chat naturally
> what do you think about NVDA?
> compare my watchlist performance
```

## AI Providers

DevFolio supports multiple AI providers with automatic fallback:

| Provider | Models | Notes |
|----------|--------|-------|
| **Groq** | Llama 3.3 70B | Free tier, fastest |
| **OpenAI** | GPT-4o, GPT-4o-mini | Paid, most capable |
| **Anthropic** | Claude 3.5 Sonnet | Paid, best reasoning |
| **Ollama** | Any local model | Free, offline capable |

Configure per feature for cost optimization:
```bash
# Use Groq for fast responses
> config ai.feature.quick.provider groq

# Use Anthropic for deep research
> config ai.feature.research.provider anthropic
```

## Keyboard Shortcuts

- `Tab` — Command and symbol completion
- `↑` / `↓` — Navigate command history
- `!N` — Re-run command N from history
- `Ctrl+C` — Cancel long operations
- `Ctrl+D` — Exit

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.7
- **UI**: chalk + readline (terminal colors and input)
- **Data**: yahoo-finance2 (real-time market data)
- **AI**: Multi-provider (Groq, OpenAI, Anthropic, Ollama)
- **Database**: SQLite 3 via better-sqlite3
- **Build**: tsup
- **Testing**: Vitest

## Development

```bash
# Clone the repo
git clone https://github.com/blancas-armando/devfolio.git
cd devfolio

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your API keys to .env

# Run in development
npm run dev

# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

## Data Storage

DevFolio stores data locally at `~/.devfolio/`:

- `data.db` — SQLite database for:
  - Watchlist and portfolio
  - Chat sessions and memory
  - User preferences
  - Alert history
- Command history and settings

## Architecture

```
src/
├── ai/                    # AI infrastructure
│   ├── providers/         # Groq, OpenAI, Anthropic, Ollama
│   ├── client.ts          # Multi-provider orchestrator
│   ├── agent.ts           # Chat agent with tools
│   └── cost.ts            # Usage tracking
├── services/              # Data services
│   ├── market.ts          # Stocks, quotes, charts
│   ├── options.ts         # Options chains, Greeks
│   ├── crypto.ts          # Cryptocurrency
│   └── providers/         # CoinGecko client
├── alerts/                # Alert system
│   ├── triggers.ts        # Condition detection
│   └── monitor.ts         # Background monitoring
├── db/                    # Database layer
│   ├── memory.ts          # Conversation memory
│   └── preferences.ts     # User preference learning
└── cli/                   # Terminal UI
```

## License

MIT
