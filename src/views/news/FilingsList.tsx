/**
 * FilingsList Component
 *
 * Display SEC filings for a company with form type,
 * date, and description.
 */

import React from 'react';
import { Box as InkBox, Text } from 'ink';
import type { SECFiling, CompanyInfo } from '../../services/sec.js';
import { palette } from '../../design/tokens.js';
import { borders } from '../../design/borders.js';
import { symbols } from '../../design/symbols.js';

export interface FilingsListProps {
  symbol: string;
  filings: SECFiling[];
  companyInfo?: CompanyInfo | null;
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)}MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)}KB`;
  return `${bytes}B`;
}

// Get form type color
function getFormColor(form: string): string {
  switch (form) {
    case '10-K':
      return palette.accent;
    case '10-Q':
      return palette.info;
    case '8-K':
      return '#C4A050'; // ochre/warning
    default:
      return palette.text;
  }
}

// Filing row component
function FilingRow({ filing, index }: { filing: SECFiling; index: number }): React.ReactElement {
  const formColor = getFormColor(filing.form);
  const maxDescLen = 45;

  return (
    <InkBox>
      <InkBox width={4}>
        <Text color={palette.textTertiary}>{index + 1}.</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={formColor}>{filing.form}</Text>
      </InkBox>
      <InkBox width={12}>
        <Text color={palette.textTertiary}>{filing.filingDate}</Text>
      </InkBox>
      <InkBox width={8}>
        <Text color={palette.textTertiary}>{formatSize(filing.size)}</Text>
      </InkBox>
      <Text color={palette.text}>
        {filing.description.length > maxDescLen
          ? filing.description.substring(0, maxDescLen - 3) + '...'
          : filing.description}
      </Text>
    </InkBox>
  );
}

export function FilingsListView({ symbol, filings, companyInfo }: FilingsListProps): React.ReactElement {
  const width = 78;
  const line = borders.horizontal.repeat(width - 2);

  if (filings.length === 0) {
    return (
      <InkBox flexDirection="column" marginY={1}>
        <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
        <InkBox paddingX={1}>
          <Text color={palette.text}>SEC Filings for </Text>
          <Text bold color={palette.text}>{symbol.toUpperCase()}</Text>
        </InkBox>
        <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
        <InkBox paddingX={1}>
          <Text color={palette.textTertiary}>No filings found</Text>
        </InkBox>
        <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
      </InkBox>
    );
  }

  return (
    <InkBox flexDirection="column" marginY={1}>
      {/* Header */}
      <Text color={palette.info}>{borders.topLeft}{line}{borders.topRight}</Text>
      <InkBox paddingX={1}>
        <Text bold color={palette.text}>{symbol.toUpperCase()}</Text>
        {companyInfo && (
          <>
            <Text color={palette.textTertiary}> {borders.vertical} </Text>
            <Text color={palette.textSecondary}>{companyInfo.name}</Text>
          </>
        )}
      </InkBox>
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>SEC Filings</Text>
        {companyInfo && (
          <>
            <Text color={palette.textTertiary}> {symbols.bullet} CIK: {companyInfo.cik}</Text>
          </>
        )}
      </InkBox>

      {/* Column headers */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox paddingX={1}>
        <InkBox width={4}>
          <Text color={palette.textTertiary}>#</Text>
        </InkBox>
        <InkBox width={8}>
          <Text color={palette.textTertiary}>Form</Text>
        </InkBox>
        <InkBox width={12}>
          <Text color={palette.textTertiary}>Filed</Text>
        </InkBox>
        <InkBox width={8}>
          <Text color={palette.textTertiary}>Size</Text>
        </InkBox>
        <Text color={palette.textTertiary}>Description</Text>
      </InkBox>

      {/* Filing rows */}
      <InkBox flexDirection="column" paddingX={1}>
        {filings.map((filing, i) => (
          <FilingRow key={filing.accessionNumber} filing={filing} index={i} />
        ))}
      </InkBox>

      {/* Footer with hints */}
      <Text color={palette.info}>{borders.leftTee}{line}{borders.rightTee}</Text>
      <InkBox paddingX={1}>
        <Text color={palette.textTertiary}>
          Type 'filing N' to read filing #N {symbols.bullet} e.g., 'filing 1' for the most recent
        </Text>
      </InkBox>

      {/* Company info footer */}
      {companyInfo && (
        <InkBox paddingX={1}>
          <Text color={palette.textTertiary}>
            {companyInfo.sicDescription} {symbols.bullet} FYE: {companyInfo.fiscalYearEnd} {symbols.bullet} {companyInfo.stateOfIncorporation}
          </Text>
        </InkBox>
      )}

      <Text color={palette.info}>{borders.bottomLeft}{line}{borders.bottomRight}</Text>
    </InkBox>
  );
}

export default FilingsListView;
