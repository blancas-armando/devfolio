import { useState, useCallback, useRef } from 'react';
import type { Message, ToolResult } from '../types/index.js';
import { chat } from '../ai/agent.js';

interface ChatResponse {
  message: string;
  toolResults: ToolResult[];
}

interface UseChatResult {
  messages: Message[];
  assistantMessage: string;
  isProcessing: boolean;
  error: string | null;
  sendMessage: (input: string) => Promise<ChatResponse | null>;
  clearError: () => void;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to access current messages without recreating callback
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (input: string): Promise<ChatResponse | null> => {
    if (isProcessing) return null;

    setIsProcessing(true);
    setAssistantMessage('');
    setError(null);

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await chat(input, messagesRef.current);

      setAssistantMessage(response.message);

      const assistantMsg: Message = { role: 'assistant', content: response.message };
      setMessages((prev) => [...prev, assistantMsg]);

      return response;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Something went wrong';
      setError(errorMessage);
      setAssistantMessage(`Error: ${errorMessage}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    assistantMessage,
    isProcessing,
    error,
    sendMessage,
    clearError,
  };
}
