/**
 * JSON Extraction Tests
 */

import { describe, it, expect } from 'vitest';
import { extractJson, hasRequiredFields } from './json.js';

describe('extractJson', () => {
  describe('pure JSON parsing', () => {
    it('should parse pure JSON object', () => {
      const result = extractJson('{"key": "value"}');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: 'value' });
    });

    it('should parse JSON array', () => {
      const result = extractJson('[1, 2, 3]');
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should handle nested objects', () => {
      const result = extractJson('{"a": {"b": {"c": 1}}}');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ a: { b: { c: 1 } } });
    });
  });

  describe('markdown code block extraction', () => {
    it('should extract JSON from code block with language', () => {
      const input = `Here is some data:
\`\`\`json
{"result": "success"}
\`\`\`
That's all.`;
      const result = extractJson(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'success' });
    });

    it('should extract JSON from code block without language', () => {
      const input = `\`\`\`
{"data": [1, 2, 3]}
\`\`\``;
      const result = extractJson(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: [1, 2, 3] });
    });
  });

  describe('embedded JSON extraction', () => {
    it('should extract JSON from mixed text', () => {
      const input = 'The analysis shows: {"score": 85, "rating": "good"} as expected.';
      const result = extractJson(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ score: 85, rating: 'good' });
    });

    it('should handle JSON with surrounding whitespace', () => {
      const input = '\n\n  {"key": "value"}  \n\n';
      const result = extractJson(input);
      expect(result.success).toBe(true);
    });
  });

  describe('JSON repair', () => {
    it('should fix trailing commas', () => {
      const input = '{"a": 1, "b": 2,}';
      const result = extractJson(input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ a: 1, b: 2 });
    });

    it('should handle unquoted keys (simple cases)', () => {
      const input = '{name: "test", value: 123}';
      const result = extractJson(input);
      expect(result.success).toBe(true);
    });
  });

  describe('validation', () => {
    interface TestShape {
      required: string;
      optional?: number;
    }

    const validator = (obj: unknown): obj is TestShape =>
      typeof obj === 'object' &&
      obj !== null &&
      'required' in obj &&
      typeof (obj as Record<string, unknown>).required === 'string';

    it('should validate extracted data', () => {
      const result = extractJson<TestShape>('{"required": "test"}', validator);
      expect(result.success).toBe(true);
      expect(result.data?.required).toBe('test');
    });

    it('should fail validation for invalid shape', () => {
      const result = extractJson<TestShape>('{"wrong": "field"}', validator);
      expect(result.success).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return error for completely invalid input', () => {
      const result = extractJson('not json at all');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for empty input', () => {
      const result = extractJson('');
      expect(result.success).toBe(false);
    });

    it('should handle malformed JSON gracefully', () => {
      const result = extractJson('{"broken": }');
      expect(result.success).toBe(false);
    });
  });

  describe('security', () => {
    it('should safely handle prototype pollution attempts', () => {
      const input = '{"__proto__": {"polluted": true}}';
      const result = extractJson(input);

      // The result itself might parse, but shouldn't pollute Object.prototype
      const testObj = {};
      expect((testObj as Record<string, unknown>).polluted).toBeUndefined();
    });
  });
});

describe('hasRequiredFields', () => {
  it('should return true when all fields exist', () => {
    const obj = { name: 'test', value: 123 };
    expect(hasRequiredFields(obj, ['name', 'value'])).toBe(true);
  });

  it('should return false when fields are missing', () => {
    const obj = { name: 'test' };
    expect(hasRequiredFields(obj, ['name', 'value'])).toBe(false);
  });

  it('should return false for null', () => {
    expect(hasRequiredFields(null, ['name'])).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(hasRequiredFields('string', ['length'])).toBe(false);
    expect(hasRequiredFields(123, ['valueOf'])).toBe(false);
  });

  it('should handle empty required fields array', () => {
    expect(hasRequiredFields({}, [])).toBe(true);
  });
});
