import { Box, Text } from 'ink';
import { colors } from '../../utils/colors.js';

interface HeaderProps {
  title?: string;
  status?: string;
}

export function Header({ title = 'DevFolio', status }: HeaderProps) {
  return (
    <Box
      borderStyle="single"
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
      justifyContent="space-between"
    >
      <Text bold color={colors.primary}>
        {title}
      </Text>
      {status && <Text color={colors.textSecondary}>{status}</Text>}
    </Box>
  );
}
