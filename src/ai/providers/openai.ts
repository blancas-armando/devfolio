/**
 * OpenAI Provider Implementation
 * Supports GPT-4o and GPT-4o-mini models
 */

import OpenAI from 'openai';
import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIToolCall,
  AIProviderConfig,
} from './types.js';

// Cost per 1M tokens (USD)
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly defaultModel = 'gpt-4o-mini';
  readonly supportsTools = true;
  readonly supportsStreaming = true;

  private client: OpenAI | null = null;
  private apiKey: string | undefined;

  constructor(config?: AIProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  private getClient(): OpenAI {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const client = this.getClient();
    const model = request.model ?? this.defaultModel;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = request.messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: m.toolCallId ?? '',
          content: m.content,
        };
      }
      return {
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      };
    });

    const response = await client.chat.completions.create({
      model,
      messages,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.3,
      tools: request.tools?.map((t) => ({
        type: 'function' as const,
        function: t.function,
      })),
      tool_choice: request.tools ? (request.toolChoice ?? 'auto') : undefined,
    });

    const choice = response.choices[0];
    const toolCalls: AIToolCall[] = [];

    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        if (tc.type === 'function') {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          });
        }
      }
    }

    return {
      content: choice.message.content,
      toolCalls,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      model,
      provider: this.name,
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterable<AIStreamChunk> {
    const client = this.getClient();
    const model = request.model ?? this.defaultModel;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = request.messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: m.toolCallId ?? '',
          content: m.content,
        };
      }
      return {
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      };
    });

    const stream = await client.chat.completions.create({
      model,
      messages,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.3,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { content, done: false };
      }
    }

    yield { done: true };
  }

  estimateCost(promptTokens: number, completionTokens: number, model?: string): number {
    const pricing = OPENAI_PRICING[model ?? this.defaultModel] ?? OPENAI_PRICING[this.defaultModel];
    return (
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output
    );
  }
}
