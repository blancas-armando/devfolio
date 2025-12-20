/**
 * Currency Service
 * Handles forex rates and currency conversion for international stocks
 */

import YahooFinance from 'yahoo-finance2';

// Initialize Yahoo Finance client
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export interface PriceInCurrency {
  amount: number;
  currency: string;
  amountUSD: number;
  exchangeRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Currency Definitions
// ═══════════════════════════════════════════════════════════════════════════

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  TWD: { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
};

// Exchange suffix to currency mapping
const EXCHANGE_CURRENCY: Record<string, string> = {
  '.L': 'GBP',   // London Stock Exchange (prices in pence)
  '.TO': 'CAD',  // Toronto Stock Exchange
  '.AX': 'AUD',  // Australian Stock Exchange
  '.HK': 'HKD',  // Hong Kong Stock Exchange
  '.T': 'JPY',   // Tokyo Stock Exchange
  '.SS': 'CNY',  // Shanghai Stock Exchange
  '.SZ': 'CNY',  // Shenzhen Stock Exchange
  '.PA': 'EUR',  // Paris Stock Exchange
  '.DE': 'EUR',  // German Stock Exchange
  '.AS': 'EUR',  // Amsterdam Stock Exchange
  '.MI': 'EUR',  // Milan Stock Exchange
  '.MC': 'EUR',  // Madrid Stock Exchange
  '.BR': 'EUR',  // Brussels Stock Exchange
  '.SW': 'CHF',  // Swiss Stock Exchange
  '.ST': 'SEK',  // Stockholm Stock Exchange
  '.OL': 'NOK',  // Oslo Stock Exchange
  '.CO': 'DKK',  // Copenhagen Stock Exchange
  '.NS': 'INR',  // National Stock Exchange India
  '.BO': 'INR',  // Bombay Stock Exchange
  '.KS': 'KRW',  // Korea Stock Exchange
  '.TW': 'TWD',  // Taiwan Stock Exchange
  '.SA': 'BRL',  // Sao Paulo Stock Exchange
  '.MX': 'MXN',  // Mexican Stock Exchange
  '.JO': 'ZAR',  // Johannesburg Stock Exchange
  '.SI': 'SGD',  // Singapore Stock Exchange
};

// ═══════════════════════════════════════════════════════════════════════════
// Cache
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const rateCache = new Map<string, { rate: number; timestamp: number }>();

// ═══════════════════════════════════════════════════════════════════════════
// Currency Detection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect currency from a stock symbol based on exchange suffix
 */
export function detectCurrencyFromSymbol(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();

  for (const [suffix, currency] of Object.entries(EXCHANGE_CURRENCY)) {
    if (upperSymbol.endsWith(suffix.toUpperCase())) {
      return currency;
    }
  }

  // Default to USD for US stocks (no suffix)
  return 'USD';
}

/**
 * Check if a symbol is likely a non-USD stock
 */
export function isInternationalStock(symbol: string): boolean {
  return detectCurrencyFromSymbol(symbol) !== 'USD';
}

// ═══════════════════════════════════════════════════════════════════════════
// Exchange Rates
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get exchange rate from currency to USD
 */
export async function getExchangeRate(fromCurrency: string): Promise<number> {
  if (fromCurrency === 'USD') return 1;

  const cacheKey = `${fromCurrency}USD`;
  const cached = rateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }

  try {
    // Yahoo Finance uses format like EURUSD=X
    const pair = `${fromCurrency}USD=X`;
    const result = await yahooFinance.quote(pair);

    if (result && result.regularMarketPrice) {
      const rate = result.regularMarketPrice;
      rateCache.set(cacheKey, { rate, timestamp: Date.now() });
      return rate;
    }

    return 1; // Fallback to 1 if rate not found
  } catch {
    // Return cached value even if expired, or 1 as fallback
    return cached?.rate ?? 1;
  }
}

/**
 * Get multiple exchange rates at once
 */
export async function getExchangeRates(currencies: string[]): Promise<Map<string, number>> {
  const uniqueCurrencies = [...new Set(currencies.filter(c => c !== 'USD'))];

  const rates = new Map<string, number>();
  rates.set('USD', 1);

  const results = await Promise.all(
    uniqueCurrencies.map(async (currency) => ({
      currency,
      rate: await getExchangeRate(currency),
    }))
  );

  for (const { currency, rate } of results) {
    rates.set(currency, rate);
  }

  return rates;
}

// ═══════════════════════════════════════════════════════════════════════════
// Price Conversion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert price to USD
 */
export async function convertToUSD(
  amount: number,
  fromCurrency: string
): Promise<PriceInCurrency> {
  const rate = await getExchangeRate(fromCurrency);

  // Special handling for GBP - London prices are often in pence
  let adjustedAmount = amount;
  if (fromCurrency === 'GBP' && amount > 1000) {
    // If price seems to be in pence (e.g., 15000p = £150), convert
    adjustedAmount = amount / 100;
  }

  return {
    amount: adjustedAmount,
    currency: fromCurrency,
    amountUSD: adjustedAmount * rate,
    exchangeRate: rate,
  };
}

/**
 * Convert USD to another currency
 */
export async function convertFromUSD(
  amountUSD: number,
  toCurrency: string
): Promise<PriceInCurrency> {
  const rate = await getExchangeRate(toCurrency);

  return {
    amount: amountUSD / rate,
    currency: toCurrency,
    amountUSD,
    exchangeRate: rate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Formatting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format price with currency symbol
 */
export function formatCurrencyPrice(
  amount: number,
  currencyCode: string,
  decimals: number = 2
): string {
  const currency = CURRENCIES[currencyCode];
  const symbol = currency?.symbol ?? currencyCode;

  // Some currencies don't use decimals (JPY, KRW)
  const noDecimalCurrencies = ['JPY', 'KRW', 'TWD'];
  const useDecimals = !noDecimalCurrencies.includes(currencyCode);

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: useDecimals ? decimals : 0,
    maximumFractionDigits: useDecimals ? decimals : 0,
  });

  return `${symbol}${formatted}`;
}

/**
 * Format price with both native and USD
 */
export function formatDualCurrency(price: PriceInCurrency): string {
  if (price.currency === 'USD') {
    return formatCurrencyPrice(price.amount, 'USD');
  }

  const native = formatCurrencyPrice(price.amount, price.currency);
  const usd = formatCurrencyPrice(price.amountUSD, 'USD');

  return `${native} (${usd})`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Stock Price Helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get stock price with currency info
 */
export async function getStockPriceWithCurrency(
  symbol: string,
  price: number
): Promise<PriceInCurrency> {
  const currency = detectCurrencyFromSymbol(symbol);
  return convertToUSD(price, currency);
}

/**
 * Get currency info for a symbol
 */
export function getCurrencyInfo(symbol: string): CurrencyInfo {
  const code = detectCurrencyFromSymbol(symbol);
  return CURRENCIES[code] ?? { code, name: code, symbol: code };
}
