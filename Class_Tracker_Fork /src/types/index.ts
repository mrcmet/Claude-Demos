/**
 * src/types/index.ts
 *
 * Central re-export barrel for all shared type contracts.
 *
 * Import convention for consumers:
 *   import type { Course, PlanFile, CourseStatus, GraphNode } from "../types";
 *   // or with path alias:
 *   import type { CourseStatus, GraphEdge } from "@types";
 *
 * Agent B's components should import ONLY from this barrel, never from the
 * individual module files directly — this allows internal reorganization
 * without breaking consumer imports.
 */

export type { PrereqRule, Term, Course, ElectiveSet, Program, PlanFile } from "./curriculum";

export type { StudentData } from "./student";

export type {
  CourseStatus,
  CourseEvaluation,
  GraphNode,
  GraphEdge,
} from "./prereqEngine";
