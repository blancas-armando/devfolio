/**
 * Zod Schemas for AI Tool Validation
 *
 * Type-safe validation for all AI tool arguments.
 * Prevents runtime errors from malformed AI responses.
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// Base Schemas
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Stock symbol validation (1-5 uppercase letters)
 */
export const symbolSchema = z
  .string()
  .min(1, 'Symbol cannot be empty')
  .max(10, 'Symbol too long')
  .transform((s) => s.toUpperCase().trim())
  .refine((s) => /^[A-Z0-9.^-]+$/.test(s), {
    message: 'Invalid symbol format',
  });

/**
 * Array of symbols (at least one)
 */
export const symbolsArraySchema = z
  .array(symbolSchema)
  .min(1, 'At least one symbol required');

/**
 * Positive number for shares
 */
export const sharesSchema = z
  .number()
  .positive('Shares must be positive');

/**
 * Non-negative number for cost basis
 */
export const costBasisSchema = z
  .number()
  .nonnegative('Cost basis cannot be negative');

// ═══════════════════════════════════════════════════════════════════════════
// Tool Argument Schemas
// ═══════════════════════════════════════════════════════════════════════════

export const toolSchemas = {
  // No-argument tools
  show_dashboard: z.object({}),
  show_portfolio: z.object({}),
  get_news: z.object({
    symbol: symbolSchema.optional(),
  }),

  // Single symbol tools
  lookup_stock: z.object({
    symbol: symbolSchema,
  }),

  lookup_etf: z.object({
    symbol: symbolSchema,
  }),

  get_filings: z.object({
    symbol: symbolSchema,
  }),

  // Multi-symbol tools
  add_to_watchlist: z.object({
    symbols: symbolsArraySchema,
  }),

  remove_from_watchlist: z.object({
    symbols: symbolsArraySchema,
  }),

  compare_etfs: z.object({
    symbols: z
      .array(symbolSchema)
      .min(2, 'At least 2 ETFs required for comparison')
      .max(4, 'Maximum 4 ETFs for comparison'),
  }),

  compare_stocks: z.object({
    symbols: z
      .array(symbolSchema)
      .min(2, 'At least 2 stocks required for comparison')
      .max(4, 'Maximum 4 stocks for comparison'),
  }),

  // Holding tool
  add_holding: z.object({
    symbol: symbolSchema,
    shares: sharesSchema,
    cost_basis: costBasisSchema,
  }),
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Type Inference
// ═══════════════════════════════════════════════════════════════════════════

export type ToolSchemas = typeof toolSchemas;
export type ToolName = keyof ToolSchemas;

/** Infer the argument type for a specific tool */
export type ToolArgs<T extends ToolName> = z.infer<ToolSchemas[T]>;

// ═══════════════════════════════════════════════════════════════════════════
// Validation Function
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate tool arguments
 *
 * @param toolName - Name of the tool
 * @param args - Raw arguments from AI
 * @returns Validated and typed arguments, or error message
 */
export function validateToolArgs<T extends ToolName>(
  toolName: T,
  args: unknown
): ValidationResult<ToolArgs<T>> {
  const schema = toolSchemas[toolName];
  if (!schema) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
    };
  }

  const result = schema.safeParse(args);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    return {
      success: false,
      error: `Invalid arguments for ${toolName}: ${errors}`,
    };
  }

  return {
    success: true,
    data: result.data as ToolArgs<T>,
  };
}

/**
 * Check if a tool name is valid
 */
export function isValidToolName(name: string): name is ToolName {
  return name in toolSchemas;
}
