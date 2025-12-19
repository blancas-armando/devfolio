import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import { colors } from '../../utils/colors.js';

interface FooterProps {
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function Footer({
  onSubmit,
  isLoading = false,
  placeholder = 'Ask anything...',
}: FooterProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (input: string) => {
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setValue('');
    }
  };

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
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={isLoading ? 'Thinking...' : placeholder}
      />
    </Box>
  );
}
