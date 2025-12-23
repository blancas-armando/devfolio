/**
 * Ollama Provider Implementation
 * For local/offline AI using Ollama
 */

import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIProviderConfig,
} from './types.js';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaStreamChunk {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  readonly defaultModel = 'llama3.2';
  readonly supportsTools = false; // Ollama tool support is limited
  readonly supportsStreaming = true;

  private baseUrl: string;

  constructor(config?: AIProviderConfig) {
    this.baseUrl = config?.baseUrl ?? process.env.OLLAMA_URL ?? 'http://localhost:11434';
  }

  isAvailable(): boolean {
    // Ollama is always "available" - we try to connect
    // Actual availability depends on whether server is running
    return true;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const model = request.model ?? this.defaultModel;

    // Convert messages (skip tool messages as Ollama doesn't support them well)
    const messages: OllamaMessage[] = request.messages
      .filter((m) => m.role !== 'tool')
      .map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.3,
          num_predict: request.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama request failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as OllamaResponse;

    return {
      content: data.message.content,
      toolCalls: [], // Ollama doesn't support tools in this implementation
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
      model,
      provider: this.name,
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterable<AIStreamChunk> {
    const model = request.model ?? this.defaultModel;

    // Convert messages
    const messages: OllamaMessage[] = request.messages
      .filter((m) => m.role !== 'tool')
      .map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: request.temperature ?? 0.3,
          num_predict: request.maxTokens ?? 1024,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama request failed: ${response.status} ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line) as OllamaStreamChunk;
          if (chunk.message?.content) {
            yield { content: chunk.message.content, done: false };
          }
          if (chunk.done) {
            yield { done: true };
            return;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    yield { done: true };
  }

  estimateCost(): number {
    // Ollama is free (local)
    return 0;
  }
}
