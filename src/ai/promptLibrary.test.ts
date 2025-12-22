/**
 * Prompt Library Tests
 *
 * Tests for prompt construction and output schema validation.
 * These tests ensure prompts are well-formed and outputs match expected schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  PROMPT_VERSION,
  CHAT_SYSTEM_PROMPT,
  MARKET_PULSE_PROMPT,
  buildMarketBriefPrompt,
  buildResearchPrompt,
  buildWhyPrompt,
  buildEarningsPrompt,
  buildQuickTakePrompt,
  buildSentimentPrompt,
  buildPortfolioPrompt,
  buildWatchlistPrompt,
  buildStockComparisonPrompt,
  buildETFComparisonPrompt,
  buildFilingSummaryPrompt,
  _testing,
} from './promptLibrary.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

// Market Brief schema
interface MarketBriefResponse {
  headline: string;
  summary: string;
  sectorAnalysis: string;
  keyThemes: string[];
  outlook: string;
}

function isMarketBriefResponse(obj: unknown): obj is MarketBriefResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.headline === 'string' &&
    typeof o.summary === 'string' &&
    typeof o.sectorAnalysis === 'string' &&
    Array.isArray(o.keyThemes) &&
    o.keyThemes.length === 3 &&
    typeof o.outlook === 'string'
  );
}

// Quick Take schema
interface QuickTakeResponse {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  keyPoint: string;
}

function isQuickTakeResponse(obj: unknown): obj is QuickTakeResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    ['bullish', 'bearish', 'neutral'].includes(o.sentiment as string) &&
    typeof o.summary === 'string' &&
    o.summary.length <= 80 &&
    typeof o.keyPoint === 'string' &&
    o.keyPoint.length <= 50
  );
}

// Portfolio schema
interface PortfolioResponse {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  diversificationScore: number;
}

function isPortfolioResponse(obj: unknown): obj is PortfolioResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.score === 'number' &&
    o.score >= 0 &&
    o.score <= 100 &&
    ['A', 'B', 'C', 'D', 'F'].includes(o.grade as string) &&
    typeof o.summary === 'string' &&
    Array.isArray(o.strengths) &&
    Array.isArray(o.concerns) &&
    Array.isArray(o.suggestions) &&
    ['conservative', 'moderate', 'aggressive'].includes(o.riskLevel as string) &&
    typeof o.diversificationScore === 'number'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Prompt Library', () => {
  describe('Version & Metadata', () => {
    it('should have a version number', () => {
      expect(PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should be version 2.0.0 or higher', () => {
      const [major] = PROMPT_VERSION.split('.').map(Number);
      expect(major).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Identity & Base Context', () => {
    it('should have IDENTITY object with required fields', () => {
      const { IDENTITY } = _testing;
      expect(IDENTITY.name).toBe('DevFolio');
      expect(IDENTITY.role).toContain('financial analyst');
      expect(Object.keys(IDENTITY.voice)).toHaveLength(5);
      expect(IDENTITY.never.length).toBeGreaterThan(0);
    });

    it('should build base context with all required sections', () => {
      const context = _testing.buildBaseContext();
      expect(context).toContain('DevFolio');
      expect(context).toContain('DATA ACCURACY');
      expect(context).toContain('EDGE CASES');
    });

    it('should have anti-hallucination guardrails', () => {
      const guardrails = _testing.DATA_GUARDRAILS;
      expect(guardrails).toContain('ONLY numbers explicitly provided');
      expect(guardrails).toContain('null');
      expect(guardrails).toContain('never estimate');
    });

    it('should have error handling guidance', () => {
      const errorHandling = _testing.ERROR_HANDLING;
      expect(errorHandling).toContain('Missing data');
      expect(errorHandling).toContain('Incomplete data');
      expect(errorHandling).toContain('Ambiguous request');
    });
  });

  describe('Chat System Prompt', () => {
    it('should contain DevFolio identity', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('DevFolio');
    });

    it('should list all available tools', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('lookup_stock');
      expect(CHAT_SYSTEM_PROMPT).toContain('lookup_etf');
      expect(CHAT_SYSTEM_PROMPT).toContain('compare_stocks');
      expect(CHAT_SYSTEM_PROMPT).toContain('get_filings');
    });

    it('should have tool selection guidance', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('TOOL SELECTION');
    });

    it('should include good response examples', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('GOOD RESPONSES');
    });

    it('should include NEVER rules', () => {
      expect(CHAT_SYSTEM_PROMPT).toContain('NEVER');
      expect(CHAT_SYSTEM_PROMPT).toContain('Fabricate numbers');
    });
  });

  describe('Market Brief Prompt', () => {
    const prompt = buildMarketBriefPrompt('S&P 500: 5234 (+1.2%)');

    it('should include base context', () => {
      expect(prompt).toContain('DevFolio');
      expect(prompt).toContain('DATA ACCURACY');
    });

    it('should include market data', () => {
      expect(prompt).toContain('S&P 500: 5234');
    });

    it('should specify response schema', () => {
      expect(prompt).toContain('RESPONSE SCHEMA');
      expect(prompt).toContain('"headline"');
      expect(prompt).toContain('"keyThemes"');
    });

    it('should include a full example', () => {
      expect(prompt).toContain('EXAMPLE');
      expect(prompt).toContain('Tech Leads Rally');
    });

    it('should include output rules', () => {
      expect(prompt).toContain('OUTPUT FORMAT');
    });
  });

  describe('Market Pulse Prompt', () => {
    it('should not require JSON output', () => {
      expect(MARKET_PULSE_PROMPT).toContain('No JSON');
    });

    it('should have examples', () => {
      expect(MARKET_PULSE_PROMPT).toContain('EXAMPLES');
      expect(MARKET_PULSE_PROMPT).toContain('Risk-on mode');
    });

    it('should require specific numbers', () => {
      expect(MARKET_PULSE_PROMPT).toContain('at least one specific number');
    });
  });

  describe('Research Prompt', () => {
    const prompt = buildResearchPrompt('AAPL: Price $180, P/E 28x');

    it('should have quality requirements section', () => {
      expect(prompt).toContain('QUALITY REQUIREMENTS');
    });

    it('should require valuation opinion in executive summary', () => {
      expect(prompt).toContain('valuation opinion');
    });

    it('should require specific catalysts with dates', () => {
      expect(prompt).toContain('Specific events with dates');
    });

    it('should require quantified risks', () => {
      expect(prompt).toContain('Quantify impact');
    });

    it('should include complete example', () => {
      expect(prompt).toContain('"executiveSummary"');
      expect(prompt).toContain('Apple is a premium consumer');
    });
  });

  describe('Why Movement Prompt', () => {
    it('should include direction and intensity', () => {
      const upPrompt = buildWhyPrompt('AAPL', 'Apple Inc', 5.5, 'data', 'news');
      expect(upPrompt).toContain('UP');
      expect(upPrompt).toContain('sharply'); // 5.5% is >= 5, so "sharply"

      const downPrompt = buildWhyPrompt('AAPL', 'Apple Inc', -1.2, 'data', 'news');
      expect(downPrompt).toContain('DOWN');
      expect(downPrompt).toContain('moderately'); // 1.2% is between 1-3, so "moderately"
    });

    it('should have analysis approach section', () => {
      const prompt = buildWhyPrompt('AAPL', 'Apple', 2.0, 'data', 'news');
      expect(prompt).toContain('ANALYSIS APPROACH');
    });

    it('should include both earnings beat and no-news examples', () => {
      const prompt = buildWhyPrompt('AAPL', 'Apple', 2.0, 'data', 'news');
      expect(prompt).toContain('earnings beat');
      expect(prompt).toContain('no clear news');
    });
  });

  describe('Earnings Prompt', () => {
    const prompt = buildEarningsPrompt('AAPL', 'Apple Inc', 'EPS: $1.45');

    it('should have CRITICAL instruction for data accuracy', () => {
      expect(prompt).toContain('CRITICAL');
      expect(prompt).toContain('Only include KPIs and guidance that appear in the data');
    });

    it('should define KPI schema', () => {
      expect(prompt).toContain('"kpis"');
      expect(prompt).toContain('"actual"');
      expect(prompt).toContain('"consensus"');
    });

    it('should include complete example with KPIs', () => {
      expect(prompt).toContain('"name": "EPS"');
      expect(prompt).toContain('"actual": 1.45');
    });
  });

  describe('Quick Take Prompt', () => {
    const prompt = buildQuickTakePrompt('AAPL: $180, P/E 28x');

    it('should have decision framework', () => {
      expect(prompt).toContain('DECISION FRAMEWORK');
      expect(prompt).toContain('Bullish:');
      expect(prompt).toContain('Bearish:');
      expect(prompt).toContain('Neutral:');
    });

    it('should include all three sentiment examples', () => {
      expect(prompt).toContain('"sentiment": "bullish"');
      expect(prompt).toContain('"sentiment": "bearish"');
      expect(prompt).toContain('"sentiment": "neutral"');
    });

    it('should specify character limits', () => {
      expect(prompt).toContain('max 80 chars');
      expect(prompt).toContain('max 50 chars');
    });
  });

  describe('Sentiment Prompt', () => {
    const prompt = buildSentimentPrompt('Headline 1\nHeadline 2', 'Market');

    it('should include sentiment scale', () => {
      expect(prompt).toContain('SENTIMENT SCALE');
      expect(prompt).toContain('very_bullish');
      expect(prompt).toContain('+80 to +100');
    });

    it('should include mood examples', () => {
      expect(prompt).toContain('cautious optimism');
    });
  });

  describe('Portfolio Prompt', () => {
    const prompt = buildPortfolioPrompt('AAPL: 50%, NVDA: 30%');

    it('should have grading criteria', () => {
      expect(prompt).toContain('GRADING CRITERIA');
      expect(prompt).toContain('A (90-100)');
      expect(prompt).toContain('F (<40)');
    });

    it('should have risk level definitions', () => {
      expect(prompt).toContain('RISK LEVELS');
      expect(prompt).toContain('Conservative:');
      expect(prompt).toContain('>25%');
    });

    it('should include actionable example', () => {
      expect(prompt).toContain('Trim NVDA to 20%');
    });
  });

  describe('Watchlist Prompt', () => {
    const prompt = buildWatchlistPrompt('AAPL, NVDA, MSFT');

    it('should define signal meanings', () => {
      expect(prompt).toContain('SIGNAL DEFINITIONS');
      expect(prompt).toContain('hot:');
      expect(prompt).toContain('caution:');
    });

    it('should include complete example with all signals', () => {
      expect(prompt).toContain('"signal": "hot"');
      expect(prompt).toContain('"signal": "caution"');
      expect(prompt).toContain('"signal": "neutral"');
      expect(prompt).toContain('"signal": "watch"');
    });
  });

  describe('Stock Comparison Prompt', () => {
    const prompt = buildStockComparisonPrompt('AAPL vs MSFT data');

    it('should have category analysis section', () => {
      expect(prompt).toContain('CATEGORY ANALYSIS');
      expect(prompt).toContain('Valuation:');
      expect(prompt).toContain('Growth:');
    });

    it('should have confidence level guidance', () => {
      expect(prompt).toContain('CONFIDENCE LEVELS');
      expect(prompt).toContain('High:');
      expect(prompt).toContain('3+ categories');
    });

    it('should include bestFor mapping', () => {
      expect(prompt).toContain('"bestFor"');
      expect(prompt).toContain('growth investor');
      expect(prompt).toContain('value investor');
    });
  });

  describe('ETF Comparison Prompt', () => {
    const prompt = buildETFComparisonPrompt('VOO vs SPY data');

    it('should include cost context', () => {
      expect(prompt).toContain('0.03% vs 0.09% = $60/yr');
    });

    it('should have ETF-specific categories', () => {
      expect(prompt).toContain('"Cost"');
      expect(prompt).toContain('"Diversification"');
      expect(prompt).toContain('"Yield"');
    });
  });

  describe('SEC Filing Prompt', () => {
    it('should handle 10-K filings', () => {
      const prompt = buildFilingSummaryPrompt('AAPL', '10-K', '2024-01-15', 'content');
      expect(prompt).toContain('Annual report');
      expect(prompt).toContain('full-year results');
    });

    it('should handle 8-K filings', () => {
      const prompt = buildFilingSummaryPrompt('AAPL', '8-K', '2024-01-15', 'content');
      expect(prompt).toContain('Current report');
      expect(prompt).toContain('material event');
    });

    it('should always include materialEvents array', () => {
      const prompt10K = buildFilingSummaryPrompt('AAPL', '10-K', '2024-01-15', 'content');
      const prompt8K = buildFilingSummaryPrompt('AAPL', '8-K', '2024-01-15', 'content');

      expect(prompt10K).toContain('"materialEvents"');
      expect(prompt8K).toContain('"materialEvents"');
    });

    it('should have examples for both 8-K and 10-K', () => {
      const prompt = buildFilingSummaryPrompt('AAPL', '8-K', '2024-01-15', 'content');
      expect(prompt).toContain('EXAMPLE (8-K earnings)');
      expect(prompt).toContain('EXAMPLE (10-K annual)');
    });
  });

  describe('Schema Validators', () => {
    it('should validate correct MarketBrief response', () => {
      const valid: MarketBriefResponse = {
        headline: 'Test headline for market brief',
        summary: 'Test summary',
        sectorAnalysis: 'Test sector analysis',
        keyThemes: ['theme1', 'theme2', 'theme3'],
        outlook: 'Test outlook',
      };
      expect(isMarketBriefResponse(valid)).toBe(true);
    });

    it('should reject invalid MarketBrief response', () => {
      expect(isMarketBriefResponse({ headline: 'only headline' })).toBe(false);
      expect(isMarketBriefResponse({ ...{}, keyThemes: ['one', 'two'] })).toBe(false);
    });

    it('should validate correct QuickTake response', () => {
      const valid: QuickTakeResponse = {
        sentiment: 'bullish',
        summary: 'Short summary under 80 chars',
        keyPoint: 'Key point under 50 chars',
      };
      expect(isQuickTakeResponse(valid)).toBe(true);
    });

    it('should reject QuickTake with too-long fields', () => {
      expect(
        isQuickTakeResponse({
          sentiment: 'bullish',
          summary: 'x'.repeat(81),
          keyPoint: 'ok',
        })
      ).toBe(false);
    });

    it('should validate correct Portfolio response', () => {
      const valid: PortfolioResponse = {
        score: 72,
        grade: 'C',
        summary: 'Test summary',
        strengths: ['strength1'],
        concerns: ['concern1'],
        suggestions: ['suggestion1'],
        riskLevel: 'aggressive',
        diversificationScore: 35,
      };
      expect(isPortfolioResponse(valid)).toBe(true);
    });

    it('should reject Portfolio with invalid grade', () => {
      expect(
        isPortfolioResponse({
          score: 72,
          grade: 'X', // invalid
          summary: 'Test',
          strengths: [],
          concerns: [],
          suggestions: [],
          riskLevel: 'moderate',
          diversificationScore: 50,
        })
      ).toBe(false);
    });
  });
});
