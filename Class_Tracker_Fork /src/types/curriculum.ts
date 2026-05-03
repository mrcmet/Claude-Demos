/**
 * curriculum.ts
 *
 * Core domain types representing a curriculum plan file.
 * These are the stable contracts between the data layer and the engine.
 * Pure data — no logic, no side effects.
 */

/**
 * Discriminated union for prerequisite rules.
 *
 * - "none"   — no prerequisites required (entry-level courses)
 * - "all"    — every listed course must be completed
 * - "any"    — at least one listed course must be completed
 * - "choose" — at least `count` of the listed courses must be completed
 */
export type PrereqRule =
  | { type: "none" }
  | { type: "all"; courses: string[] }
  | { type: "any"; courses: string[] }
  | { type: "choose"; count: number; courses: string[] };

/** Academic term in which a course is offered. */
export type Term = "Fall" | "Spring" | "Summer" | "Winter";

/**
 * A single course in the curriculum.
 *
 * @field id            - Canonical course code (e.g. "MATH101"). Used as the
 *                        primary key throughout the engine and graph layer.
 * @field name          - Human-readable title.
 * @field credits       - Credit hours (integer ≥ 0).
 * @field prerequisites - Prerequisite rule evaluated before enrollment.
 * @field corequisites  - Course IDs that must be in-progress or completed
 *                        concurrently with this course.
 * @field minGrade      - Minimum letter grade required for a prereq to count.
 *                        Stored as metadata; enforcement is left to the UI layer.
 * @field termsOffered  - Semesters in which the course is available.
 * @field description   - Optional catalog description.
 */
export interface Course {
  id: string;
  name: string;
  credits: number;
  prerequisites: PrereqRule;
  corequisites: string[];
  minGrade?: string;
  termsOffered: Term[];
  description?: string;
}

/**
 * A named elective set from which a student must complete `chooseCount` courses.
 * Distinct from the `choose` PrereqRule — this operates at program level, not
 * course-prereq level.
 */
export interface ElectiveSet {
  id: string;
  label: string;
  chooseCount: number;
  courses: string[];
}

/**
 * A degree program (e.g. "B.S. Mechanical Engineering").
 * Lists the required course IDs and optional elective sets that constitute the
 * degree requirements.
 */
export interface Program {
  id: string;
  name: string;
  requiredCourses: string[];
  electiveSets?: ElectiveSet[];
}

/**
 * The root document loaded from a `.json` plan file.
 * Versioned at "1.0" to allow forward-compatible schema migration.
 */
export interface PlanFile {
  department: string;
  catalogYear: string;
  courses: Course[];
  programs: Program[];
  version: "1.0";
}
