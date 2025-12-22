import type { ToolName } from './tools.js';
import type { ToolResult } from '../types/index.js';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../db/watchlist.js';
import { getPortfolio, addHolding } from '../db/portfolio.js';
import { getQuote, compareStocks } from '../services/market.js';
import { getETFProfile, compareETFs } from '../services/etf.js';
import { getRecentFilings } from '../services/sec.js';
import { validateToolArgs, isValidToolName, type ToolArgs } from './schemas.js';

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // Validate tool name
  if (!isValidToolName(name)) {
    return {
      name,
      result: { error: `Unknown tool: ${name}` },
    };
  }

  // Validate arguments with Zod
  const validation = validateToolArgs(name, args);
  if (!validation.success) {
    return {
      name,
      result: { error: validation.error },
    };
  }

  // Use validated args
  const validatedArgs = validation.data;

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
      const { symbols } = validatedArgs as ToolArgs<'add_to_watchlist'>;
      const added = addToWatchlist(symbols);
      return {
        name,
        result: { added, watchlist: getWatchlist() },
        display: 'watchlist',
      };
    }

    case 'remove_from_watchlist': {
      const { symbols } = validatedArgs as ToolArgs<'remove_from_watchlist'>;
      const removed = removeFromWatchlist(symbols);
      return {
        name,
        result: { removed, watchlist: getWatchlist() },
        display: 'watchlist',
      };
    }

    case 'lookup_stock': {
      const { symbol } = validatedArgs as ToolArgs<'lookup_stock'>;
      const quote = await getQuote(symbol);
      return {
        name,
        result: quote,
        display: 'stock',
      };
    }

    case 'add_holding': {
      const { symbol, shares, cost_basis } = validatedArgs as ToolArgs<'add_holding'>;
      const holding = addHolding(symbol, shares, cost_basis);
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

    case 'lookup_etf': {
      const { symbol } = validatedArgs as ToolArgs<'lookup_etf'>;
      const etf = await getETFProfile(symbol);
      if (!etf) {
        return {
          name,
          result: { error: `Could not find ETF: ${symbol}` },
        };
      }
      return {
        name,
        result: { symbol, etf },
        display: 'etf',
      };
    }

    case 'compare_etfs': {
      const { symbols } = validatedArgs as ToolArgs<'compare_etfs'>;
      const etfs = await compareETFs(symbols);
      if (etfs.length === 0) {
        return {
          name,
          result: { error: `Could not find any of the specified ETFs: ${symbols.join(', ')}` },
        };
      }
      return {
        name,
        result: { symbols: etfs.map(e => e.symbol), etfs },
        display: 'etf-compare',
      };
    }

    case 'compare_stocks': {
      const { symbols } = validatedArgs as ToolArgs<'compare_stocks'>;
      const profiles = await compareStocks(symbols);
      if (profiles.length === 0) {
        return {
          name,
          result: { error: `Could not find any of the specified stocks: ${symbols.join(', ')}` },
        };
      }
      return {
        name,
        result: { symbols: profiles.map(p => p.symbol), profiles },
        display: 'stock-compare',
      };
    }

    case 'get_filings': {
      const { symbol } = validatedArgs as ToolArgs<'get_filings'>;
      const filings = await getRecentFilings(symbol, ['10-K', '10-Q', '8-K'], 15);
      if (!filings || filings.length === 0) {
        return {
          name,
          result: { error: `No SEC filings found for ${symbol}` },
        };
      }
      return {
        name,
        result: { symbol, filings },
        display: 'filings',
      };
    }

    default:
      return {
        name,
        result: { error: `Unknown tool: ${name}` },
      };
  }
}
