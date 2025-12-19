import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testHook, actAsync, actSync } from '../test/hookTestUtils.js';
import { useChat } from './useChat.js';

const mockChatResponse = {
  message: 'Added AAPL to your watchlist.',
  toolResults: [{ name: 'add_to_watchlist', result: true, display: 'watchlist' as const }],
};

// Mock the AI agent
vi.mock('../ai/agent.js', () => ({
  chat: vi.fn(() => Promise.resolve(mockChatResponse)),
}));

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return stable callback references across renders', () => {
    const { result, rerender } = testHook(() => useChat());

    const initialSendMessage = result.current.sendMessage;
    const initialClearError = result.current.clearError;

    // Trigger a rerender
    rerender();

    // Callbacks should be the same reference when isProcessing hasn't changed
    expect(result.current.sendMessage).toBe(initialSendMessage);
    expect(result.current.clearError).toBe(initialClearError);
  });

  it('should start with empty state', () => {
    const { result } = testHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.assistantMessage).toBe('');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add messages and set assistant response', async () => {
    const { result } = testHook(() => useChat());

    await actAsync(async () => {
      await result.current.sendMessage('add AAPL to watchlist');
    });

    expect(result.current.messages).toHaveLength(2); // user + assistant
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('add AAPL to watchlist');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.assistantMessage).toBe('Added AAPL to your watchlist.');
  });

  it('should handle errors gracefully', async () => {
    const { chat } = await import('../ai/agent.js');
    vi.mocked(chat).mockRejectedValueOnce(new Error('API Error'));

    const { result } = testHook(() => useChat());

    await actAsync(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.assistantMessage).toBe('Error: API Error');
  });

  it('should clear error when clearError is called', async () => {
    const { chat } = await import('../ai/agent.js');
    vi.mocked(chat).mockRejectedValueOnce(new Error('API Error'));

    const { result } = testHook(() => useChat());

    await actAsync(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.error).toBe('API Error');

    actSync(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
