import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { colors } from '../utils/colors.js';

interface InputPromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputPrompt({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Ask anything...',
}: InputPromptProps) {
  const handleSubmit = (input: string) => {
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
    }
  };

  return (
    <Box>
      <Text color={colors.primary} bold>{'❯ '}</Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={handleSubmit}
        placeholder={disabled ? 'Processing...' : placeholder}
        focus={!disabled}
      />
    </Box>
  );
}
