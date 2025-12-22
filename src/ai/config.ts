/**
 * AI Configuration
 * Defines provider settings, model selection per feature, and fallback chains
 */

import type { ProviderName, ModelConfig, FeatureType } from './providers/types.js';

export interface ProviderCredentials {
  groq?: string;
  openai?: string;
  anthropic?: string;
  ollamaUrl?: string;
}

export interface AIConfig {
  /** Model configuration per feature type */
  features: Record<FeatureType, ModelConfig>;

  /** Ordered fallback chain when primary provider fails */
  fallbackChain: ProviderName[];

  /** Provider credentials (from env vars) */
  credentials: ProviderCredentials;

  /** Default temperature for completions */
  defaultTemperature: number;

  /** Default max tokens */
  defaultMaxTokens: number;
}

/**
 * Load credentials from environment variables
 */
function loadCredentials(): ProviderCredentials {
  return {
    groq: process.env.GROQ_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  };
}

/**
 * Default AI configuration
 * Uses Groq by default (free tier available)
 */
export function getDefaultAIConfig(): AIConfig {
  const defaultGroqModel: ModelConfig = {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  };

  return {
    features: {
      research: { ...defaultGroqModel, maxTokens: 2000, temperature: 0.3 },
      quick: { ...defaultGroqModel, maxTokens: 400, temperature: 0.3 },
      chat: { ...defaultGroqModel, maxTokens: 1024, temperature: 0.7 },
      summary: { ...defaultGroqModel, maxTokens: 512, temperature: 0.3 },
      filing: { ...defaultGroqModel, maxTokens: 1500, temperature: 0.3 },
    },
    fallbackChain: ['groq', 'openai', 'anthropic', 'ollama'],
    credentials: loadCredentials(),
    defaultTemperature: 0.3,
    defaultMaxTokens: 1024,
  };
}

// Singleton config instance
let _config: AIConfig | null = null;

/**
 * Get the current AI configuration
 * Lazily initializes with defaults
 */
export function getAIConfig(): AIConfig {
  if (!_config) {
    _config = getDefaultAIConfig();
  }
  return _config;
}

/**
 * Update AI configuration
 * Used for runtime configuration changes
 */
export function updateAIConfig(updates: Partial<AIConfig>): void {
  const current = getAIConfig();
  _config = { ...current, ...updates };
}

/**
 * Reset configuration to defaults
 * Useful for testing
 */
export function resetAIConfig(): void {
  _config = null;
}

/**
 * Check if any AI provider is configured
 */
export function hasAnyProvider(): boolean {
  const creds = loadCredentials();
  return !!(creds.groq || creds.openai || creds.anthropic);
}

/**
 * Get list of available providers based on credentials
 */
export function getAvailableProviders(): ProviderName[] {
  const creds = loadCredentials();
  const available: ProviderName[] = [];

  if (creds.groq) available.push('groq');
  if (creds.openai) available.push('openai');
  if (creds.anthropic) available.push('anthropic');
  // Ollama is always "available" (local)
  available.push('ollama');

  return available;
}
