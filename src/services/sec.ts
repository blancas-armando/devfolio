/**
 * SEC EDGAR API Integration
 * Free, official SEC data for company filings
 *
 * API Docs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SECFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  description: string;
  primaryDocument: string;
  fileUrl: string;
  size: number;
}

export interface CompanyInfo {
  cik: string;
  name: string;
  ticker: string;
  sicDescription: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
}

export interface FilingSection {
  title: string;
  content: string;
}

// SEC requires a User-Agent header
const SEC_USER_AGENT = 'DevFolio/1.0 (contact@devfolio.app)';
const SEC_BASE_URL = 'https://data.sec.gov';
const EFTS_BASE_URL = 'https://efts.sec.gov/LATEST/search-index';

// Cache for CIK lookups
const cikCache = new Map<string, string>();

// ═══════════════════════════════════════════════════════════════════════════
// CIK Lookup (Ticker to CIK mapping)
// ═══════════════════════════════════════════════════════════════════════════

export async function getCIK(ticker: string): Promise<string | null> {
  const upperTicker = ticker.toUpperCase();

  // Check cache
  if (cikCache.has(upperTicker)) {
    return cikCache.get(upperTicker)!;
  }

  try {
    // Use SEC's company tickers JSON
    const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': SEC_USER_AGENT },
    });

    if (!response.ok) return null;

    const data = await response.json() as Record<string, { cik_str: number; ticker: string; title: string }>;

    // Find the ticker
    for (const entry of Object.values(data)) {
      if (entry.ticker === upperTicker) {
        const cik = String(entry.cik_str).padStart(10, '0');
        cikCache.set(upperTicker, cik);
        return cik;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Company Info
// ═══════════════════════════════════════════════════════════════════════════

export async function getCompanyInfo(ticker: string): Promise<CompanyInfo | null> {
  const cik = await getCIK(ticker);
  if (!cik) return null;

  try {
    const response = await fetch(`${SEC_BASE_URL}/submissions/CIK${cik}.json`, {
      headers: { 'User-Agent': SEC_USER_AGENT },
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      cik: string;
      name: string;
      tickers: string[];
      sicDescription: string;
      fiscalYearEnd: string;
      stateOfIncorporation: string;
    };

    return {
      cik: data.cik,
      name: data.name,
      ticker: ticker.toUpperCase(),
      sicDescription: data.sicDescription ?? 'N/A',
      fiscalYearEnd: data.fiscalYearEnd ?? 'N/A',
      stateOfIncorporation: data.stateOfIncorporation ?? 'N/A',
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Recent Filings
// ═══════════════════════════════════════════════════════════════════════════

export async function getRecentFilings(
  ticker: string,
  formTypes: string[] = ['10-K', '10-Q', '8-K'],
  limit: number = 10
): Promise<SECFiling[]> {
  const cik = await getCIK(ticker);
  if (!cik) return [];

  try {
    const response = await fetch(`${SEC_BASE_URL}/submissions/CIK${cik}.json`, {
      headers: { 'User-Agent': SEC_USER_AGENT },
    });

    if (!response.ok) return [];

    const data = await response.json() as {
      cik: string;
      filings: {
        recent: {
          accessionNumber: string[];
          filingDate: string[];
          reportDate: string[];
          form: string[];
          primaryDocument: string[];
          primaryDocDescription: string[];
          size: number[];
        };
      };
    };

    const recent = data.filings.recent;
    const filings: SECFiling[] = [];

    for (let i = 0; i < recent.accessionNumber.length && filings.length < limit; i++) {
      const form = recent.form[i];

      // Filter by form type
      if (!formTypes.includes(form)) continue;

      const accessionNumber = recent.accessionNumber[i].replace(/-/g, '');
      const accessionFormatted = recent.accessionNumber[i];

      filings.push({
        accessionNumber: accessionFormatted,
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate[i] || recent.filingDate[i],
        form,
        description: recent.primaryDocDescription[i] || form,
        primaryDocument: recent.primaryDocument[i],
        fileUrl: `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, '')}/${accessionNumber}/${recent.primaryDocument[i]}`,
        size: recent.size[i],
      });
    }

    return filings;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Filing Content (Simplified extraction)
// ═══════════════════════════════════════════════════════════════════════════

export async function getFilingText(filing: SECFiling, maxChars: number = 50000): Promise<string | null> {
  try {
    // Try to get the .txt version which is easier to parse
    const txtUrl = filing.fileUrl.replace(/\.[^.]+$/, '.txt');

    const response = await fetch(txtUrl, {
      headers: { 'User-Agent': SEC_USER_AGENT },
    });

    if (!response.ok) {
      // Fall back to original URL
      const altResponse = await fetch(filing.fileUrl, {
        headers: { 'User-Agent': SEC_USER_AGENT },
      });
      if (!altResponse.ok) return null;
      const text = await altResponse.text();
      return cleanFilingText(text).substring(0, maxChars);
    }

    const text = await response.text();
    return cleanFilingText(text).substring(0, maxChars);
  } catch {
    return null;
  }
}

function cleanFilingText(text: string): string {
  // Remove HTML tags
  let clean = text.replace(/<[^>]*>/g, ' ');

  // Remove XBRL tags
  clean = clean.replace(/<[^>]*:[^>]*>/g, ' ');

  // Remove multiple spaces and newlines
  clean = clean.replace(/\s+/g, ' ');

  // Remove common SEC boilerplate markers
  clean = clean.replace(/-----BEGIN PRIVACY-ENHANCED MESSAGE-----[\s\S]*?-----END PRIVACY-ENHANCED MESSAGE-----/g, '');

  return clean.trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// Key Sections Extraction (for 10-K/10-Q)
// ═══════════════════════════════════════════════════════════════════════════

const SECTION_PATTERNS: Record<string, RegExp[]> = {
  'Business Overview': [
    /Item\s*1[.\s]*Business/i,
    /PART\s*I[\s\S]*?Item\s*1/i,
  ],
  'Risk Factors': [
    /Item\s*1A[.\s]*Risk\s*Factors/i,
    /RISK\s*FACTORS/i,
  ],
  'MD&A': [
    /Item\s*7[.\s]*Management['']?s?\s*Discussion/i,
    /Management['']?s?\s*Discussion\s*and\s*Analysis/i,
  ],
  'Financial Condition': [
    /Liquidity\s*and\s*Capital\s*Resources/i,
    /Financial\s*Condition/i,
  ],
  'Recent Developments': [
    /Recent\s*Developments/i,
    /Item\s*8-K/i,
  ],
};

export function extractKeySections(text: string): FilingSection[] {
  const sections: FilingSection[] = [];

  for (const [title, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        // Extract ~2000 chars after the section header
        const start = match.index;
        const content = text.substring(start, start + 2500);

        sections.push({
          title,
          content: content.substring(0, 2000) + '...',
        });
        break;
      }
    }
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// 8-K Event Types
// ═══════════════════════════════════════════════════════════════════════════

export const FORM_8K_ITEMS: Record<string, string> = {
  '1.01': 'Entry into Material Agreement',
  '1.02': 'Termination of Material Agreement',
  '1.03': 'Bankruptcy or Receivership',
  '2.01': 'Completion of Acquisition/Disposition',
  '2.02': 'Results of Operations (Earnings)',
  '2.03': 'Creation of Obligation',
  '2.04': 'Triggering Events (Acceleration)',
  '2.05': 'Costs for Exit/Disposal',
  '2.06': 'Material Impairments',
  '3.01': 'Delisting/Transfer',
  '3.02': 'Unregistered Sales of Equity',
  '3.03': 'Material Modification of Rights',
  '4.01': 'Changes in Certifying Accountant',
  '4.02': 'Non-Reliance on Financial Statements',
  '5.01': 'Changes in Control',
  '5.02': 'Director/Officer Changes',
  '5.03': 'Amendments to Articles/Bylaws',
  '5.07': 'Shareholder Vote Results',
  '7.01': 'Regulation FD Disclosure',
  '8.01': 'Other Events',
  '9.01': 'Financial Statements/Exhibits',
};

export function identify8KItems(text: string): string[] {
  const items: string[] = [];

  for (const [item, description] of Object.entries(FORM_8K_ITEMS)) {
    const pattern = new RegExp(`Item\\s*${item.replace('.', '\\.')}`, 'i');
    if (pattern.test(text)) {
      items.push(`${item}: ${description}`);
    }
  }

  return items;
}
