import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import {
  type AppState,
  type AppAction,
  initialState,
  createTextBlock,
  createErrorBlock,
  createCommandEchoBlock,
  createStreamingBlock,
  generateBlockId,
} from './types.js';

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_INPUT':
      return {
        ...state,
        input: {
          ...state.input,
          value: action.value,
          cursorPosition: action.value.length,
          completionIndex: -1,
        },
      };

    case 'SET_CURSOR':
      return {
        ...state,
        input: {
          ...state.input,
          cursorPosition: action.position,
        },
      };

    case 'CLEAR_INPUT':
      return {
        ...state,
        input: {
          ...state.input,
          value: '',
          cursorPosition: 0,
          completionIndex: -1,
          historyIndex: -1,
          savedInput: '',
        },
        ui: {
          ...state.ui,
          showCompletions: false,
        },
      };

    case 'SUBMIT_COMMAND':
      return {
        ...state,
        input: {
          ...state.input,
          value: '',
          cursorPosition: 0,
          completionIndex: -1,
          historyIndex: -1,
          savedInput: '',
        },
        ui: {
          ...state.ui,
          showCompletions: false,
          showWelcome: false,
        },
      };

    case 'SET_COMPLETIONS':
      return {
        ...state,
        input: {
          ...state.input,
          completions: action.completions,
          completionIndex: -1,
        },
      };

    case 'SELECT_COMPLETION':
      return {
        ...state,
        input: {
          ...state.input,
          completionIndex: action.index,
        },
      };

    case 'CYCLE_COMPLETION': {
      const { completions, completionIndex } = state.input;
      if (completions.length === 0) return state;

      let newIndex: number;
      if (action.direction === 'next') {
        newIndex = completionIndex < completions.length - 1 ? completionIndex + 1 : 0;
      } else {
        newIndex = completionIndex > 0 ? completionIndex - 1 : completions.length - 1;
      }

      return {
        ...state,
        input: {
          ...state.input,
          completionIndex: newIndex,
        },
        ui: {
          ...state.ui,
          showCompletions: true,
        },
      };
    }

    case 'APPLY_COMPLETION': {
      const { completions, completionIndex } = state.input;
      if (completionIndex < 0 || completionIndex >= completions.length) return state;

      const completion = completions[completionIndex];
      return {
        ...state,
        input: {
          ...state.input,
          value: completion,
          cursorPosition: completion.length,
          completionIndex: -1,
        },
        ui: {
          ...state.ui,
          showCompletions: false,
        },
      };
    }

    case 'SHOW_COMPLETIONS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCompletions: action.show,
        },
      };

    case 'HISTORY_PREV':
    case 'HISTORY_NEXT':
    case 'ADD_TO_HISTORY':
      return state;

    case 'APPEND_OUTPUT':
      return {
        ...state,
        output: {
          ...state.output,
          blocks: [...state.output.blocks, action.block],
        },
      };

    case 'APPEND_TEXT':
      return {
        ...state,
        output: {
          ...state.output,
          blocks: [...state.output.blocks, createTextBlock(action.content, action.style)],
        },
      };

    case 'APPEND_ERROR':
      return {
        ...state,
        output: {
          ...state.output,
          blocks: [
            ...state.output.blocks,
            createErrorBlock(action.message, action.suggestions, action.tryCommands),
          ],
        },
      };

    case 'APPEND_COMMAND_ECHO':
      return {
        ...state,
        output: {
          ...state.output,
          blocks: [...state.output.blocks, createCommandEchoBlock(action.command)],
        },
      };

    case 'CLEAR_OUTPUT':
      return {
        ...state,
        output: {
          ...state.output,
          blocks: [],
          streamingContent: null,
          isStreaming: false,
        },
        ui: {
          ...state.ui,
          showWelcome: true,
        },
      };

    case 'START_STREAMING':
      return {
        ...state,
        output: {
          ...state.output,
          streamingContent: '',
          isStreaming: true,
        },
      };

    case 'UPDATE_STREAM':
      return {
        ...state,
        output: {
          ...state.output,
          streamingContent: action.content,
        },
      };

    case 'APPEND_STREAM_CHUNK':
      return {
        ...state,
        output: {
          ...state.output,
          streamingContent: (state.output.streamingContent || '') + action.chunk,
        },
      };

    case 'COMPLETE_STREAM': {
      const content = state.output.streamingContent || '';
      return {
        ...state,
        output: {
          ...state.output,
          blocks: content
            ? [...state.output.blocks, createTextBlock(content)]
            : state.output.blocks,
          streamingContent: null,
          isStreaming: false,
        },
      };
    }

    case 'START_PROCESSING':
      return {
        ...state,
        processing: {
          ...state.processing,
          isProcessing: true,
          currentOperation: action.operation,
        },
      };

    case 'STOP_PROCESSING':
      return {
        ...state,
        processing: {
          ...state.processing,
          isProcessing: false,
          currentOperation: null,
          abortController: null,
        },
      };

    case 'SET_ABORT_CONTROLLER':
      return {
        ...state,
        processing: {
          ...state.processing,
          abortController: action.controller,
        },
      };

    case 'CANCEL_OPERATION': {
      state.processing.abortController?.abort();
      return {
        ...state,
        processing: {
          ...state.processing,
          isProcessing: false,
          currentOperation: null,
          abortController: null,
        },
        output: {
          ...state.output,
          streamingContent: null,
          isStreaming: false,
        },
      };
    }

    case 'ADD_MESSAGE':
      return {
        ...state,
        chat: {
          ...state.chat,
          history: [...state.chat.history, action.message],
        },
      };

    case 'CLEAR_CHAT_HISTORY':
      return {
        ...state,
        chat: {
          ...state.chat,
          history: [],
        },
      };

    case 'SHOW_WELCOME':
      return {
        ...state,
        ui: {
          ...state.ui,
          showWelcome: action.show,
        },
      };

    case 'SET_LAST_NEWS':
      return {
        ...state,
        ui: {
          ...state.ui,
          lastNewsArticles: action.articles,
        },
      };

    case 'SET_LAST_FILINGS':
      return {
        ...state,
        ui: {
          ...state.ui,
          lastFilings: action.filings,
          lastFilingsSymbol: action.symbol,
        },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const { dispatch } = useAppState();
  return dispatch;
}

export function useInput() {
  const { state, dispatch } = useAppState();
  return {
    ...state.input,
    setValue: useCallback(
      (value: string) => dispatch({ type: 'SET_INPUT', value }),
      [dispatch]
    ),
    clear: useCallback(
      () => dispatch({ type: 'CLEAR_INPUT' }),
      [dispatch]
    ),
    submit: useCallback(
      () => dispatch({ type: 'SUBMIT_COMMAND' }),
      [dispatch]
    ),
  };
}

export function useOutput() {
  const { state, dispatch } = useAppState();
  return {
    ...state.output,
    appendText: useCallback(
      (content: string, style?: 'normal' | 'dim' | 'success' | 'error' | 'warning' | 'info') =>
        dispatch({ type: 'APPEND_TEXT', content, style }),
      [dispatch]
    ),
    appendError: useCallback(
      (message: string, suggestions?: string[], tryCommands?: string[]) =>
        dispatch({ type: 'APPEND_ERROR', message, suggestions, tryCommands }),
      [dispatch]
    ),
    clear: useCallback(
      () => dispatch({ type: 'CLEAR_OUTPUT' }),
      [dispatch]
    ),
  };
}

export function useProcessing() {
  const { state, dispatch } = useAppState();
  return {
    ...state.processing,
    start: useCallback(
      (operation: string) => dispatch({ type: 'START_PROCESSING', operation }),
      [dispatch]
    ),
    stop: useCallback(
      () => dispatch({ type: 'STOP_PROCESSING' }),
      [dispatch]
    ),
    cancel: useCallback(
      () => dispatch({ type: 'CANCEL_OPERATION' }),
      [dispatch]
    ),
  };
}

export function useChat() {
  const { state, dispatch } = useAppState();
  return {
    ...state.chat,
    addMessage: useCallback(
      (message: { role: 'user' | 'assistant' | 'system'; content: string }) =>
        dispatch({ type: 'ADD_MESSAGE', message }),
      [dispatch]
    ),
    clearHistory: useCallback(
      () => dispatch({ type: 'CLEAR_CHAT_HISTORY' }),
      [dispatch]
    ),
  };
}

export function useUI() {
  const { state, dispatch } = useAppState();
  return {
    ...state.ui,
    setShowWelcome: useCallback(
      (show: boolean) => dispatch({ type: 'SHOW_WELCOME', show }),
      [dispatch]
    ),
    setLastNews: useCallback(
      (articles: typeof state.ui.lastNewsArticles) =>
        dispatch({ type: 'SET_LAST_NEWS', articles }),
      [dispatch]
    ),
    setLastFilings: useCallback(
      (filings: typeof state.ui.lastFilings, symbol: string) =>
        dispatch({ type: 'SET_LAST_FILINGS', filings, symbol }),
      [dispatch]
    ),
  };
}
