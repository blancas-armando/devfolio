/**
 * AI Client - Main orchestrator for AI providers
 * Handles provider selection, fallback chains, and retries
 */

import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  ProviderName,
  FeatureType,
} from './providers/types.js';
import { GroqProvider } from './providers/groq.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';
import { getAIConfig } from './config.js';
import { withRetry, DEFAULT_RETRY_CONFIG } from './retry.js';

// Singleton providers - lazy initialized
const providers: Map<ProviderName, AIProvider> = new Map();

/**
 * Get or create a provider instance
 */
function getProvider(name: ProviderName): AIProvider {
  let provider = providers.get(name);
  if (!provider) {
    switch (name) {
      case 'groq':
        provider = new GroqProvider();
        break;
      case 'openai':
        provider = new OpenAIProvider();
        break;
      case 'anthropic':
        provider = new AnthropicProvider();
        break;
      case 'ollama':
        provider = new OllamaProvider();
        break;
    }
    providers.set(name, provider);
  }
  return provider;
}

/**
 * Build fallback chain starting with the feature's configured provider
 */
function buildFallbackChain(featureProvider: ProviderName): ProviderName[] {
  const config = getAIConfig();
  const chain: ProviderName[] = [featureProvider];

  // Add other providers from fallback chain that aren't already included
  for (const name of config.fallbackChain) {
    if (!chain.includes(name)) {
      chain.push(name);
    }
  }

  return chain;
}

export interface AIClientOptions {
  /** Override the feature type to use different model config */
  feature?: FeatureType;
  /** Skip fallback chain, only use specified provider */
  noFallback?: boolean;
}

/**
 * Complete a request using the configured provider with fallback support
 */
export async function complete(
  request: AICompletionRequest,
  feature: FeatureType = 'chat',
  options: AIClientOptions = {}
): Promise<AICompletionResponse> {
  const config = getAIConfig();
  const featureConfig = config.features[options.feature ?? feature];
  const chain = options.noFallback
    ? [featureConfig.provider]
    : buildFallbackChain(featureConfig.provider);

  let lastError: Error | null = null;

  for (const providerName of chain) {
    const provider = getProvider(providerName);

    if (!provider.isAvailable()) {
      continue;
    }

    try {
      // Build request with feature config defaults
      const fullRequest: AICompletionRequest = {
        ...request,
        model: request.model ?? featureConfig.model,
        maxTokens: request.maxTokens ?? featureConfig.maxTokens ?? config.defaultMaxTokens,
        temperature: request.temperature ?? featureConfig.temperature ?? config.defaultTemperature,
      };

      // Execute with retry
      return await withRetry(() => provider.complete(fullRequest), DEFAULT_RETRY_CONFIG);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next provider in chain
    }
  }

  throw lastError ?? new Error('No AI provider available');
}

/**
 * Stream a response using the configured provider
 * Note: Streaming does not support fallback mid-stream
 */
export async function* stream(
  request: AICompletionRequest,
  feature: FeatureType = 'chat'
): AsyncIterable<AIStreamChunk> {
  const config = getAIConfig();
  const featureConfig = config.features[feature];

  // Find first available provider that supports streaming
  const chain = buildFallbackChain(featureConfig.provider);

  for (const providerName of chain) {
    const provider = getProvider(providerName);

    if (!provider.isAvailable() || !provider.supportsStreaming) {
      continue;
    }

    try {
      const fullRequest: AICompletionRequest = {
        ...request,
        model: request.model ?? featureConfig.model,
        maxTokens: request.maxTokens ?? featureConfig.maxTokens ?? config.defaultMaxTokens,
        temperature: request.temperature ?? featureConfig.temperature ?? config.defaultTemperature,
      };

      yield* provider.stream(fullRequest);
      return;
    } catch (error) {
      // Try next provider
      continue;
    }
  }

  throw new Error('No streaming-capable AI provider available');
}

/**
 * Check if any AI provider is available
 */
export function isAIAvailable(): boolean {
  const config = getAIConfig();
  return config.fallbackChain.some((name) => getProvider(name).isAvailable());
}

/**
 * Get the name of the first available provider
 */
export function getActiveProvider(): ProviderName | null {
  const config = getAIConfig();
  for (const name of config.fallbackChain) {
    if (getProvider(name).isAvailable()) {
      return name;
    }
  }
  return null;
}

/**
 * Get cost estimate for a completion
 */
export function estimateCost(
  promptTokens: number,
  completionTokens: number,
  feature: FeatureType = 'chat'
): number {
  const config = getAIConfig();
  const featureConfig = config.features[feature];
  const provider = getProvider(featureConfig.provider);
  return provider.estimateCost(promptTokens, completionTokens, featureConfig.model);
}
