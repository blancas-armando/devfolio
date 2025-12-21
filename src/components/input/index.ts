/**
 * Input Components
 *
 * Components for command input, tab completion,
 * and user interaction.
 */

// Hooks
export {
  useTabCompletion,
  useHistory,
  useInputHandling,
  COMMANDS,
  SCREEN_PRESETS,
  POPULAR_SYMBOLS,
  type UseTabCompletionOptions,
  type UseTabCompletionResult,
  type UseHistoryResult,
  type UseInputHandlingResult,
} from './hooks.js';

// Tab completion components
export {
  TabCompleter,
  VerticalCompleter,
  InlineCompletion,
  type TabCompleterProps,
  type VerticalCompleterProps,
  type InlineCompletionProps,
} from './TabCompleter.js';

// Input box components
export {
  InputBox,
  MinimalInput,
  InputArea,
  type InputBoxProps,
  type MinimalInputProps,
  type InputAreaProps,
} from './InputBox.js';

// Command input
export {
  CommandInput,
  SimpleInput,
  type CommandInputProps,
  type SimpleInputProps,
} from './CommandInput.js';
