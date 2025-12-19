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
];

export type ToolName =
  | 'show_dashboard'
  | 'add_to_watchlist'
  | 'remove_from_watchlist'
  | 'lookup_stock'
  | 'add_holding'
  | 'show_portfolio'
  | 'get_news';
