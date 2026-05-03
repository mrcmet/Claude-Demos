/**
 * coreqEvaluator.ts
 *
 * Pure function for evaluating co-requisite satisfaction.
 *
 * Co-requisites differ from prerequisites: a co-requisite is satisfied when
 * the required course is EITHER already completed OR currently in-progress in
 * the same term. This is the rule that allows same-semester enrollment pairs
 * (e.g. ME301 lab and lecture taken together for the first time).
 *
 * Design constraints:
 * - No side effects. Pure function.
 * - Never throws.
 * - O(n) in the number of co-requisite entries.
 */

/** Result returned by evaluateCoreqs. */
export interface CoreqResult {
  /** True when all co-requisites are satisfied. */
  satisfied: boolean;
  /**
   * Course IDs that are neither completed nor in-progress.
   * Empty when satisfied === true.
   */
  unmet: string[];
}

/**
 * Evaluates whether all co-requisites for a course are satisfied.
 *
 * A co-requisite is considered satisfied if the course ID appears in either
 * `completedCourses` or `inProgressCourses`. This models the real-world
 * academic policy where co-requisites may be taken concurrently.
 *
 * @param corequisites       - Array of course IDs from Course.corequisites.
 * @param completedCourses   - Set of course IDs the student has completed.
 * @param inProgressCourses  - Set of course IDs currently being taken.
 * @returns CoreqResult      - { satisfied, unmet }
 */
export function evaluateCoreqs(
  corequisites: string[],
  completedCourses: Set<string>,
  inProgressCourses: Set<string>
): CoreqResult {
  if (corequisites.length === 0) {
    return { satisfied: true, unmet: [] };
  }

  const unmet = corequisites.filter(
    (id) => !completedCourses.has(id) && !inProgressCourses.has(id)
  );

  return { satisfied: unmet.length === 0, unmet };
}
