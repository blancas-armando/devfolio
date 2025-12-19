import { Text } from 'ink';
import { memo, useMemo } from 'react';
import { generateSparkline } from '../../utils/charts.js';
import { colors } from '../../utils/colors.js';

interface SparklineProps {
  data: number[];
  width?: number;
  color?: string;
}

export const Sparkline = memo(function Sparkline({
  data,
  width = 10,
  color,
}: SparklineProps) {
  const sparkline = useMemo(
    () => generateSparkline(data, width),
    [data, width]
  );

  // Determine color based on trend if not specified
  const trendColor = useMemo(() => {
    if (color) return color;
    if (data.length < 2) return colors.textSecondary;
    return data[data.length - 1] >= data[0] ? colors.success : colors.danger;
  }, [data, color]);

  return <Text color={trendColor}>{sparkline}</Text>;
});
