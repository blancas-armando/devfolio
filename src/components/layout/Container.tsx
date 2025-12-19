import { Box } from 'ink';
import { memo, type ReactNode } from 'react';
import { MIN_CONTAINER_HEIGHT } from '../../constants/index.js';

interface ContainerProps {
  children: ReactNode;
}

export const Container = memo(function Container({ children }: ContainerProps) {
  return (
    <Box flexDirection="column" width="100%" minHeight={MIN_CONTAINER_HEIGHT}>
      {children}
    </Box>
  );
});
