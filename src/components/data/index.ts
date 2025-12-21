/**
 * Data Components
 *
 * Components for displaying structured data
 * like metrics, tables, and charts.
 */

// Metric components
export {
  MetricRow,
  CompactMetric,
  WideMetric,
  MetricWithUnit,
  InlineMetrics,
  MetricDivider,
  type MetricRowProps,
  type MetricWithUnitProps,
  type InlineMetricsProps,
} from './MetricRow.js';

// Grid components
export {
  MetricGrid,
  MetricSection,
  KeyValueList,
  StatBar,
  type MetricItem,
  type MetricGridProps,
  type MetricSectionProps,
  type KeyValueListProps,
  type StatBarProps,
} from './MetricGrid.js';

// Table components
export {
  Table,
  SimpleTable,
  ComparisonTable,
  type TableColumn,
  type TableProps,
  type CellAlign,
  type SimpleTableProps,
  type ComparisonTableProps,
} from './Table.js';

// Chart components
export {
  Chart,
  Sparkline,
  PriceChart,
  InlineChart,
  type ChartProps,
  type SparklineProps,
  type PriceChartProps,
  type InlineChartProps,
} from './Chart.js';

// Price change components
export {
  PriceChange,
  PriceWithChange,
  CompactChange,
  ChangeBadge,
  MovementIndicator,
  PriceRange,
  type PriceChangeProps,
  type PriceWithChangeProps,
  type CompactChangeProps,
  type ChangeBadgeProps,
  type MovementIndicatorProps,
  type PriceRangeProps,
} from './PriceChange.js';
