import { Box, Text } from 'ink';
import InkSpinner from 'ink-spinner';
import { colors } from '../../utils/colors.js';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Loading...' }: SpinnerProps) {
  return (
    <Box>
      <Text color={colors.primary}>
        <InkSpinner type="dots" />
      </Text>
      <Text color={colors.textSecondary}>{` ${label}`}</Text>
    </Box>
  );
}
