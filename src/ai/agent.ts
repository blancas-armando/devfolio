/**
 * AI Agent - Chat and tool orchestration
 * Uses the multi-provider AI client for all completions
 */

import { complete, stream } from './client.js';
import { tools, type ToolName } from './tools.js';
import { executeTool } from './executor.js';
import { SYSTEM_PROMPT } from './prompts.js';
import type { Message, ToolResult } from '../types/index.js';
import type { AIMessage, AITool } from './providers/types.js';

export interface AgentResponse {
  message: string;
  toolResults: ToolResult[];
}

/**
 * Convert tools to AI provider format
 */
const aiTools: AITool[] = tools.map((t) => ({
  type: 'function' as const,
  function: {
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters,
  },
}));

/**
 * Build messages array for AI request
 */
function buildMessages(userMessage: string, history: Message[]): AIMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];
}

/**
 * Non-streaming chat with tool support
 */
export async function chat(userMessage: string, history: Message[] = []): Promise<AgentResponse> {
  const messages = buildMessages(userMessage, history);
  const toolResults: ToolResult[] = [];

  // Initial request with tools
  const response = await complete(
    {
      messages,
      tools: aiTools,
      toolChoice: 'auto',
      maxTokens: 1024,
    },
    'chat'
  );

  // Handle tool calls if present
  if (response.toolCalls.length > 0) {
    const toolMessages: AIMessage[] = [
      ...messages,
      { role: 'assistant', content: response.content ?? '' },
    ];

    // Execute all tool calls
    for (const toolCall of response.toolCalls) {
      const result = await executeTool(toolCall.name as ToolName, toolCall.arguments);
      toolResults.push(result);

      toolMessages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        content: JSON.stringify(result.result),
      });
    }

    // Get final response after tool execution
    const finalResponse = await complete(
      {
        messages: toolMessages,
        maxTokens: 256,
      },
      'chat'
    );

    return {
      message: finalResponse.content ?? '',
      toolResults,
    };
  }

  return {
    message: response.content ?? '',
    toolResults: [],
  };
}

/**
 * Streaming chat with tool support
 * Tools are executed non-streaming, final response is streamed
 */
export async function streamChat(
  userMessage: string,
  history: Message[] = [],
  onToken: (token: string) => void
): Promise<AgentResponse> {
  const messages = buildMessages(userMessage, history);
  const toolResults: ToolResult[] = [];

  // Initial request (non-streaming to check for tools)
  const response = await complete(
    {
      messages,
      tools: aiTools,
      toolChoice: 'auto',
      maxTokens: 1024,
    },
    'chat'
  );

  // Handle tool calls
  if (response.toolCalls.length > 0) {
    const toolMessages: AIMessage[] = [
      ...messages,
      { role: 'assistant', content: response.content ?? '' },
    ];

    // Execute tools
    for (const toolCall of response.toolCalls) {
      const result = await executeTool(toolCall.name as ToolName, toolCall.arguments);
      toolResults.push(result);

      toolMessages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        content: JSON.stringify(result.result),
      });
    }

    // Stream final response
    let fullMessage = '';
    for await (const chunk of stream({ messages: toolMessages, maxTokens: 256 }, 'chat')) {
      if (chunk.content) {
        onToken(chunk.content);
        fullMessage += chunk.content;
      }
    }

    return { message: fullMessage, toolResults };
  }

  // No tools, emit response directly
  const content = response.content ?? '';
  onToken(content);
  return { message: content, toolResults: [] };
}
