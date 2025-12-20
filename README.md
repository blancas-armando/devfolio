# DevFolio

AI-powered financial terminal for developers who invest. Track stocks, analyze market data, read SEC filings, and get AI-driven insights—all from your terminal.

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

- **AI Market Brief** — Get daily market analysis with indices, sectors, and outlook
- **Stock Profiles** — Company data, charts, metrics, and AI quick takes
- **Research Reports** — AI-generated stock research primers
- **SEC Filings** — Read 10-K, 10-Q, and 8-K filings directly in your terminal
- **Earnings Analysis** — Historical earnings with SEC data integration
- **Stock Screener** — Find stocks by preset screens (gainers, losers, sectors)
- **Market Pulse** — Real-time alerts with customizable thresholds
- **ETF Analysis** — Holdings, performance, and ETF comparisons
- **News Reader** — Financial news with sentiment analysis
- **Portfolio & Watchlist** — Track your investments locally
- **Natural Language** — Chat with AI about stocks and markets

## Installation

```bash
npm install -g devfolio
```

Or run directly:

```bash
npx devfolio
```

## Setup

1. Get a free API key from [Groq](https://console.groq.com)
2. Set your API key:
   ```bash
   export GROQ_API_KEY=your_key_here
   ```
3. Run DevFolio:
   ```bash
   devfolio
   ```

## Commands

### Market

| Command | Description |
|---------|-------------|
| `b`, `brief` | AI market analysis with indices, sectors, outlook |
| `pulse` | Market alerts with personalized thresholds + AI take |
| `pulse config` | View/edit pulse alert thresholds |
| `sc`, `screen <preset>` | Stock screener (gainers, losers, tech, value...) |
| `n`, `news [SYM]` | Market or stock news with sentiment |
| `read <N>` | Read article N |

### Stocks

| Command | Description |
|---------|-------------|
| `s <SYM> [TF]` | Stock profile with chart (e.g., `s AAPL 1y`) |
| `r <SYM>` | AI research primer report |
| `e <SYM>` | Earnings report with SEC data |
| `why <SYM>` | AI explanation of stock movement |
| `cs <S1> <S2>...` | Compare stocks side-by-side |

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
| `p`, `portfolio` | View portfolio summary |
| `add <SYM>` | Add to watchlist |
| `rm <SYM>` | Remove from watchlist |
| `groups` | List saved comparison groups |
| `group load <name>` | Load and compare a saved group |

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

# Compare tech stocks
> cs AAPL MSFT GOOGL AMZN

# Stock screener
> screen gainers
> screen tech
> screen value

# Read SEC filings
> filings TSLA
> filing 1

# Market pulse with custom thresholds
> pulse config
> pulse set vixThreshold 25

# News and articles
> news NVDA
> read 1
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
- **AI/LLM**: Groq API with Llama 3.3 70B
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
# Add your GROQ_API_KEY to .env

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

- `data.db` — SQLite database for watchlist, portfolio, and settings
- Command history and user preferences

## License

MIT
