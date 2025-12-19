import { Box, Text } from 'ink';
import { memo } from 'react';
import { generateHorizontalBar } from '../../utils/charts.js';
import { colors } from '../../utils/colors.js';

interface ProgressBarProps {
  percent: number;
  width?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
}

export const ProgressBar = memo(function ProgressBar({
  percent,
  width = 20,
  label,
  showPercent = true,
  color = colors.primary,
}: ProgressBarProps) {
  const bar = generateHorizontalBar(percent, width);

  return (
    <Box>
      <Text color={color}>{bar}</Text>
      {label && (
        <Text color={colors.textSecondary}>{`  ${label}`}</Text>
      )}
      {showPercent && (
        <Text color={colors.textTertiary}>{`  ${percent.toFixed(0)}%`}</Text>
      )}
    </Box>
  );
});
