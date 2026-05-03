/**
 * prereqEvaluator.ts
 *
 * Pure function for evaluating a single PrereqRule against a student's
 * completed course set.
 *
 * Design constraints:
 * - No side effects. Same inputs always produce the same output.
 * - Never throws. Unknown/malformed rules are treated as satisfied so
 *   missing data in a plan file does not lock students out of courses.
 * - All Set lookups are O(1); function is O(n) in the number of listed courses.
 */

import type { PrereqRule } from "../types";

/** Result returned by evaluatePrereqRule. */
export interface PrereqResult {
  /** True when the rule's conditions are fully met. */
  satisfied: boolean;
  /**
   * The course IDs that are blocking satisfaction.
   * Empty array when satisfied === true.
   *
   * For "any": all listed courses (none are completed, any one would unlock).
   * For "choose": the courses that are NOT in completedCourses (when count unmet).
   * For "all": the courses missing from completedCourses.
   */
  unmet: string[];
}

/**
 * Evaluates whether a prerequisite rule is satisfied given a set of
 * completed course IDs.
 *
 * @param rule             - The prerequisite rule from Course.prerequisites.
 * @param completedCourses - Set of course IDs the student has completed.
 *                           Using a Set ensures O(1) membership tests even
 *                           for large completed lists.
 * @returns PrereqResult   - { satisfied, unmet }
 */
export function evaluatePrereqRule(
  rule: PrereqRule,
  completedCourses: Set<string>
): PrereqResult {
  switch (rule.type) {
    case "none":
      return { satisfied: true, unmet: [] };

    case "all": {
      const unmet = rule.courses.filter((id) => !completedCourses.has(id));
      return { satisfied: unmet.length === 0, unmet };
    }

    case "any": {
      const anyMet = rule.courses.some((id) => completedCourses.has(id));
      if (anyMet) {
        return { satisfied: true, unmet: [] };
      }
      // Report all courses as unmet — any one of them would unlock this course.
      return { satisfied: false, unmet: [...rule.courses] };
    }

    case "choose": {
      const metCourses = rule.courses.filter((id) => completedCourses.has(id));
      if (metCourses.length >= rule.count) {
        return { satisfied: true, unmet: [] };
      }
      // Report the courses that are NOT yet completed so the student knows
      // what to choose from to meet the count requirement.
      const unmet = rule.courses.filter((id) => !completedCourses.has(id));
      return { satisfied: false, unmet };
    }

    default: {
      // Exhaustive type guard: TypeScript narrows `rule` to `never` here.
      // At runtime, treat unknown rule types as satisfied to avoid
      // incorrectly locking students out due to plan file schema evolution.
      const _exhaustive: never = rule;
      void _exhaustive;
      return { satisfied: true, unmet: [] };
    }
  }
}
