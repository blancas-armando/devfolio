/**
 * Robust JSON extraction from LLM responses
 * Handles various formats: pure JSON, markdown code blocks, mixed text
 */

export interface JsonExtractionResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Attempt to repair common JSON issues from LLM output
 */
function repairJson(content: string): string | null {
  // Find JSON-like content
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let json = match[0];

  // Fix trailing commas before closing brackets
  json = json.replace(/,(\s*[}\]])/g, '$1');

  // Fix unquoted keys (simple cases)
  json = json.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

  return json;
}

/**
 * Extract and parse JSON from LLM response content
 * Tries multiple strategies: direct parse, code blocks, regex extraction, repair
 */
export function extractJson<T>(
  content: string,
  validator?: (obj: unknown) => obj is T
): JsonExtractionResult<T> {
  // Strategy 1: Direct parse (content is pure JSON)
  try {
    const parsed = JSON.parse(content);
    if (!validator || validator(parsed)) {
      return { success: true, data: parsed as T };
    }
  } catch {
    // Not pure JSON, continue
  }

  // Strategy 2: Extract from markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (!validator || validator(parsed)) {
        return { success: true, data: parsed as T };
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Find first complete JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (!validator || validator(parsed)) {
        return { success: true, data: parsed as T };
      }
    } catch {
      // JSON is malformed, try repair
    }
  }

  // Strategy 4: Attempt to repair common issues
  const repaired = repairJson(content);
  if (repaired) {
    try {
      const parsed = JSON.parse(repaired);
      if (!validator || validator(parsed)) {
        return { success: true, data: parsed as T };
      }
    } catch {
      // Repair failed
    }
  }

  return {
    success: false,
    data: null,
    error: 'Could not extract valid JSON from response',
  };
}

/**
 * Type guard helpers for common response shapes
 */
export function hasRequiredFields<T extends string>(
  obj: unknown,
  fields: T[]
): obj is Record<T, unknown> {
  if (typeof obj !== 'object' || obj === null) return false;
  return fields.every((field) => field in obj);
}
