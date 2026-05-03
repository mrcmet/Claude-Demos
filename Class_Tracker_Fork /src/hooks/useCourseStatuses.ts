/**
 * useCourseStatuses.ts
 *
 * React hook that derives CourseEvaluation[] from a plan file and student
 * progress state. This is the bridge between the engine layer and the UI.
 *
 * Design decisions:
 * - Memoized with useMemo so the O(n) engine computation only re-runs when
 *   planFile or student actually changes. This is critical for performance
 *   when the React Flow graph re-renders (which is frequent during pan/zoom).
 * - Returns an empty array (not null) when either input is absent — React Flow
 *   and the graph builder both handle empty evaluation arrays gracefully, and
 *   it simplifies the caller's conditional rendering logic.
 * - The memo deps include the full student object. If performance profiling
 *   reveals unnecessary recalculations, the caller can memoize student with
 *   useCallback/useMemo at a higher level; the hook itself stays simple.
 * - We do not expose the loading state — resolveAllStatuses is synchronous
 *   and fast (O(n)), so there is no async gap to represent.
 */

import { useMemo } from "react";
import type { PlanFile, StudentData, CourseEvaluation } from "../types";
import { resolveAllStatuses } from "../engine/statusResolver";

/**
 * Computes the evaluated status of every course in the plan given the
 * student's current progress.
 *
 * @param planFile - The loaded curriculum plan, or null if not yet loaded.
 * @param student  - The current student progress state, or null.
 * @returns        - Array of CourseEvaluation, one per course. Empty array
 *                   if either input is null.
 */
export function useCourseStatuses(
  planFile: PlanFile | null,
  student: StudentData | null
): CourseEvaluation[] {
  return useMemo<CourseEvaluation[]>(() => {
    if (planFile === null || student === null) {
      return [];
    }
    return resolveAllStatuses(planFile.courses, student);
  }, [planFile, student]);
}
