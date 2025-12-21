/**
 * Output Components
 *
 * Components for displaying output, streaming text,
 * and message blocks.
 */

// Spinner components
export {
  Spinner,
  IndentedSpinner,
  ProcessingIndicator,
  InlineLoading,
  ProgressDots,
  type SpinnerProps,
  type SpinnerType,
  type IndentedSpinnerProps,
  type ProcessingIndicatorProps,
  type InlineLoadingProps,
  type ProgressDotsProps,
} from './Spinner.js';

// Streaming text components
export {
  StreamingText,
  StreamingContainer,
  Typewriter,
  AIResponse,
  type StreamingTextProps,
  type StreamingContainerProps,
  type TypewriterProps,
  type AIResponseProps,
} from './StreamingText.js';

// Message block components
export {
  MessageBlock,
  UserMessage,
  CommandEcho,
  ErrorMessage,
  SuccessMessage,
  WarningMessage,
  CommonErrors,
  type MessageBlockProps,
  type MessageRole,
  type UserMessageProps,
  type CommandEchoProps,
  type ErrorMessageProps,
  type SuccessMessageProps,
  type WarningMessageProps,
} from './MessageBlock.js';

// Output block rendering
export {
  OutputBlock,
  OutputStream,
  type OutputBlockProps,
  type OutputStreamProps,
} from './OutputBlock.js';
