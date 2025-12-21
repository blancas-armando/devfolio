/**
 * Table Component
 *
 * Data tables with alignment, headers,
 * and consistent styling.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import { palette } from '../../design/tokens.js';
import { chars, stripAnsi } from '../../design/borders.js';

export type CellAlign = 'left' | 'right' | 'center';

export interface TableColumn {
  /** Column header */
  header: string;
  /** Key to access data */
  key: string;
  /** Column width */
  width?: number;
  /** Text alignment */
  align?: CellAlign;
  /** Header color */
  headerColor?: string;
  /** Cell color (or function for dynamic color) */
  cellColor?: string | ((value: unknown, row: Record<string, unknown>) => string);
  /** Format function */
  format?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface TableProps {
  /** Column definitions */
  columns: TableColumn[];
  /** Data rows */
  data: Record<string, unknown>[];
  /** Show header row */
  showHeader?: boolean;
  /** Show divider under header */
  showHeaderDivider?: boolean;
  /** Row gap */
  rowGap?: number;
  /** Highlight row condition */
  highlightRow?: (row: Record<string, unknown>, index: number) => boolean;
  /** Highlight color */
  highlightColor?: string;
}

export function Table({
  columns,
  data,
  showHeader = true,
  showHeaderDivider = true,
  rowGap = 0,
  highlightRow,
  highlightColor = palette.accentDim,
}: TableProps): React.ReactElement {
  // Calculate column widths
  const getColumnWidth = (col: TableColumn): number => {
    if (col.width) return col.width;
    // Auto-calculate based on header and max data length
    const headerLen = col.header.length;
    const maxDataLen = Math.max(
      ...data.map(row => {
        const value = row[col.key];
        const formatted = col.format ? col.format(value, row) : String(value ?? '');
        return stripAnsi(formatted).length;
      }),
      0
    );
    return Math.max(headerLen, maxDataLen) + 2;
  };

  const columnWidths = columns.map(getColumnWidth);

  // Align text within width
  const alignText = (text: string, width: number, align: CellAlign = 'left'): string => {
    const textLen = stripAnsi(text).length;
    const padding = Math.max(0, width - textLen);

    switch (align) {
      case 'right':
        return ' '.repeat(padding) + text;
      case 'center':
        const left = Math.floor(padding / 2);
        const right = padding - left;
        return ' '.repeat(left) + text + ' '.repeat(right);
      case 'left':
      default:
        return text + ' '.repeat(padding);
    }
  };

  return (
    <InkBox flexDirection="column">
      {/* Header row */}
      {showHeader && (
        <>
          <InkBox>
            {columns.map((col, i) => (
              <Text
                key={col.key}
                color={col.headerColor ?? palette.textSecondary}
                bold
              >
                {alignText(col.header, columnWidths[i], col.align)}
              </Text>
            ))}
          </InkBox>

          {/* Header divider */}
          {showHeaderDivider && (
            <InkBox>
              {columns.map((col, i) => (
                <Text key={col.key} color={palette.border}>
                  {chars.horizontal.repeat(columnWidths[i])}
                </Text>
              ))}
            </InkBox>
          )}
        </>
      )}

      {/* Data rows */}
      {data.map((row, rowIndex) => {
        const isHighlighted = highlightRow?.(row, rowIndex);

        return (
          <InkBox
            key={rowIndex}
            marginTop={rowIndex > 0 ? rowGap : 0}
          >
            {columns.map((col, colIndex) => {
              const value = row[col.key];
              const formatted = col.format ? col.format(value, row) : String(value ?? '');
              const cellColor = typeof col.cellColor === 'function'
                ? col.cellColor(value, row)
                : col.cellColor ?? palette.text;

              return (
                <Text
                  key={col.key}
                  color={isHighlighted ? highlightColor : cellColor}
                >
                  {alignText(formatted, columnWidths[colIndex], col.align)}
                </Text>
              );
            })}
          </InkBox>
        );
      })}
    </InkBox>
  );
}

// Simple table (auto-columns from data keys)
export interface SimpleTableProps {
  data: Record<string, unknown>[];
  /** Keys to display (default: all keys from first row) */
  keys?: string[];
  /** Header labels (default: key names) */
  headers?: Record<string, string>;
}

export function SimpleTable({
  data,
  keys,
  headers = {},
}: SimpleTableProps): React.ReactElement {
  if (data.length === 0) {
    return <Text color={palette.textTertiary}>No data</Text>;
  }

  const displayKeys = keys || Object.keys(data[0]);
  const columns: TableColumn[] = displayKeys.map(key => ({
    key,
    header: headers[key] || key,
  }));

  return <Table columns={columns} data={data} />;
}

// Comparison table (side by side)
export interface ComparisonTableProps {
  /** Labels for rows */
  labels: string[];
  /** Data for each column */
  columns: Array<{
    header: string;
    values: (string | number)[];
    color?: string;
  }>;
  /** Label column width */
  labelWidth?: number;
  /** Value column width */
  valueWidth?: number;
}

export function ComparisonTable({
  labels,
  columns,
  labelWidth = 16,
  valueWidth = 12,
}: ComparisonTableProps): React.ReactElement {
  return (
    <InkBox flexDirection="column">
      {/* Header row */}
      <InkBox>
        <Text color={palette.textSecondary}>{''.padEnd(labelWidth)}</Text>
        {columns.map((col) => (
          <Text
            key={col.header}
            color={palette.textSecondary}
            bold
          >
            {col.header.padStart(valueWidth)}
          </Text>
        ))}
      </InkBox>

      {/* Divider */}
      <InkBox>
        <Text color={palette.border}>
          {chars.horizontal.repeat(labelWidth + columns.length * valueWidth)}
        </Text>
      </InkBox>

      {/* Data rows */}
      {labels.map((label, rowIndex) => (
        <InkBox key={label}>
          <Text color={palette.textSecondary}>{label.padEnd(labelWidth)}</Text>
          {columns.map((col) => {
            const value = col.values[rowIndex];
            const display = value?.toString() ?? '-';
            return (
              <Text key={col.header} color={col.color ?? palette.text}>
                {display.padStart(valueWidth)}
              </Text>
            );
          })}
        </InkBox>
      ))}
    </InkBox>
  );
}
