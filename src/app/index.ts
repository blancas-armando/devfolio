/**
 * App Module
 *
 * Exports for the Ink application state and context.
 */

// Types
export type {
  AppState,
  AppAction,
  InputState,
  OutputState,
  ProcessingState,
  ChatState,
  UIState,
  OutputBlock,
  OutputBlockType,
  TextOutputBlock,
  ComponentOutputBlock,
  StreamingOutputBlock,
  ErrorOutputBlock,
  CommandEchoBlock,
} from './types.js';

// Initial states
export {
  initialState,
  initialInputState,
  initialOutputState,
  initialProcessingState,
  initialChatState,
  initialUIState,
} from './types.js';

// Block creation utilities
export {
  generateBlockId,
  createTextBlock,
  createComponentBlock,
  createErrorBlock,
  createCommandEchoBlock,
  createStreamingBlock,
} from './types.js';

// Context and hooks
export {
  AppProvider,
  useAppState,
  useAppDispatch,
  useInput,
  useOutput,
  useProcessing,
  useChat,
  useUI,
} from './AppContext.js';
