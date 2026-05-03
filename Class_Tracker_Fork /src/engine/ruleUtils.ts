/**
 * ruleUtils.ts
 *
 * Utility helpers for working with PrereqRule values.
 * Kept in a separate file to avoid circular imports between the evaluator
 * and the graph builder, both of which need course-ID extraction.
 *
 * Pure functions, no side effects.
 */

import type { PrereqRule } from "../types";

/**
 * Extracts all referenced course IDs from a PrereqRule regardless of rule type.
 * Used by graphBuilder to determine which edges to emit.
 *
 * - "none"   → []
 * - "all"    → rule.courses
 * - "any"    → rule.courses
 * - "choose" → rule.courses
 *
 * @param rule - A course's prerequisites field.
 * @returns    - Array of course ID strings referenced in the rule.
 *               Returns a new array; safe to mutate.
 */
export function extractCourseIdsFromRule(rule: PrereqRule): string[] {
  switch (rule.type) {
    case "none":
      return [];
    case "all":
    case "any":
    case "choose":
      return [...rule.courses];
    default: {
      // Exhaustive guard — TypeScript narrows to never here.
      const _exhaustive: never = rule;
      void _exhaustive;
      return [];
    }
  }
}
