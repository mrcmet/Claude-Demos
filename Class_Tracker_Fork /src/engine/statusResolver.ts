/**
 * statusResolver.ts
 *
 * Resolves the CourseStatus and full CourseEvaluation for every course in a
 * plan given a student's current progress state.
 *
 * This is the primary orchestration point of the evaluation engine. It builds
 * O(1)-lookup Sets from the student's arrays once and then evaluates each
 * course in a single O(n) pass, keeping total complexity O(n + p) where p is
 * the total number of prerequisite entries across all courses.
 *
 * Design constraints:
 * - Pure function. No mutations, no side effects.
 * - Never throws. Missing prereq course IDs (cross-plan references) are
 *   treated as not completed rather than erroring.
 * - Completed and in-progress status short-circuits prerequisite evaluation —
 *   a student already enrolled does not need their prereqs re-checked.
 */

import type { Course, StudentData, CourseEvaluation } from "../types";
import { evaluatePrereqRule } from "./prereqEvaluator";
import { evaluateCoreqs } from "./coreqEvaluator";

/**
 * Computes a CourseEvaluation for every course in the provided list.
 *
 * Status resolution algorithm per course:
 * 1. If courseId is in student.completedCourses  → status "completed"  (short-circuit)
 * 2. If courseId is in student.inProgressCourses → status "in_progress" (short-circuit)
 * 3. Evaluate prerequisites via evaluatePrereqRule.
 * 4. Evaluate co-requisites via evaluateCoreqs.
 * 5. Both satisfied → status "available"
 * 6. Any unsatisfied → status "locked", populate unmetPrereqs / unmetCoreqs.
 *
 * @param courses  - Full course list from PlanFile.courses.
 * @param student  - Current student progress state.
 * @returns        - One CourseEvaluation per course, in the same order as input.
 */
export function resolveAllStatuses(
  courses: Course[],
  student: StudentData
): CourseEvaluation[] {
  // Build O(1) lookup sets once — avoids O(n) Array.includes inside the loop.
  const completedSet = new Set<string>(student.completedCourses);
  const inProgressSet = new Set<string>(student.inProgressCourses);

  return courses.map((course): CourseEvaluation => {
    // Short-circuit: already completed — no need to evaluate rules.
    if (completedSet.has(course.id)) {
      return {
        courseId: course.id,
        status: "completed",
        unmetPrereqs: [],
        unmetCoreqs: [],
      };
    }

    // Short-circuit: currently enrolled — treat as in_progress regardless of
    // whether prereqs are formally met (enrollment already happened).
    if (inProgressSet.has(course.id)) {
      return {
        courseId: course.id,
        status: "in_progress",
        unmetPrereqs: [],
        unmetCoreqs: [],
      };
    }

    // Evaluate prerequisite rule.
    // evaluatePrereqRule handles unknown rule types gracefully (returns satisfied).
    // Missing course IDs in the Set are naturally treated as not completed.
    const prereqResult = evaluatePrereqRule(course.prerequisites, completedSet);

    // Evaluate co-requisites.
    const coreqResult = evaluateCoreqs(
      course.corequisites,
      completedSet,
      inProgressSet
    );

    if (prereqResult.satisfied && coreqResult.satisfied) {
      return {
        courseId: course.id,
        status: "available",
        unmetPrereqs: [],
        unmetCoreqs: [],
      };
    }

    return {
      courseId: course.id,
      status: "locked",
      unmetPrereqs: prereqResult.unmet,
      unmetCoreqs: coreqResult.unmet,
    };
  });
}
