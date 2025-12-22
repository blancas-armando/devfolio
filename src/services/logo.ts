/**
 * Company Logo Service
 * Fetches company logos and converts them to ASCII art
 */

import { Jimp } from 'jimp';
import { getDb } from '../db/index.js';

// ASCII characters from darkest to lightest
const ASCII_CHARS = ' .:-=+*#%@';
const ASCII_CHARS_BLOCKS = ' ░▒▓█';

// Cache TTL: 30 days in milliseconds
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Logo dimensions (characters)
const LOGO_WIDTH = 8;
const LOGO_HEIGHT = 4;

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface AsciiLogo {
  symbol: string;
  lines: string[];
  width: number;
  height: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Cache Operations
// ═══════════════════════════════════════════════════════════════════════════

function getCachedLogo(symbol: string): string | null {
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT ascii_art, cached_at FROM logo_cache WHERE symbol = ?
    `).get(symbol.toUpperCase()) as { ascii_art: string; cached_at: string } | undefined;

    if (!row) return null;

    // Check if cache is still valid
    const cachedAt = new Date(row.cached_at).getTime();
    if (Date.now() - cachedAt > CACHE_TTL_MS) {
      // Cache expired, delete it
      db.prepare('DELETE FROM logo_cache WHERE symbol = ?').run(symbol.toUpperCase());
      return null;
    }

    return row.ascii_art;
  } catch {
    return null;
  }
}

function setCachedLogo(symbol: string, asciiArt: string): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO logo_cache (symbol, ascii_art, cached_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(symbol.toUpperCase(), asciiArt);
  } catch {
    // Silently fail - caching is optional
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Logo Fetching
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract domain from a website URL
 */
function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Fetch logo image from Clearbit
 */
async function fetchLogoImage(domain: string): Promise<Buffer | null> {
  try {
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    const response = await fetch(logoUrl, {
      headers: {
        'User-Agent': 'DevFolio/1.0',
      },
    });

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ASCII Conversion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert RGBA integer to component values
 */
function intToRGBA(color: number): { r: number; g: number; b: number; a: number } {
  return {
    r: (color >> 24) & 0xff,
    g: (color >> 16) & 0xff,
    b: (color >> 8) & 0xff,
    a: color & 0xff,
  };
}

/**
 * Convert image buffer to ASCII art
 */
async function imageToAscii(
  imageBuffer: Buffer,
  width: number = LOGO_WIDTH,
  height: number = LOGO_HEIGHT,
  useBlocks: boolean = true
): Promise<string[]> {
  try {
    const image = await Jimp.read(imageBuffer);

    // Resize to target dimensions
    // Use double width because terminal chars are taller than wide
    image.resize({ w: width * 2, h: height });

    // Convert to grayscale
    image.greyscale();

    const chars = useBlocks ? ASCII_CHARS_BLOCKS : ASCII_CHARS;
    const lines: string[] = [];

    for (let y = 0; y < image.height; y++) {
      let line = '';
      for (let x = 0; x < image.width; x += 2) {
        // Sample two horizontal pixels and average them
        const color1 = intToRGBA(image.getPixelColor(x, y));
        const color2 = x + 1 < image.width
          ? intToRGBA(image.getPixelColor(x + 1, y))
          : color1;

        // Average brightness (0-255)
        const brightness = (color1.r + color2.r) / 2;

        // Handle transparency - treat as white (background)
        const alpha = (color1.a + color2.a) / 2;
        const effectiveBrightness = alpha < 128 ? 255 : brightness;

        // Map to ASCII character (inverted: dark pixels = dense chars)
        const charIndex = Math.floor((1 - effectiveBrightness / 255) * (chars.length - 1));
        line += chars[Math.max(0, Math.min(chars.length - 1, charIndex))];
      }
      lines.push(line);
    }

    return lines;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get ASCII logo for a company
 * @param symbol Stock ticker symbol
 * @param website Company website (from Yahoo Finance profile)
 * @returns ASCII logo or null if unavailable
 */
export async function getAsciiLogo(
  symbol: string,
  website: string | null
): Promise<AsciiLogo | null> {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first
  const cached = getCachedLogo(upperSymbol);
  if (cached) {
    const lines = cached.split('\n');
    return {
      symbol: upperSymbol,
      lines,
      width: lines[0]?.length ?? 0,
      height: lines.length,
    };
  }

  // No website = no logo
  if (!website) return null;

  // Extract domain
  const domain = extractDomain(website);
  if (!domain) return null;

  // Fetch logo
  const imageBuffer = await fetchLogoImage(domain);
  if (!imageBuffer) return null;

  // Convert to ASCII
  const lines = await imageToAscii(imageBuffer);
  if (lines.length === 0) return null;

  // Cache the result
  const asciiArt = lines.join('\n');
  setCachedLogo(upperSymbol, asciiArt);

  return {
    symbol: upperSymbol,
    lines,
    width: lines[0]?.length ?? 0,
    height: lines.length,
  };
}

/**
 * Pre-fetch and cache logos for multiple symbols
 * Useful for batch operations like watchlist display
 */
export async function prefetchLogos(
  symbols: Array<{ symbol: string; website: string | null }>
): Promise<void> {
  // Process in parallel but with concurrency limit
  const CONCURRENCY = 3;
  const chunks: Array<typeof symbols> = [];

  for (let i = 0; i < symbols.length; i += CONCURRENCY) {
    chunks.push(symbols.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(({ symbol, website }) => getAsciiLogo(symbol, website))
    );
  }
}

/**
 * Clear logo cache (useful for testing or forcing refresh)
 */
export function clearLogoCache(): void {
  try {
    const db = getDb();
    db.prepare('DELETE FROM logo_cache').run();
  } catch {
    // Silently fail
  }
}
