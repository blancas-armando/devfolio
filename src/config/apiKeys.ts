/**
 * Centralized API Key Configuration
 *
 * Single source of truth for all API keys used by the application.
 * Loads from environment variables and provides utility functions.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type AIProviderName = 'groq' | 'openai' | 'anthropic' | 'ollama';

export interface APIKeyConfig {
  // AI Providers
  groq?: string;
  openai?: string;
  anthropic?: string;

  // External APIs (if needed in future)
  // alphaVantage?: string;
  // finnhub?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Configuration Loading
// ═══════════════════════════════════════════════════════════════════════════

let cachedConfig: APIKeyConfig | null = null;

/**
 * Load API keys from environment variables
 * Caches result for subsequent calls
 */
export function loadApiKeys(): APIKeyConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    groq: process.env.GROQ_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };

  return cachedConfig;
}

/**
 * Clear cached config (useful for testing or reconfiguration)
 */
export function clearApiKeyCache(): void {
  cachedConfig = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Accessors
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a specific API key by provider name
 */
export function getApiKey(provider: keyof APIKeyConfig): string | undefined {
  const config = loadApiKeys();
  return config[provider];
}

/**
 * Check if a specific provider has an API key configured
 */
export function hasApiKey(provider: keyof APIKeyConfig): boolean {
  return !!getApiKey(provider);
}

/**
 * Check if any AI provider is configured
 * (Ollama doesn't need a key, so check separately)
 */
export function hasAnyAIProvider(): boolean {
  const config = loadApiKeys();
  return !!(config.groq || config.openai || config.anthropic);
}

/**
 * Get list of available (configured) AI providers
 */
export function getAvailableProviders(): AIProviderName[] {
  const config = loadApiKeys();
  const available: AIProviderName[] = [];

  if (config.groq) available.push('groq');
  if (config.openai) available.push('openai');
  if (config.anthropic) available.push('anthropic');

  // Ollama is always "available" but may not be running
  available.push('ollama');

  return available;
}

/**
 * Get the preferred AI provider (first available)
 * Priority: groq > openai > anthropic > ollama
 */
export function getPreferredProvider(): AIProviderName {
  const config = loadApiKeys();

  if (config.groq) return 'groq';
  if (config.openai) return 'openai';
  if (config.anthropic) return 'anthropic';

  return 'ollama';
}

// ═══════════════════════════════════════════════════════════════════════════
// Environment Variable Names (for documentation)
// ═══════════════════════════════════════════════════════════════════════════

export const API_KEY_ENV_VARS = {
  groq: 'GROQ_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
} as const;
