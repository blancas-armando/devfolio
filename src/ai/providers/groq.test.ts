/**
 * Groq Provider Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqProvider } from './groq.js';

describe('GroqProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAvailable', () => {
    it('should return true when API key is set', () => {
      process.env.GROQ_API_KEY = 'gsk_test_key_12345';
      const provider = new GroqProvider();
      expect(provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.GROQ_API_KEY;
      const provider = new GroqProvider();
      expect(provider.isAvailable()).toBe(false);
    });

    it('should use config API key over env var', () => {
      process.env.GROQ_API_KEY = 'env_key';
      const provider = new GroqProvider({ apiKey: 'config_key' });
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly for default model', () => {
      const provider = new GroqProvider({ apiKey: 'test' });
      const cost = provider.estimateCost(1000000, 1000000);

      // llama-3.3-70b-versatile: $0.59/1M input, $0.79/1M output
      expect(cost).toBeCloseTo(0.59 + 0.79, 2);
    });

    it('should calculate cost correctly for specific model', () => {
      const provider = new GroqProvider({ apiKey: 'test' });
      const cost = provider.estimateCost(1000000, 1000000, 'llama-3.1-8b-instant');

      // llama-3.1-8b-instant: $0.05/1M input, $0.08/1M output
      expect(cost).toBeCloseTo(0.05 + 0.08, 2);
    });

    it('should handle zero tokens', () => {
      const provider = new GroqProvider({ apiKey: 'test' });
      const cost = provider.estimateCost(0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('provider properties', () => {
    it('should have correct name', () => {
      const provider = new GroqProvider({ apiKey: 'test' });
      expect(provider.name).toBe('groq');
    });

    it('should support tools', () => {
      const provider = new GroqProvider({ apiKey: 'test' });
      expect(provider.supportsTools).toBe(true);
    });

    it('should support streaming', () => {
      const provider = new GroqProvider({ apiKey: 'test' });
      expect(provider.supportsStreaming).toBe(true);
    });
  });
});
