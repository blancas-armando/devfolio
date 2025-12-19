import { Box, Text } from 'ink';
import { memo, useCallback } from 'react';
import TextInput from 'ink-text-input';
import { colors } from '../../utils/colors.js';

interface FooterProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const Footer = memo(function Footer({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Ask anything...',
}: FooterProps) {
  const handleSubmit = useCallback(
    (input: string) => {
      if (input.trim() && !isLoading) {
        onSubmit(input.trim());
      }
    },
    [onSubmit, isLoading]
  );

  return (
    <Box
      borderStyle="single"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
    >
      <Text color={colors.primary}>{'> '}</Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={handleSubmit}
        placeholder={isLoading ? 'Thinking...' : placeholder}
        focus={!isLoading}
      />
    </Box>
  );
});
