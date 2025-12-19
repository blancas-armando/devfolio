import { Box } from 'ink';
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <Box
      flexDirection="column"
      width="100%"
      minHeight={24}
    >
      {children}
    </Box>
  );
}
