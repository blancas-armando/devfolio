/**
 * Anthropic Provider Implementation
 * Supports Claude 3.5 Sonnet and Haiku models
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIToolCall,
  AIProviderConfig,
} from './types.js';

// Cost per 1M tokens (USD)
const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
};

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly defaultModel = 'claude-3-5-sonnet-20241022';
  readonly supportsTools = true;
  readonly supportsStreaming = true;

  private client: Anthropic | null = null;
  private apiKey: string | undefined;

  constructor(config?: AIProviderConfig) {
    this.apiKey = config?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('Anthropic API key not configured');
      }
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const client = this.getClient();
    const model = request.model ?? this.defaultModel;

    // Extract system message and convert others
    let systemPrompt = '';
    const messages: Anthropic.MessageParam[] = [];

    for (const m of request.messages) {
      if (m.role === 'system') {
        systemPrompt = m.content;
      } else if (m.role === 'tool') {
        // Anthropic uses tool_result content blocks
        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.toolCallId ?? '',
              content: m.content,
            },
          ],
        });
      } else {
        messages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        });
      }
    }

    const tools: Anthropic.Tool[] | undefined = request.tools?.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters as Anthropic.Tool.InputSchema,
    }));

    const response = await client.messages.create({
      model,
      max_tokens: request.maxTokens ?? 1024,
      system: systemPrompt || undefined,
      messages,
      tools,
    });

    // Extract content and tool calls
    let content: string | null = null;
    const toolCalls: AIToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content = block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolCalls,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model,
      provider: this.name,
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterable<AIStreamChunk> {
    const client = this.getClient();
    const model = request.model ?? this.defaultModel;

    // Extract system message and convert others
    let systemPrompt = '';
    const messages: Anthropic.MessageParam[] = [];

    for (const m of request.messages) {
      if (m.role === 'system') {
        systemPrompt = m.content;
      } else if (m.role !== 'tool') {
        messages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        });
      }
    }

    const stream = client.messages.stream({
      model,
      max_tokens: request.maxTokens ?? 1024,
      system: systemPrompt || undefined,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { content: event.delta.text, done: false };
      }
    }

    yield { done: true };
  }

  estimateCost(promptTokens: number, completionTokens: number, model?: string): number {
    const pricing =
      ANTHROPIC_PRICING[model ?? this.defaultModel] ?? ANTHROPIC_PRICING[this.defaultModel];
    return (
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output
    );
  }
}
