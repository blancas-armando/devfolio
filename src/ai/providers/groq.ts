/**
 * Groq Provider Implementation
 * Uses Groq's fast inference API with Llama models
 */

import Groq from 'groq-sdk';
import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIToolCall,
  AIProviderConfig,
} from './types.js';

// Cost per 1M tokens (USD)
const GROQ_PRICING: Record<string, { input: number; output: number }> = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  'gemma2-9b-it': { input: 0.20, output: 0.20 },
};

export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  readonly defaultModel = 'llama-3.3-70b-versatile';
  readonly supportsTools = true;
  readonly supportsStreaming = true;

  private client: Groq | null = null;
  private apiKey: string | undefined;

  constructor(config?: AIProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.GROQ_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  private getClient(): Groq {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }
      this.client = new Groq({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const client = this.getClient();
    const model = request.model ?? this.defaultModel;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = request.messages.map((m) => {
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
      tools: request.tools as Groq.Chat.ChatCompletionTool[] | undefined,
      tool_choice: request.tools ? (request.toolChoice ?? 'auto') : undefined,
    });

    const choice = response.choices[0];
    const toolCalls: AIToolCall[] = [];

    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        });
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

    const messages: Groq.Chat.ChatCompletionMessageParam[] = request.messages.map((m) => {
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
    const pricing = GROQ_PRICING[model ?? this.defaultModel] ?? GROQ_PRICING[this.defaultModel];
    return (
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output
    );
  }
}
