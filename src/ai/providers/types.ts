/**
 * AI Provider abstraction types
 * Defines the contract all providers must implement
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: AITool[];
  toolChoice?: 'auto' | 'none' | 'required';
  responseFormat?: 'text' | 'json';
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICompletionResponse {
  content: string | null;
  toolCalls: AIToolCall[];
  usage: AIUsage;
  model: string;
  provider: string;
}

export interface AIStreamChunk {
  content?: string;
  done: boolean;
}

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  readonly supportsTools: boolean;
  readonly supportsStreaming: boolean;

  /**
   * Check if provider is configured and available
   */
  isAvailable(): boolean;

  /**
   * Standard completion request
   */
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * Streaming completion - yields chunks
   */
  stream(request: AICompletionRequest): AsyncIterable<AIStreamChunk>;

  /**
   * Estimate cost for a request (USD)
   */
  estimateCost(promptTokens: number, completionTokens: number, model?: string): number;
}

export type ProviderName = 'groq' | 'openai' | 'anthropic' | 'ollama';

export interface ModelConfig {
  provider: ProviderName;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export type FeatureType = 'research' | 'quick' | 'chat' | 'summary' | 'filing';
