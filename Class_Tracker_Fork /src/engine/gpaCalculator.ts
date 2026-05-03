import type { Course } from "../types";

export const GRADE_POINTS: Record<string, number> = {
  "A": 4.00, "A-": 3.67, "B+": 3.33, "B": 3.00, "B-": 2.67,
  "C+": 2.33, "C": 2.00, "C-": 1.67, "D": 1.00, "F": 0.00,
};

// Ordered best → worst, used for grade picker UI
export const GRADE_ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

/**
 * Returns true if `earned` is at least as good as `minimum`.
 * Lower index in GRADE_ORDER = better grade.
 * Unknown grade strings (not in GRADE_ORDER) return false.
 */
export function meetsMinGrade(earned: string, minimum: string): boolean {
  const earnedIdx = GRADE_ORDER.indexOf(earned);
  const minIdx = GRADE_ORDER.indexOf(minimum);
  if (earnedIdx === -1 || minIdx === -1) return false;
  return earnedIdx <= minIdx;
}

/**
 * Weighted GPA: Σ(quality_points × credits) / Σ(credits)
 *
 * Only courses present in both gpaData and the courses array with credits > 0
 * are counted. Returns null when there are no qualifying graded courses so
 * callers can distinguish "0.00 GPA" from "no data yet".
 */
export function calculateGpa(
  gpaData: Record<string, string>,
  courses: Course[]
): { gpa: number; creditCount: number } | null {
  const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));

  let totalQualityPoints = 0;
  let totalCredits = 0;

  for (const [courseId, grade] of Object.entries(gpaData)) {
    const course = courseMap.get(courseId);
    if (!course || course.credits <= 0) continue;

    const points = GRADE_POINTS[grade];
    // Skip grades not in the GRADE_POINTS table (e.g. Transfer, W, etc.)
    if (points === undefined) continue;

    totalQualityPoints += points * course.credits;
    totalCredits += course.credits;
  }

  if (totalCredits === 0) return null;

  return {
    gpa: totalQualityPoints / totalCredits,
    creditCount: totalCredits,
  };
}
