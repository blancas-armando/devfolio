/**
 * Simple Sentiment Analysis
 * Keyword-based sentiment detection for news headlines
 */

export type Sentiment = 'positive' | 'negative' | 'neutral';

// Positive keywords (bullish signals)
const POSITIVE_WORDS = new Set([
  'surge', 'surges', 'surging', 'soar', 'soars', 'soaring',
  'jump', 'jumps', 'jumping', 'rally', 'rallies', 'rallying',
  'gain', 'gains', 'rise', 'rises', 'rising', 'climb', 'climbs',
  'beat', 'beats', 'beating', 'exceed', 'exceeds', 'top', 'tops',
  'record', 'records', 'high', 'highs', 'breakout', 'breakthrough',
  'upgrade', 'upgrades', 'upgraded', 'buy', 'outperform',
  'bullish', 'optimistic', 'optimism', 'boost', 'boosts',
  'strong', 'stronger', 'strength', 'growth', 'grows', 'growing',
  'profit', 'profits', 'profitable', 'win', 'wins', 'winner',
  'success', 'successful', 'positive', 'up', 'upside',
  'approve', 'approves', 'approved', 'approval',
  'expand', 'expands', 'expansion', 'launches', 'launch',
  'recover', 'recovers', 'recovery', 'rebound', 'rebounds',
  'accelerate', 'accelerates', 'outpaces', 'outperforms',
  'best', 'top-rated', 'overweight', 'dividend', 'buyback',
]);

// Negative keywords (bearish signals)
const NEGATIVE_WORDS = new Set([
  'fall', 'falls', 'falling', 'drop', 'drops', 'dropping',
  'plunge', 'plunges', 'plunging', 'sink', 'sinks', 'sinking',
  'crash', 'crashes', 'crashing', 'tumble', 'tumbles', 'tumbling',
  'slide', 'slides', 'sliding', 'decline', 'declines', 'declining',
  'miss', 'misses', 'missed', 'disappoint', 'disappoints',
  'downgrade', 'downgrades', 'downgraded', 'sell', 'underperform',
  'bearish', 'pessimistic', 'pessimism', 'weak', 'weaker',
  'loss', 'losses', 'lose', 'loses', 'losing', 'worst',
  'fail', 'fails', 'failed', 'failure', 'negative', 'down',
  'cut', 'cuts', 'cutting', 'slash', 'slashes', 'slashing',
  'warning', 'warns', 'warned', 'concern', 'concerns', 'concerned',
  'risk', 'risks', 'risky', 'threat', 'threatens', 'threatened',
  'layoff', 'layoffs', 'firing', 'fired', 'job cuts',
  'investigation', 'investigates', 'lawsuit', 'sue', 'sues',
  'recall', 'recalls', 'recalled', 'probe', 'probes',
  'underweight', 'fraud', 'scandal', 'crisis', 'trouble',
  'suspend', 'suspends', 'suspended', 'halt', 'halts', 'halted',
  'bankruptcy', 'default', 'defaults', 'recession', 'inflation',
]);

/**
 * Analyze sentiment of a news headline
 */
export function analyzeSentiment(headline: string): Sentiment {
  const words = headline.toLowerCase().split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    // Clean the word of punctuation
    const cleanWord = word.replace(/[^a-z-]/g, '');

    if (POSITIVE_WORDS.has(cleanWord)) {
      positiveCount++;
    }
    if (NEGATIVE_WORDS.has(cleanWord)) {
      negativeCount++;
    }
  }

  // Determine sentiment based on keyword counts
  if (positiveCount > negativeCount) {
    return 'positive';
  } else if (negativeCount > positiveCount) {
    return 'negative';
  }

  return 'neutral';
}

/**
 * Get a sentiment indicator emoji/symbol
 */
export function getSentimentIndicator(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'positive':
      return '▲';
    case 'negative':
      return '▼';
    default:
      return '─';
  }
}
