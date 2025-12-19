import type { ToolName } from './tools.js';
import type { ToolResult } from '../types/index.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../db/watchlist.js';
import { getPortfolio, addHolding } from '../db/portfolio.js';
import { getQuote } from '../services/market.js';

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case 'show_dashboard': {
      const watchlist = getWatchlist();
      const portfolio = await getPortfolio();
      return {
        name,
        result: { watchlist, portfolio },
        display: 'dashboard',
      };
    }

    case 'add_to_watchlist': {
      const symbols = args.symbols as string[];
      const added = addToWatchlist(symbols);
      return {
        name,
        result: { added, watchlist: getWatchlist() },
        display: 'watchlist',
      };
    }

    case 'remove_from_watchlist': {
      const symbols = args.symbols as string[];
      const removed = removeFromWatchlist(symbols);
      return {
        name,
        result: { removed, watchlist: getWatchlist() },
        display: 'watchlist',
      };
    }

    case 'lookup_stock': {
      const symbol = args.symbol as string;
      const quote = await getQuote(symbol);
      return {
        name,
        result: quote,
        display: 'stock',
      };
    }

    case 'add_holding': {
      const symbol = args.symbol as string;
      const shares = args.shares as number;
      const costBasis = args.cost_basis as number;
      const holding = addHolding(symbol, shares, costBasis);
      const portfolio = await getPortfolio();
      return {
        name,
        result: { holding, portfolio },
        display: 'portfolio',
      };
    }

    case 'show_portfolio': {
      const portfolio = await getPortfolio();
      return {
        name,
        result: portfolio,
        display: 'portfolio',
      };
    }

    case 'get_news': {
      // For now, return a placeholder - can integrate news API later
      return {
        name,
        result: { message: 'News feature coming soon' },
        display: 'news',
      };
    }

    default:
      return {
        name,
        result: { error: `Unknown tool: ${name}` },
      };
  }
}
