# DevFolio

AI-powered finance TUI for developers who invest. Track your portfolio, monitor stocks, and analyze market data—all from your terminal with natural language.

```
┌─────────────────────────────────────────────────────────────────┐
│ DevFolio                                           ESC to reset │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Watchlist                              Live · Updated just now │
│  ─────────────────────────────────────────────────────────────  │
│  Symbol   Price      Change     Volume      7D                  │
│  AAPL     $195.20    +2.35%     52.3M       ▁▂▃▅▆▇█▇▆           │
│  NVDA     $475.80    +4.12%     38.1M       ▁▁▂▃▅▆▇██           │
│  MSFT     $425.00    -0.82%     28.7M       █▇▆▆▅▅▄▃▂           │
│  TSLA     $248.50    +1.23%     71.2M       ▃▂▁▂▃▄▅▆▇           │
│                                                                 │
│  Portfolio                                    $127,450 (+12.3%) │
│  ─────────────────────────────────────────────────────────────  │
│  ██████████████████░░░░░░░░  NVDA    $11,895   42%   +69.6%     │
│  ████████████░░░░░░░░░░░░░░  AAPL    $9,760    34%   +30.1%     │
│  ███████░░░░░░░░░░░░░░░░░░░  TSLA    $7,455    24%   +12.9%     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ > show NVDA options expiring friday                             │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Natural Language Interface** — Ask questions like "how's my portfolio doing?" or "add AAPL to watchlist"
- **Real-Time Quotes** — Live stock prices with 7-day sparkline charts
- **Portfolio Tracking** — Track holdings, P&L, and allocation
- **Watchlist** — Monitor your favorite stocks at a glance
- **Beautiful TUI** — Terminal UI that's actually pleasant to use

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

## Usage

Just type naturally:

```
> add AAPL, NVDA, TSLA to my watchlist
Added AAPL, NVDA, TSLA to your watchlist.

> I bought 50 shares of AAPL at $150
Added 50 shares of AAPL at $150.00 to your portfolio.

> how's my portfolio doing?
Your portfolio is up 12.3% overall. NVDA is your best performer at +69.6%.

> show me TSLA options expiring next week
[displays options chain]

> news for NVDA
[displays recent headlines]
```

### Keyboard Shortcuts

- `ESC` — Reset view / clear response
- `Ctrl+C` — Exit

## Tech Stack

- **Ink** — React for the terminal
- **Groq** — Fast LLM inference (Llama 3.3 70B)
- **Yahoo Finance** — Market data
- **SQLite** — Local data persistence
- **TypeScript** — Type-safe codebase

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
```

## License

MIT
