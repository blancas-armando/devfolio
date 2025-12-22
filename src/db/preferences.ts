/**
 * User Preferences Service
 * Learns and stores user preferences from conversations
 */

import { getDb } from './index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface UserPreference {
  key: string;
  value: string;
  confidence: number;
  lastUpdated: Date;
}

// Well-known preference keys
export type PreferenceKey =
  | 'risk_tolerance'      // 'conservative' | 'moderate' | 'aggressive'
  | 'investment_style'    // 'growth' | 'value' | 'income' | 'balanced'
  | 'time_horizon'        // 'short' | 'medium' | 'long'
  | 'sectors_interest'    // comma-separated: 'tech,healthcare,finance'
  | 'sectors_avoid'       // comma-separated sectors to avoid
  | 'market_cap_pref'     // 'small' | 'mid' | 'large' | 'any'
  | 'dividend_focus'      // 'yes' | 'no' | 'moderate'
  | 'esg_focus'           // 'yes' | 'no'
  | 'crypto_interest'     // 'yes' | 'no' | 'moderate'
  | 'options_interest'    // 'yes' | 'no'
  | 'analysis_depth'      // 'quick' | 'detailed'
  | 'communication_style'; // 'brief' | 'detailed' | 'technical'

// ═══════════════════════════════════════════════════════════════════════════
// Preference Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a specific preference
 */
export function getPreference(key: string): UserPreference | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT key, value, confidence, last_updated
    FROM user_preferences
    WHERE key = ?
  `).get(key) as {
    key: string;
    value: string;
    confidence: number;
    last_updated: string;
  } | undefined;

  if (!row) return null;

  return {
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    lastUpdated: new Date(row.last_updated),
  };
}

/**
 * Get all preferences
 */
export function getAllPreferences(): UserPreference[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT key, value, confidence, last_updated
    FROM user_preferences
    ORDER BY key
  `).all() as Array<{
    key: string;
    value: string;
    confidence: number;
    last_updated: string;
  }>;

  return rows.map(row => ({
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    lastUpdated: new Date(row.last_updated),
  }));
}

/**
 * Set a preference (insert or update)
 */
export function setPreference(key: string, value: string, confidence = 0.5): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO user_preferences (key, value, confidence, last_updated)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      confidence = excluded.confidence,
      last_updated = datetime('now')
  `).run(key, value, confidence);
}

/**
 * Update preference confidence (for learning from repeated signals)
 */
export function updateConfidence(key: string, delta: number): void {
  const db = getDb();
  db.prepare(`
    UPDATE user_preferences
    SET confidence = MIN(1.0, MAX(0.0, confidence + ?)),
        last_updated = datetime('now')
    WHERE key = ?
  `).run(delta, key);
}

/**
 * Delete a preference
 */
export function deletePreference(key: string): void {
  const db = getDb();
  db.prepare('DELETE FROM user_preferences WHERE key = ?').run(key);
}

// ═══════════════════════════════════════════════════════════════════════════
// Preference Inference
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Infer preferences from conversation text
 * Returns inferred preferences with confidence scores
 */
export function inferPreferences(text: string): Array<{ key: PreferenceKey; value: string; confidence: number }> {
  const inferred: Array<{ key: PreferenceKey; value: string; confidence: number }> = [];
  const lowerText = text.toLowerCase();

  // Risk tolerance signals
  if (lowerText.includes('conservative') || lowerText.includes('safe') || lowerText.includes('low risk')) {
    inferred.push({ key: 'risk_tolerance', value: 'conservative', confidence: 0.6 });
  } else if (lowerText.includes('aggressive') || lowerText.includes('high risk') || lowerText.includes('growth stocks')) {
    inferred.push({ key: 'risk_tolerance', value: 'aggressive', confidence: 0.6 });
  }

  // Investment style signals
  if (lowerText.includes('dividend') || lowerText.includes('income')) {
    inferred.push({ key: 'investment_style', value: 'income', confidence: 0.5 });
    inferred.push({ key: 'dividend_focus', value: 'yes', confidence: 0.6 });
  }
  if (lowerText.includes('growth') && !lowerText.includes('dividend growth')) {
    inferred.push({ key: 'investment_style', value: 'growth', confidence: 0.5 });
  }
  if (lowerText.includes('value') || lowerText.includes('undervalued')) {
    inferred.push({ key: 'investment_style', value: 'value', confidence: 0.5 });
  }

  // Time horizon signals
  if (lowerText.includes('long term') || lowerText.includes('retirement') || lowerText.includes('hold for years')) {
    inferred.push({ key: 'time_horizon', value: 'long', confidence: 0.6 });
  } else if (lowerText.includes('short term') || lowerText.includes('swing') || lowerText.includes('quick')) {
    inferred.push({ key: 'time_horizon', value: 'short', confidence: 0.5 });
  }

  // Sector interest signals
  const sectors: string[] = [];
  if (lowerText.includes('tech') || lowerText.includes('technology')) sectors.push('technology');
  if (lowerText.includes('healthcare') || lowerText.includes('pharma') || lowerText.includes('biotech')) sectors.push('healthcare');
  if (lowerText.includes('finance') || lowerText.includes('banking') || lowerText.includes('fintech')) sectors.push('finance');
  if (lowerText.includes('energy') || lowerText.includes('oil') || lowerText.includes('renewable')) sectors.push('energy');
  if (lowerText.includes('consumer') || lowerText.includes('retail')) sectors.push('consumer');

  if (sectors.length > 0) {
    inferred.push({ key: 'sectors_interest', value: sectors.join(','), confidence: 0.4 });
  }

  // Market cap preference
  if (lowerText.includes('small cap') || lowerText.includes('small-cap')) {
    inferred.push({ key: 'market_cap_pref', value: 'small', confidence: 0.6 });
  } else if (lowerText.includes('large cap') || lowerText.includes('mega cap') || lowerText.includes('blue chip')) {
    inferred.push({ key: 'market_cap_pref', value: 'large', confidence: 0.6 });
  }

  // Crypto interest
  if (lowerText.includes('crypto') || lowerText.includes('bitcoin') || lowerText.includes('ethereum')) {
    inferred.push({ key: 'crypto_interest', value: 'yes', confidence: 0.7 });
  }

  // Options interest
  if (lowerText.includes('option') || lowerText.includes('call') || lowerText.includes('put') || lowerText.includes('strike')) {
    inferred.push({ key: 'options_interest', value: 'yes', confidence: 0.6 });
  }

  // ESG focus
  if (lowerText.includes('esg') || lowerText.includes('sustainable') || lowerText.includes('ethical')) {
    inferred.push({ key: 'esg_focus', value: 'yes', confidence: 0.6 });
  }

  return inferred;
}

/**
 * Learn preferences from text (infer and store)
 */
export function learnFromText(text: string): void {
  const inferred = inferPreferences(text);

  for (const { key, value, confidence } of inferred) {
    const existing = getPreference(key);

    if (existing) {
      // If same value, increase confidence
      if (existing.value === value) {
        updateConfidence(key, 0.1);
      } else if (confidence > existing.confidence) {
        // If different value with higher confidence, update
        setPreference(key, value, confidence);
      }
    } else {
      // New preference
      setPreference(key, value, confidence);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Context Building
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a preference context string for AI prompts
 */
export function buildPreferenceContext(): string {
  const prefs = getAllPreferences();

  if (prefs.length === 0) {
    return '';
  }

  const lines: string[] = ['USER PREFERENCES:'];

  for (const pref of prefs) {
    // Only include preferences with reasonable confidence
    if (pref.confidence >= 0.4) {
      const label = pref.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`- ${label}: ${pref.value}`);
    }
  }

  return lines.length > 1 ? lines.join('\n') : '';
}

/**
 * Get preference value or default
 */
export function getPreferenceValue(key: PreferenceKey, defaultValue: string): string {
  const pref = getPreference(key);
  return pref?.value ?? defaultValue;
}
