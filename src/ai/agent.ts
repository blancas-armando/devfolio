/**
 * AI Agent - Chat and tool orchestration
 * Uses the multi-provider AI client for all completions
 * Integrates conversational memory and user preferences
 */

import { complete, stream } from './client.js';
import { tools, type ToolName } from './tools.js';
import { executeTool } from './executor.js';
import { buildContextualPrompt, buildFullContext, SYSTEM_PROMPT } from './prompts.js';
import {
  getOrCreateSession,
  addMessage,
  trackSymbol,
  extractSymbolsFromText,
  type ChatSession,
} from '../db/memory.js';
import { learnFromText, type LearnedPreference } from '../db/preferences.js';
import type { Message, ToolResult } from '../types/index.js';
import type { AIMessage, AITool } from './providers/types.js';

export interface AgentResponse {
  message: string;
  toolResults: ToolResult[];
  sessionId?: number;
  learnedPreferences: LearnedPreference[];
}

// Current active session (managed per process)
let activeSession: ChatSession | null = null;

/**
 * Get or create the active chat session
 */
export function getActiveSession(): ChatSession {
  if (!activeSession) {
    activeSession = getOrCreateSession();
  }
  return activeSession;
}

/**
 * Start a new chat session
 */
export function startNewSession(): ChatSession {
  activeSession = getOrCreateSession();
  return activeSession;
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
 * Build messages array for AI request with memory context
 */
function buildMessages(userMessage: string, history: Message[], sessionId?: number): AIMessage[] {
  // Use contextual prompt if session exists, otherwise basic prompt
  const systemPrompt = sessionId ? buildContextualPrompt(sessionId) : SYSTEM_PROMPT;

  // Add financial context to user message for richer understanding
  const context = buildFullContext(sessionId);
  const enrichedUserMessage = context
    ? `${userMessage}\n\n[CONTEXT]\n${context}`
    : userMessage;

  return [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: enrichedUserMessage },
  ];
}

/**
 * Process and store conversation data
 * Returns learned preferences for transparency
 */
function processConversation(
  sessionId: number,
  userMessage: string,
  assistantMessage: string,
  toolCalls?: unknown[],
  toolResults?: unknown[]
): LearnedPreference[] {
  // Store messages
  addMessage(sessionId, 'user', userMessage);
  addMessage(sessionId, 'assistant', assistantMessage, toolCalls, toolResults);

  // Track mentioned symbols
  const userSymbols = extractSymbolsFromText(userMessage);
  const assistantSymbols = extractSymbolsFromText(assistantMessage);
  const allSymbols = [...new Set([...userSymbols, ...assistantSymbols])];

  for (const symbol of allSymbols) {
    trackSymbol(sessionId, symbol, userMessage.substring(0, 100));
  }

  // Learn preferences from user message and return what was learned
  return learnFromText(userMessage);
}

/**
 * Non-streaming chat with tool support and memory
 */
export async function chat(userMessage: string, history: Message[] = []): Promise<AgentResponse> {
  // Get or create session for memory
  const session = getActiveSession();
  const messages = buildMessages(userMessage, history, session.id);
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

    const assistantMessage = finalResponse.content ?? '';

    // Store conversation in memory and get learned preferences
    const learnedPreferences = processConversation(
      session.id,
      userMessage,
      assistantMessage,
      response.toolCalls,
      toolResults
    );

    return {
      message: assistantMessage,
      toolResults,
      sessionId: session.id,
      learnedPreferences,
    };
  }

  const assistantMessage = response.content ?? '';

  // Store conversation in memory and get learned preferences
  const learnedPreferences = processConversation(session.id, userMessage, assistantMessage);

  return {
    message: assistantMessage,
    toolResults: [],
    sessionId: session.id,
    learnedPreferences,
  };
}

/**
 * Streaming chat with tool support and memory
 * Tools are executed non-streaming, final response is streamed
 */
export async function streamChat(
  userMessage: string,
  history: Message[] = [],
  onToken: (token: string) => void
): Promise<AgentResponse> {
  // Get or create session for memory
  const session = getActiveSession();
  const messages = buildMessages(userMessage, history, session.id);
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

    // Store conversation in memory and get learned preferences
    const learnedPreferences = processConversation(
      session.id,
      userMessage,
      fullMessage,
      response.toolCalls,
      toolResults
    );

    return { message: fullMessage, toolResults, sessionId: session.id, learnedPreferences };
  }

  // No tools, emit response directly
  const content = response.content ?? '';
  onToken(content);

  // Store conversation in memory and get learned preferences
  const learnedPreferences = processConversation(session.id, userMessage, content);

  return { message: content, toolResults: [], sessionId: session.id, learnedPreferences };
}
