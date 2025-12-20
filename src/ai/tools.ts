export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'show_dashboard',
      description: 'Show the main dashboard with watchlist and portfolio summary',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_to_watchlist',
      description: 'Add one or more stock symbols to the watchlist',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: 'Stock ticker symbols to add (e.g., ["AAPL", "NVDA"])',
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_from_watchlist',
      description: 'Remove one or more stock symbols from the watchlist',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: 'Stock ticker symbols to remove',
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'lookup_stock',
      description: 'Get detailed quote and fundamentals for a stock',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol (e.g., "AAPL")',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_holding',
      description: 'Add a stock position to the portfolio',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol',
          },
          shares: {
            type: 'number',
            description: 'Number of shares',
          },
          cost_basis: {
            type: 'number',
            description: 'Cost per share in dollars',
          },
        },
        required: ['symbol', 'shares', 'cost_basis'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'show_portfolio',
      description: 'Display portfolio holdings and performance',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_news',
      description: 'Get financial news, optionally for a specific stock',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Optional stock symbol to get news for',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'lookup_etf',
      description: 'Look up an ETF fund to see its holdings, sector allocation, performance, and expense ratio. Use this for ETF tickers like VTI, SPY, QQQ, VOO, etc.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'ETF ticker symbol (e.g., "VTI", "SPY", "QQQ")',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compare_etfs',
      description: 'Compare two or three ETFs side by side - expense ratios, performance, holdings, and risk metrics',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: 'ETF ticker symbols to compare (2-3 symbols, e.g., ["VTI", "SPY"])',
            minItems: 2,
            maxItems: 3,
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compare_stocks',
      description: 'Compare two to four stocks side by side - valuation ratios (P/E, P/S, PEG), growth metrics, profitability margins, financial health, and analyst ratings. Use this when the user wants to decide between multiple stock options.',
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: 'Stock ticker symbols to compare (2-4 symbols, e.g., ["AAPL", "MSFT", "GOOGL", "NVDA"])',
            minItems: 2,
            maxItems: 4,
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_filings',
      description: 'Get recent SEC filings (10-K, 10-Q, 8-K) for a stock. Use this when the user asks about SEC filings, annual reports, quarterly reports, or regulatory filings.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol (e.g., "AAPL")',
          },
        },
        required: ['symbol'],
      },
    },
  },
];

export type ToolName =
  | 'show_dashboard'
  | 'add_to_watchlist'
  | 'remove_from_watchlist'
  | 'lookup_stock'
  | 'add_holding'
  | 'show_portfolio'
  | 'get_news'
  | 'lookup_etf'
  | 'compare_etfs'
  | 'compare_stocks'
  | 'get_filings';
