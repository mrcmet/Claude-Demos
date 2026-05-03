/**
 * engine.test.ts
 *
 * Vitest unit tests for the core evaluation engine.
 *
 * Coverage:
 * - evaluatePrereqRule: all four rule types, satisfied and unsatisfied paths
 * - evaluateCoreqs: completed, in-progress, and not-started co-reqs
 * - resolveAllStatuses: completed/in-progress short-circuit, available/locked
 *   resolution, and robustness against missing prereq course IDs
 *
 * No mocking required — all functions under test are pure.
 */

import { describe, it, expect } from "vitest";
import { evaluatePrereqRule } from "./prereqEvaluator";
import { evaluateCoreqs } from "./coreqEvaluator";
import { resolveAllStatuses } from "./statusResolver";
import type { Course, StudentData } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStudent(
  completed: string[] = [],
  inProgress: string[] = []
): StudentData {
  return {
    name: "Test Student",
    selectedProgram: null,
    catalogYear: "2026",
    completedCourses: completed,
    inProgressCourses: inProgress,
    version: "1.0",
  };
}

function makeCourse(
  id: string,
  prereqRule: Course["prerequisites"] = { type: "none" },
  coreqs: string[] = []
): Course {
  return {
    id,
    name: `Course ${id}`,
    credits: 3,
    prerequisites: prereqRule,
    corequisites: coreqs,
    termsOffered: ["Fall", "Spring"],
  };
}

// ---------------------------------------------------------------------------
// evaluatePrereqRule
// ---------------------------------------------------------------------------

describe("evaluatePrereqRule", () => {
  describe('type: "none"', () => {
    it("is always satisfied regardless of completed set", () => {
      const emptySet = new Set<string>();
      const result = evaluatePrereqRule({ type: "none" }, emptySet);
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });

    it("is satisfied even when completedCourses is non-empty", () => {
      const result = evaluatePrereqRule(
        { type: "none" },
        new Set(["MATH101", "PHYS101"])
      );
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });
  });

  describe('type: "all"', () => {
    it("is satisfied when all courses are completed", () => {
      const result = evaluatePrereqRule(
        { type: "all", courses: ["MATH101", "PHYS101"] },
        new Set(["MATH101", "PHYS101", "ENGR101"])
      );
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });

    it("is not satisfied when one course is missing; unmet contains only that course", () => {
      const result = evaluatePrereqRule(
        { type: "all", courses: ["MATH101", "PHYS101"] },
        new Set(["MATH101"])
      );
      expect(result.satisfied).toBe(false);
      expect(result.unmet).toEqual(["PHYS101"]);
    });

    it("is not satisfied when all courses are missing; unmet contains all of them", () => {
      const result = evaluatePrereqRule(
        { type: "all", courses: ["MATH101", "PHYS101", "ENGR101"] },
        new Set([])
      );
      expect(result.satisfied).toBe(false);
      expect(result.unmet).toEqual(["MATH101", "PHYS101", "ENGR101"]);
    });

    it("is satisfied for an empty courses list", () => {
      const result = evaluatePrereqRule(
        { type: "all", courses: [] },
        new Set([])
      );
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });
  });

  describe('type: "any"', () => {
    it("is satisfied when at least one course is completed", () => {
      const result = evaluatePrereqRule(
        { type: "any", courses: ["STAT200", "STAT210", "MATH301"] },
        new Set(["STAT200"])
      );
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });

    it("is satisfied when more than one course is completed", () => {
      const result = evaluatePrereqRule(
        { type: "any", courses: ["STAT200", "STAT210"] },
        new Set(["STAT200", "STAT210"])
      );
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });

    it("is not satisfied when none are completed; unmet contains all courses", () => {
      const result = evaluatePrereqRule(
        { type: "any", courses: ["STAT200", "STAT210", "MATH301"] },
        new Set(["MATH101"])
      );
      expect(result.satisfied).toBe(false);
      expect(result.unmet).toEqual(["STAT200", "STAT210", "MATH301"]);
    });

    it("is not satisfied with empty completed set; unmet contains all courses", () => {
      const result = evaluatePrereqRule(
        { type: "any", courses: ["STAT200", "STAT210"] },
        new Set([])
      );
      expect(result.satisfied).toBe(false);
      expect(result.unmet).toEqual(["STAT200", "STAT210"]);
    });
  });

  describe('type: "choose"', () => {
    it("is satisfied when exactly count courses are completed", () => {
      const result = evaluatePrereqRule(
        { type: "choose", count: 2, courses: ["ME401", "ME402", "ME403"] },
        new Set(["ME401", "ME402"])
      );
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });

    it("is satisfied when more than count courses are completed", () => {
      const result = evaluatePrereqRule(
        { type: "choose", count: 1, courses: ["ME401", "ME402", "ME403"] },
        new Set(["ME401", "ME402", "ME403"])
      );
      expect(result.satisfied).toBe(true);
      expect(result.unmet).toEqual([]);
    });

    it("is not satisfied when count - 1 courses are completed; unmet contains those not completed", () => {
      const result = evaluatePrereqRule(
        { type: "choose", count: 2, courses: ["ME401", "ME402", "ME403"] },
        new Set(["ME401"])
      );
      expect(result.satisfied).toBe(false);
      // ME402 and ME403 are not completed
      expect(result.unmet).toContain("ME402");
      expect(result.unmet).toContain("ME403");
      expect(result.unmet).not.toContain("ME401");
    });

    it("is not satisfied when no courses are completed", () => {
      const result = evaluatePrereqRule(
        { type: "choose", count: 1, courses: ["ME401", "ME402"] },
        new Set([])
      );
      expect(result.satisfied).toBe(false);
      expect(result.unmet).toEqual(["ME401", "ME402"]);
    });
  });
});

// ---------------------------------------------------------------------------
// evaluateCoreqs
// ---------------------------------------------------------------------------

describe("evaluateCoreqs", () => {
  it("is satisfied when the coreq course is completed", () => {
    const result = evaluateCoreqs(
      ["ME302"],
      new Set(["ME302"]),
      new Set([])
    );
    expect(result.satisfied).toBe(true);
    expect(result.unmet).toEqual([]);
  });

  it("is satisfied when the coreq course is in-progress (same-semester enrollment)", () => {
    const result = evaluateCoreqs(
      ["ME302"],
      new Set([]),
      new Set(["ME302"])
    );
    expect(result.satisfied).toBe(true);
    expect(result.unmet).toEqual([]);
  });

  it("is satisfied when the coreq course is both completed and in-progress (edge case)", () => {
    const result = evaluateCoreqs(
      ["ME302"],
      new Set(["ME302"]),
      new Set(["ME302"])
    );
    expect(result.satisfied).toBe(true);
    expect(result.unmet).toEqual([]);
  });

  it("is not satisfied when the coreq course is not started; unmet contains the course", () => {
    const result = evaluateCoreqs(
      ["ME302"],
      new Set(["MATH101"]),
      new Set(["PHYS201"])
    );
    expect(result.satisfied).toBe(false);
    expect(result.unmet).toEqual(["ME302"]);
  });

  it("is satisfied for an empty corequisites list", () => {
    const result = evaluateCoreqs([], new Set([]), new Set([]));
    expect(result.satisfied).toBe(true);
    expect(result.unmet).toEqual([]);
  });

  it("reports only the unmet coreqs when multiple are required and some are met", () => {
    const result = evaluateCoreqs(
      ["LAB301", "LAB302"],
      new Set(["LAB301"]),
      new Set([])
    );
    expect(result.satisfied).toBe(false);
    expect(result.unmet).toEqual(["LAB302"]);
  });
});

// ---------------------------------------------------------------------------
// resolveAllStatuses
// ---------------------------------------------------------------------------

describe("resolveAllStatuses", () => {
  describe("short-circuit rules", () => {
    it("returns 'completed' for a course in completedCourses regardless of prereqs", () => {
      // MATH201 requires MATH101 AND PHYS101, but neither is completed —
      // it should still be 'completed' because MATH201 is in completedCourses.
      const courses: Course[] = [
        makeCourse("MATH201", { type: "all", courses: ["MATH101", "PHYS101"] }),
      ];
      const student = makeStudent(["MATH201"], []);
      const results = resolveAllStatuses(courses, student);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("completed");
      expect(results[0].unmetPrereqs).toEqual([]);
      expect(results[0].unmetCoreqs).toEqual([]);
    });

    it("returns 'in_progress' for a course in inProgressCourses regardless of prereqs", () => {
      const courses: Course[] = [
        makeCourse("ME301", { type: "all", courses: ["ME201", "ME202"] }),
      ];
      const student = makeStudent([], ["ME301"]);
      const results = resolveAllStatuses(courses, student);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("in_progress");
      expect(results[0].unmetPrereqs).toEqual([]);
      expect(results[0].unmetCoreqs).toEqual([]);
    });
  });

  describe("available status", () => {
    it("returns 'available' when all prereqs and coreqs are satisfied", () => {
      const courses: Course[] = [
        makeCourse("MATH101"),
        makeCourse("MATH201", { type: "all", courses: ["MATH101"] }),
      ];
      const student = makeStudent(["MATH101"], []);
      const results = resolveAllStatuses(courses, student);

      const math201 = results.find((r) => r.courseId === "MATH201");
      expect(math201?.status).toBe("available");
      expect(math201?.unmetPrereqs).toEqual([]);
    });

    it("returns 'available' for a type:none course with no completed courses at all", () => {
      const courses: Course[] = [makeCourse("ENGR101")];
      const student = makeStudent([], []);
      const results = resolveAllStatuses(courses, student);

      expect(results[0].status).toBe("available");
    });

    it("returns 'available' when coreq is in-progress", () => {
      const courses: Course[] = [
        makeCourse("ME301", { type: "none" }, ["ME302"]),
        makeCourse("ME302"),
      ];
      // ME302 is in-progress so ME301's coreq is satisfied
      const student = makeStudent([], ["ME302"]);
      const results = resolveAllStatuses(courses, student);

      const me301 = results.find((r) => r.courseId === "ME301");
      expect(me301?.status).toBe("available");
      expect(me301?.unmetCoreqs).toEqual([]);
    });
  });

  describe("locked status", () => {
    it("returns 'locked' when prereqs are not met; unmetPrereqs populated", () => {
      const courses: Course[] = [
        makeCourse("MATH201", { type: "all", courses: ["MATH101", "PHYS101"] }),
      ];
      const student = makeStudent([], []);
      const results = resolveAllStatuses(courses, student);

      expect(results[0].status).toBe("locked");
      expect(results[0].unmetPrereqs).toContain("MATH101");
      expect(results[0].unmetPrereqs).toContain("PHYS101");
    });

    it("returns 'locked' when coreqs are not met; unmetCoreqs populated", () => {
      const courses: Course[] = [
        makeCourse("ME301", { type: "none" }, ["ME302"]),
      ];
      // ME302 is not completed or in-progress
      const student = makeStudent([], []);
      const results = resolveAllStatuses(courses, student);

      expect(results[0].status).toBe("locked");
      expect(results[0].unmetCoreqs).toEqual(["ME302"]);
    });
  });

  describe("robustness", () => {
    it("handles missing prereq course ID (cross-plan reference) without throwing", () => {
      const courses: Course[] = [
        // References EXTERNAL100 which is not in the plan courses array
        makeCourse("ME401", { type: "all", courses: ["EXTERNAL100"] }),
      ];
      const student = makeStudent([], []);

      // Should not throw
      expect(() => resolveAllStatuses(courses, student)).not.toThrow();

      const results = resolveAllStatuses(courses, student);
      expect(results[0].status).toBe("locked");
      expect(results[0].unmetPrereqs).toContain("EXTERNAL100");
    });

    it("returns one evaluation per course in the same order as input", () => {
      const courses: Course[] = [
        makeCourse("MATH101"),
        makeCourse("MATH201", { type: "all", courses: ["MATH101"] }),
        makeCourse("MATH301", { type: "all", courses: ["MATH201"] }),
      ];
      const student = makeStudent(["MATH101", "MATH201"], []);
      const results = resolveAllStatuses(courses, student);

      expect(results).toHaveLength(3);
      expect(results[0].courseId).toBe("MATH101");
      expect(results[1].courseId).toBe("MATH201");
      expect(results[2].courseId).toBe("MATH301");
    });

    it("handles empty course list without throwing", () => {
      const results = resolveAllStatuses([], makeStudent());
      expect(results).toEqual([]);
    });

    it("handles a student with empty progress arrays", () => {
      const courses: Course[] = [makeCourse("ENGR101")];
      const student = makeStudent([], []);
      expect(() => resolveAllStatuses(courses, student)).not.toThrow();
    });
  });

  describe("multi-level dependency chain", () => {
    it("correctly cascades status through a 3-level chain", () => {
      const courses: Course[] = [
        makeCourse("MATH101"),
        makeCourse("MATH201", { type: "all", courses: ["MATH101"] }),
        makeCourse("MATH301", { type: "all", courses: ["MATH201"] }),
      ];

      // Only MATH101 completed: MATH201 available, MATH301 locked
      const student = makeStudent(["MATH101"], []);
      const results = resolveAllStatuses(courses, student);

      const byId = Object.fromEntries(results.map((r) => [r.courseId, r]));
      expect(byId["MATH101"].status).toBe("completed");
      expect(byId["MATH201"].status).toBe("available");
      expect(byId["MATH301"].status).toBe("locked");
    });
  });
});
