/**
 * prereqEngine.ts
 *
 * Types produced by the prerequisite evaluation engine.
 * GraphNode and GraphEdge are consumed directly by React Flow via Agent B's
 * TechTreeGraph component. These types are the primary contract between the
 * engine layer (Agent A) and the UI layer (Agent B).
 */

import type { Course } from "./curriculum";

/**
 * The four possible states of a course from the student's perspective.
 *
 * - "completed"   — student has finished the course.
 * - "in_progress" — student is currently enrolled this term.
 * - "available"   — all prerequisites and co-requisites are satisfied;
 *                   the student is eligible to enroll.
 * - "locked"      — one or more prerequisites or co-requisites are unmet.
 */
export type CourseStatus = "completed" | "in_progress" | "available" | "locked";

/**
 * The evaluation result for a single course.
 *
 * @field courseId       - Matches Course.id.
 * @field status         - Resolved enrollment status.
 * @field unmetPrereqs   - Course IDs that are missing from completedCourses and
 *                         are required by the prerequisite rule. Empty when
 *                         status is "completed" or "in_progress".
 * @field unmetCoreqs    - Course IDs that are neither completed nor in-progress
 *                         but are listed as co-requisites. Empty when satisfied.
 */
export interface CourseEvaluation {
  courseId: string;
  status: CourseStatus;
  unmetPrereqs: string[];
  unmetCoreqs: string[];
}

/**
 * A React Flow node representing one course in the tech tree.
 *
 * @field type     - Always "courseNode" so React Flow routes to CourseNode.tsx.
 * @field position - Initial position is { x: 0, y: 0 }; dagre layout replaces
 *                   these values before render.
 * @field data     - Carries the full course record, resolved status, and
 *                   evaluation details for rendering and interaction.
 */
export interface GraphNode {
  id: string;
  type: "courseNode";
  position: { x: number; y: number };
  data: {
    course: Course;
    status: CourseStatus;
    evaluation: CourseEvaluation;
  };
}

/**
 * A React Flow edge representing a prerequisite or co-requisite relationship.
 *
 * @field type     - "prereqEdge" renders as a solid directed arrow; "coreqEdge"
 *                   renders as a dashed bidirectional indicator. Both route to
 *                   PrereqEdge.tsx in Agent B's component registry.
 * @field animated - Set to true only when the target course status is "available",
 *                   creating the flowing-energy effect that signals readiness.
 * @field data.targetStatus - The resolved status of the target (destination)
 *                   course, used by PrereqEdge.tsx to select edge color from
 *                   the design system's status palette.
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "prereqEdge" | "coreqEdge";
  animated: boolean;
  data?: {
    targetStatus: CourseStatus;
  };
}
