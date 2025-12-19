import { Text } from 'ink';
import { memo } from 'react';
import { colors, symbols } from '../../utils/colors.js';
import { formatPercent } from '../../utils/format.js';

interface PriceChangeProps {
  value: number;
  showArrow?: boolean;
}

export const PriceChange = memo(function PriceChange({
  value,
  showArrow = true,
}: PriceChangeProps) {
  const isPositive = value >= 0;
  const color = isPositive ? colors.success : colors.danger;
  const arrow = isPositive ? symbols.up : symbols.down;

  return (
    <Text color={color}>
      {showArrow && `${arrow} `}
      {formatPercent(value)}
    </Text>
  );
});
