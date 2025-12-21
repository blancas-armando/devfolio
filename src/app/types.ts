import type { ReactNode } from 'react';
import type { Message, NewsItem, ToolResult } from '../types/index.js';

export type OutputBlockType =
  | 'text'
  | 'component'
  | 'streaming'
  | 'error'
  | 'command-echo';

export interface BaseOutputBlock {
  id: string;
  timestamp: number;
}

export interface TextOutputBlock extends BaseOutputBlock {
  type: 'text';
  content: string;
  style?: 'normal' | 'dim' | 'success' | 'error' | 'warning' | 'info';
}

export interface ComponentOutputBlock extends BaseOutputBlock {
  type: 'component';
  component: ReactNode;
  label?: string;
}

export interface StreamingOutputBlock extends BaseOutputBlock {
  type: 'streaming';
  content: string;
  complete: boolean;
}

export interface ErrorOutputBlock extends BaseOutputBlock {
  type: 'error';
  message: string;
  suggestions?: string[];
  tryCommands?: string[];
}

export interface CommandEchoBlock extends BaseOutputBlock {
  type: 'command-echo';
  command: string;
}

export type OutputBlock =
  | TextOutputBlock
  | ComponentOutputBlock
  | StreamingOutputBlock
  | ErrorOutputBlock
  | CommandEchoBlock;

export interface InputState {
  value: string;
  cursorPosition: number;
  completions: string[];
  completionIndex: number;
  historyIndex: number;
  savedInput: string;
}

export interface OutputState {
  blocks: OutputBlock[];
  streamingContent: string | null;
  isStreaming: boolean;
}

export interface ProcessingState {
  isProcessing: boolean;
  currentOperation: string | null;
  abortController: AbortController | null;
}

export interface ChatState {
  history: Message[];
}

export interface UIState {
  showCompletions: boolean;
  showWelcome: boolean;
  lastNewsArticles: NewsItem[];
  lastFilings: Array<{ symbol: string; type: string; date: string; url: string }>;
  lastFilingsSymbol: string;
}

export interface AppState {
  input: InputState;
  output: OutputState;
  processing: ProcessingState;
  chat: ChatState;
  ui: UIState;
}

export type AppAction =
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SET_CURSOR'; position: number }
  | { type: 'CLEAR_INPUT' }
  | { type: 'SUBMIT_COMMAND' }
  | { type: 'SET_COMPLETIONS'; completions: string[] }
  | { type: 'SELECT_COMPLETION'; index: number }
  | { type: 'CYCLE_COMPLETION'; direction: 'next' | 'prev' }
  | { type: 'APPLY_COMPLETION' }
  | { type: 'SHOW_COMPLETIONS'; show: boolean }
  | { type: 'HISTORY_PREV' }
  | { type: 'HISTORY_NEXT' }
  | { type: 'ADD_TO_HISTORY'; command: string }
  | { type: 'APPEND_OUTPUT'; block: OutputBlock }
  | { type: 'APPEND_TEXT'; content: string; style?: TextOutputBlock['style'] }
  | { type: 'APPEND_ERROR'; message: string; suggestions?: string[]; tryCommands?: string[] }
  | { type: 'APPEND_COMMAND_ECHO'; command: string }
  | { type: 'CLEAR_OUTPUT' }
  | { type: 'START_STREAMING' }
  | { type: 'UPDATE_STREAM'; content: string }
  | { type: 'APPEND_STREAM_CHUNK'; chunk: string }
  | { type: 'COMPLETE_STREAM' }
  | { type: 'START_PROCESSING'; operation: string }
  | { type: 'STOP_PROCESSING' }
  | { type: 'SET_ABORT_CONTROLLER'; controller: AbortController }
  | { type: 'CANCEL_OPERATION' }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'CLEAR_CHAT_HISTORY' }
  | { type: 'SHOW_WELCOME'; show: boolean }
  | { type: 'SET_LAST_NEWS'; articles: NewsItem[] }
  | { type: 'SET_LAST_FILINGS'; filings: UIState['lastFilings']; symbol: string }
  | { type: 'RESET_STATE' };

export const initialInputState: InputState = {
  value: '',
  cursorPosition: 0,
  completions: [],
  completionIndex: -1,
  historyIndex: -1,
  savedInput: '',
};

export const initialOutputState: OutputState = {
  blocks: [],
  streamingContent: null,
  isStreaming: false,
};

export const initialProcessingState: ProcessingState = {
  isProcessing: false,
  currentOperation: null,
  abortController: null,
};

export const initialChatState: ChatState = {
  history: [],
};

export const initialUIState: UIState = {
  showCompletions: false,
  showWelcome: true,
  lastNewsArticles: [],
  lastFilings: [],
  lastFilingsSymbol: '',
};

export const initialState: AppState = {
  input: initialInputState,
  output: initialOutputState,
  processing: initialProcessingState,
  chat: initialChatState,
  ui: initialUIState,
};

let blockIdCounter = 0;

export function generateBlockId(): string {
  return `block-${Date.now()}-${++blockIdCounter}`;
}

export function createTextBlock(
  content: string,
  style: TextOutputBlock['style'] = 'normal'
): TextOutputBlock {
  return {
    id: generateBlockId(),
    timestamp: Date.now(),
    type: 'text',
    content,
    style,
  };
}

export function createComponentBlock(
  component: ReactNode,
  label?: string
): ComponentOutputBlock {
  return {
    id: generateBlockId(),
    timestamp: Date.now(),
    type: 'component',
    component,
    label,
  };
}

export function createErrorBlock(
  message: string,
  suggestions?: string[],
  tryCommands?: string[]
): ErrorOutputBlock {
  return {
    id: generateBlockId(),
    timestamp: Date.now(),
    type: 'error',
    message,
    suggestions,
    tryCommands,
  };
}

export function createCommandEchoBlock(command: string): CommandEchoBlock {
  return {
    id: generateBlockId(),
    timestamp: Date.now(),
    type: 'command-echo',
    command,
  };
}

export function createStreamingBlock(): StreamingOutputBlock {
  return {
    id: generateBlockId(),
    timestamp: Date.now(),
    type: 'streaming',
    content: '',
    complete: false,
  };
}
