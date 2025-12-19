import { Component, type ReactNode } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../utils/colors.js';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Error is stored in state, displayed in UI
    // No console logging to avoid TUI corruption
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          flexDirection="column"
          paddingX={2}
          paddingY={1}
          borderStyle="single"
          borderColor={colors.danger}
        >
          <Text bold color={colors.danger}>
            Something went wrong
          </Text>
          <Box marginTop={1}>
            <Text color={colors.textSecondary}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textTertiary}>
              Press Ctrl+C to exit and restart the application.
            </Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
