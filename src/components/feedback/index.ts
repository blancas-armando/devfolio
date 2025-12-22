/**
 * Feedback Components
 *
 * Loading states, error handling, and user feedback components.
 */

// Skeleton/Loading placeholders
export {
  Skeleton,
  SkeletonText,
  SkeletonTable,
  SkeletonMetricGrid,
  SkeletonCard,
  SkeletonChart,
  SkeletonWrapper,
  type SkeletonProps,
  type SkeletonTextProps,
  type SkeletonTableProps,
  type SkeletonMetricGridProps,
  type SkeletonCardProps,
  type SkeletonChartProps,
  type SkeletonWrapperProps,
} from './Skeleton.js';

// Empty states
export {
  EmptyState,
  EmptyWatchlist,
  EmptyPortfolio,
  NoSearchResults,
  LoadError,
  emptyStatePresets,
  type EmptyStateProps,
} from './EmptyState.js';

// Progress indicators
export {
  ProgressBar,
  IndeterminateProgress,
  StepProgress,
  OperationProgress,
  MiniProgress,
  TransferProgress,
  type ProgressBarProps,
  type IndeterminateProgressProps,
  type StepProgressProps,
  type Step,
  type OperationProgressProps,
  type MiniProgressProps,
  type TransferProgressProps,
} from './Progress.js';

// Validation errors
export {
  FieldErrorDisplay,
  ValidationErrorList,
  InlineValidation,
  ValidationSummary,
  InputError,
  type FieldErrorDisplayProps,
  type ValidationErrorListProps,
  type InlineValidationProps,
  type ValidationSummaryProps,
  type InputErrorProps,
} from './ValidationError.js';

// Retry/Error recovery
export {
  RetryBlock,
  NetworkError,
  APIError,
  InlineRetry,
  type RetryBlockProps,
  type NetworkErrorProps,
  type APIErrorProps,
  type InlineRetryProps,
} from './RetryBlock.js';
