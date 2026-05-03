/**
 * graphBuilder.ts
 *
 * Converts a resolved set of CourseEvaluations into React Flow graph data
 * (nodes + edges) ready for dagre layout and rendering.
 *
 * Design constraints:
 * - Pure function. No mutations, no side effects.
 * - Never throws. Cross-plan edge references (source courseId not in plan) are
 *   silently skipped rather than crashing the graph.
 * - Positions are initialized to { x: 0, y: 0 }; the dagre layout pass in
 *   Agent B's graphLayout.ts will overwrite them before render.
 * - Edge animation (the flowing-energy effect) is set only for edges whose
 *   target course is "available" — exactly the semantic Agent B specified.
 * - data.targetStatus is set on every edge so PrereqEdge.tsx can pick the
 *   correct color from the design system without needing to re-derive it.
 *
 * Edge ID scheme: `{source}--{target}--{type}` guarantees uniqueness across
 * both prereq and coreq edges between the same pair, and is stable across
 * re-renders (no random IDs).
 *
 * Coreq edges are deduplicated: if course A lists B as a coreq and course B
 * also lists A as a coreq, only one edge is emitted (the one with the
 * lexicographically smaller source ID) to avoid duplicate React Flow edges.
 */

import type { Course, CourseEvaluation, GraphNode, GraphEdge, CourseStatus } from "../types";
import { extractCourseIdsFromRule } from "./ruleUtils";

/**
 * Builds React Flow node and edge arrays from courses and their resolved
 * evaluation results.
 *
 * @param courses     - All courses in the plan file.
 * @param evaluations - Output of resolveAllStatuses; must cover every course.
 * @returns           - { nodes, edges } ready for React Flow (positions = 0,0).
 */
export function buildGraphData(
  courses: Course[],
  evaluations: CourseEvaluation[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // Build evaluation lookup for O(1) status retrieval during edge construction.
  const evalMap = new Map<string, CourseEvaluation>(
    evaluations.map((e) => [e.courseId, e])
  );

  // Build course ID set for O(1) cross-plan reference validation.
  const courseIdSet = new Set<string>(courses.map((c) => c.id));

  // --- Nodes ---
  const nodes: GraphNode[] = courses.map((course): GraphNode => {
    const evaluation = evalMap.get(course.id) ?? {
      courseId: course.id,
      status: "locked" as CourseStatus,
      unmetPrereqs: [],
      unmetCoreqs: [],
    };

    return {
      id: course.id,
      type: "courseNode",
      // Dagre layout will overwrite these positions before render.
      position: { x: 0, y: 0 },
      data: {
        course,
        status: evaluation.status,
        evaluation,
      },
    };
  });

  // --- Edges ---
  const edges: GraphEdge[] = [];
  // Track emitted coreq edge pairs to deduplicate bidirectional declarations.
  const emittedCoreqPairs = new Set<string>();

  for (const course of courses) {
    const targetEval = evalMap.get(course.id);
    const targetStatus: CourseStatus = targetEval?.status ?? "locked";
    const isAvailable = targetStatus === "available";

    // Prerequisite edges: one edge per course ID extracted from the rule.
    // "none" rules produce no IDs (extractCourseIdsFromRule returns []).
    const prereqSourceIds = extractCourseIdsFromRule(course.prerequisites);

    for (const sourceId of prereqSourceIds) {
      // Skip cross-plan references: if the source course is not in this plan
      // file, we cannot render a valid edge.
      if (!courseIdSet.has(sourceId)) {
        continue;
      }

      edges.push({
        id: `${sourceId}--${course.id}--prereq`,
        source: sourceId,
        target: course.id,
        type: "prereqEdge",
        animated: isAvailable,
        data: { targetStatus },
      });
    }

    // Co-requisite edges.
    for (const coreqId of course.corequisites) {
      if (!courseIdSet.has(coreqId)) {
        continue;
      }

      // Deduplicate bidirectional coreq declarations by canonicalizing the
      // pair so the edge with the lexicographically smaller source ID wins.
      const pairKey =
        course.id < coreqId
          ? `${course.id}--${coreqId}--coreq`
          : `${coreqId}--${course.id}--coreq`;

      if (emittedCoreqPairs.has(pairKey)) {
        continue;
      }
      emittedCoreqPairs.add(pairKey);

      edges.push({
        id: pairKey,
        source: course.id,
        target: coreqId,
        type: "coreqEdge",
        animated: isAvailable,
        data: { targetStatus },
      });
    }
  }

  return { nodes, edges };
}
