/**
 * student.ts
 *
 * Types representing a student's academic progress state.
 * Persisted to localStorage and exported/imported as JSON files.
 * No engine logic here — pure data shape.
 */

/**
 * A student's persisted progress record.
 *
 * @field name              - Student's display name (editable in UI).
 * @field selectedProgram   - Program ID from PlanFile.programs, or null if not
 *                            yet chosen.
 * @field catalogYear       - The catalog year this record applies to (e.g. "2026").
 * @field completedCourses  - Array of course IDs the student has finished.
 * @field inProgressCourses - Array of course IDs currently being taken this term.
 * @field gpaData           - Optional map of courseId → letter grade, for future
 *                            GPA tracking features. Does not affect status
 *                            evaluation in v1.0.
 * @field exportedAt        - ISO-8601 timestamp injected at export time. Absent
 *                            in runtime state; present only in exported files.
 * @field version           - Schema version, must be "1.0" for this release.
 */
export interface StudentData {
  name: string;
  selectedProgram: string | null;
  catalogYear: string;
  completedCourses: string[];
  inProgressCourses: string[];
  gpaData?: Record<string, string>;
  exportedAt?: string;
  version: "1.0";
}
