import Groq from 'groq-sdk';
import { tools, type ToolName } from './tools.js';
import { executeTool } from './executor.js';
import { SYSTEM_PROMPT } from './prompts.js';
import type { Message, ToolResult } from '../types/index.js';

// Lazy-load Groq client to allow dotenv to load first
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return _groq;
}

const MODEL = 'llama-3.3-70b-versatile';

interface AgentResponse {
  message: string;
  toolResults: ToolResult[];
}

export async function chat(
  userMessage: string,
  history: Message[] = []
): Promise<AgentResponse> {
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  const toolResults: ToolResult[] = [];
  let finalMessage = '';

  // Initial request
  const response = await getGroq().chat.completions.create({
    model: MODEL,
    messages,
    tools,
    tool_choice: 'auto',
    max_tokens: 1024,
  });

  const choice = response.choices[0];

  // Handle tool calls
  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    const toolMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      ...messages,
      choice.message,
    ];

    // Execute all tool calls
    for (const toolCall of choice.message.tool_calls) {
      const name = toolCall.function.name as ToolName;
      const args = JSON.parse(toolCall.function.arguments);

      const result = await executeTool(name, args);
      toolResults.push(result);

      toolMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result.result),
      });
    }

    // Get final response after tool execution
    const finalResponse = await getGroq().chat.completions.create({
      model: MODEL,
      messages: toolMessages,
      max_tokens: 256,
    });

    finalMessage = finalResponse.choices[0].message.content || '';
  } else {
    finalMessage = choice.message.content || '';
  }

  return {
    message: finalMessage,
    toolResults,
  };
}

export async function streamChat(
  userMessage: string,
  history: Message[] = [],
  onToken: (token: string) => void
): Promise<AgentResponse> {
  // For streaming, we first check for tool calls without streaming
  // Then stream the final response
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  const toolResults: ToolResult[] = [];

  // Initial request (non-streaming to check for tools)
  const response = await getGroq().chat.completions.create({
    model: MODEL,
    messages,
    tools,
    tool_choice: 'auto',
    max_tokens: 1024,
  });

  const choice = response.choices[0];

  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    const toolMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      ...messages,
      choice.message,
    ];

    // Execute tools
    for (const toolCall of choice.message.tool_calls) {
      const name = toolCall.function.name as ToolName;
      const args = JSON.parse(toolCall.function.arguments);

      const result = await executeTool(name, args);
      toolResults.push(result);

      toolMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result.result),
      });
    }

    // Stream final response
    const stream = await getGroq().chat.completions.create({
      model: MODEL,
      messages: toolMessages,
      max_tokens: 256,
      stream: true,
    });

    let fullMessage = '';
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        onToken(token);
        fullMessage += token;
      }
    }

    return { message: fullMessage, toolResults };
  } else {
    // No tools, just return the message
    const content = choice.message.content || '';
    onToken(content);
    return { message: content, toolResults: [] };
  }
}
