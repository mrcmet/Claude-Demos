# Agent A Plan — Core Layer (Types · Engine · Storage · Hooks)

## Your Role
You are Agent A. You own all non-UI TypeScript: the shared type contracts, the prerequisite evaluation engine, the storage layer, and the React hooks that expose everything to Agent B's UI. Agent B cannot write fully typed components until you publish `src/types/index.ts`.

**Your first action: write `src/types/index.ts` and its dependencies.**

## Project Context
Curriculum Tech Tree Planner — a React + TypeScript + Vite web app. Students load a JSON curriculum plan, mark courses completed/in-progress, and see a game-like tech tree showing which courses are available, locked, or done. No backend. Data lives in localStorage and JSON files.

## Files You Own

```
src/types/curriculum.ts
src/types/student.ts
src/types/prereqEngine.ts
src/types/index.ts          ← PUBLISH FIRST
src/engine/prereqEvaluator.ts
src/engine/coreqEvaluator.ts
src/engine/statusResolver.ts
src/engine/graphBuilder.ts
src/engine/engine.test.ts
src/storage/localStorage.ts
src/storage/fileImport.ts
src/storage/fileExport.ts
src/hooks/useStudentData.ts
src/hooks/usePlanFile.ts
src/hooks/useCourseStatuses.ts
src/data/sample-bsme-2026.json
```

## Implementation Order

### STEP 1 — Types (publish immediately, Agent B is blocked on this)

**`src/types/curriculum.ts`**
```typescript
export type PrereqRule =
  | { type: "none" }
  | { type: "all"; courses: string[] }
  | { type: "any"; courses: string[] }
  | { type: "choose"; count: number; courses: string[] };

export type Term = "Fall" | "Spring" | "Summer" | "Winter";

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

export interface ElectiveSet {
  id: string;
  label: string;
  chooseCount: number;
  courses: string[];
}

export interface Program {
  id: string;
  name: string;
  requiredCourses: string[];
  electiveSets?: ElectiveSet[];
}

export interface PlanFile {
  department: string;
  catalogYear: string;
  courses: Course[];
  programs: Program[];
  version: "1.0";
}
```

**`src/types/student.ts`**
```typescript
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
```

**`src/types/prereqEngine.ts`**
```typescript
import type { Course } from "./curriculum";

export type CourseStatus = "completed" | "in_progress" | "available" | "locked";

export interface CourseEvaluation {
  courseId: string;
  status: CourseStatus;
  unmetPrereqs: string[];
  unmetCoreqs: string[];
}

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
```

**`src/types/index.ts`** — re-export all of the above.

---

### STEP 2 — Prerequisite Evaluator

**`src/engine/prereqEvaluator.ts`**

Pure function, no side effects.

```typescript
import type { PrereqRule } from "../types";

export function evaluatePrereqRule(
  rule: PrereqRule,
  completedCourses: Set<string>
): { satisfied: boolean; unmet: string[] }
```

Logic:
- `type: "none"` → always `{ satisfied: true, unmet: [] }`
- `type: "all"` → all `.courses` must be in `completedCourses`. `unmet` = those missing.
- `type: "any"` → at least one `.courses` in `completedCourses`. If none, `unmet` = all courses.
- `type: "choose"` → at least `.count` must be in `completedCourses`. `unmet` = those not in set (if count not met).
- Never throw — treat unknown types as satisfied to be safe.

---

### STEP 3 — Co-requisite Evaluator

**`src/engine/coreqEvaluator.ts`**

```typescript
export function evaluateCoreqs(
  corequisites: string[],
  completedCourses: Set<string>,
  inProgressCourses: Set<string>
): { satisfied: boolean; unmet: string[] }
```

A coreq is satisfied if the coreq courseId is in `completedCourses` OR `inProgressCourses`. Unmet = those in neither.

---

### STEP 4 — Status Resolver

**`src/engine/statusResolver.ts`**

```typescript
import type { Course, StudentData, CourseEvaluation } from "../types";

export function resolveAllStatuses(
  courses: Course[],
  student: StudentData
): CourseEvaluation[]
```

Per-course algorithm:
1. If in `completedCourses` → `status: "completed"`, skip further evaluation.
2. If in `inProgressCourses` → `status: "in_progress"`, skip further evaluation.
3. Evaluate `course.prerequisites` via `evaluatePrereqRule`.
4. Evaluate `course.corequisites` via `evaluateCoreqs`.
5. Both satisfied → `status: "available"`.
6. Either unsatisfied → `status: "locked"`, populate `unmetPrereqs` / `unmetCoreqs`.

Handle missing prerequisite course IDs gracefully (treat as not completed).

---

### STEP 5 — Graph Builder

**`src/engine/graphBuilder.ts`**

```typescript
import type { Course, CourseEvaluation, GraphNode, GraphEdge } from "../types";

export function buildGraphData(
  courses: Course[],
  evaluations: CourseEvaluation[]
): { nodes: GraphNode[]; edges: GraphEdge[] }
```

- One `GraphNode` per course. Position `{ x: 0, y: 0 }` — dagre sets real positions.
- For each `course.prerequisites` rule: extract all course IDs and create a `GraphEdge` (type `"prereqEdge"`) from each prereq course → this course.
- For each `course.corequisites` entry: create `GraphEdge` type `"coreqEdge"`.
- Set `animated: true` only for edges where the target course status is `"available"`.
- Set `data.targetStatus` on each edge so Agent B's PrereqEdge can color it correctly.
- Skip edges where source courseId doesn't exist in the plan (cross-plan refs).

---

### STEP 6 — Storage Layer

**`src/storage/localStorage.ts`**
```typescript
const KEY = "class_tracker_student_v1";
export function loadStudentData(): StudentData | null
export function saveStudentData(data: StudentData): void
export function clearStudentData(): void
```
Validate on load: check `version === "1.0"`, `completedCourses` is array, etc. Return null on failure.

**`src/storage/fileImport.ts`**
```typescript
export async function importPlanFile(file: File): Promise<PlanFile>
export async function importStudentFile(file: File): Promise<StudentData>
```
Parse JSON, validate required fields, throw with human-readable error message on failure. Tolerant of missing optional fields (description, minGrade, etc.).

**`src/storage/fileExport.ts`**
```typescript
export function exportStudentData(data: StudentData): void
```
Set `data.exportedAt = new Date().toISOString()`. Trigger browser download. Filename: `student-{name}-{catalogYear}.json`.

---

### STEP 7 — React Hooks

**`src/hooks/useStudentData.ts`**
```typescript
export function useStudentData(): {
  student: StudentData | null;
  updateStudent: (patch: Partial<StudentData>) => void;
  markCourseCompleted: (courseId: string) => void;
  markCourseInProgress: (courseId: string) => void;
  unmarkCourse: (courseId: string) => void;
  loadFromFile: (file: File) => Promise<void>;
  exportToFile: () => void;
}
```
- Initializes from `loadStudentData()` on mount. If null, initializes a default empty student.
- Every mutation calls `saveStudentData()` immediately after state update.
- `markCourseCompleted`: removes from inProgressCourses, adds to completedCourses.
- `markCourseInProgress`: removes from completedCourses, adds to inProgressCourses.
- `unmarkCourse`: removes from both lists.

**`src/hooks/usePlanFile.ts`**
```typescript
export function usePlanFile(): {
  planFile: PlanFile | null;
  loadPlanFile: (file: File) => Promise<void>;
  error: string | null;
}
```

**`src/hooks/useCourseStatuses.ts`**
```typescript
export function useCourseStatuses(
  planFile: PlanFile | null,
  student: StudentData | null
): CourseEvaluation[]
```
Memoized with `useMemo`. Returns `[]` if either arg is null.

---

### STEP 8 — Unit Tests

**`src/engine/engine.test.ts`** (Vitest)

Required test cases:
- `type: "none"` → always satisfied
- `type: "all"` with all courses completed → satisfied
- `type: "all"` with one missing → locked, unmet = [missing course]
- `type: "any"` with one satisfied → satisfied
- `type: "any"` with none → locked, unmet = all courses
- `type: "choose"` with exactly N satisfied → satisfied
- `type: "choose"` with N-1 satisfied → locked
- Coreq that is completed → satisfied
- Coreq that is in_progress → satisfied (critical: this is what allows same-semester enrollment)
- Coreq that is not started → locked
- Course in completedCourses → always `completed` regardless of prereqs
- Course in inProgressCourses → always `in_progress` regardless of prereqs
- Missing prereq course ID (not in plan) → treated as not completed, no crash

---

### STEP 9 — Sample Data File

**`src/data/sample-bsme-2026.json`**

Create a realistic Mechanical Engineering curriculum with ~20 courses showing:
- Entry-level courses with no prerequisites (MATH101, ENGR101, PHYS101)
- `type: "all"` rules (e.g., MATH201 requires MATH101 AND PHYS101)
- `type: "any"` rules (e.g., a stats course that accepts STAT200 OR STAT210)
- `type: "choose"` rule (e.g., technical elective: choose 1 of 3)
- At least 2 corequisite pairs (e.g., ME301 requires ME302 as coreq)
- A clear multi-level chain: entry → core → intermediate → capstone
- One program: `{ id: "BSME", name: "B.S. Mechanical Engineering", requiredCourses: [...] }`

This file is used for first-load demo and all integration testing.

---

## Do NOT:
- Touch anything in `src/components/` or `src/themes/`
- Import React components
- Build the Vite scaffold (Agent B owns that)
- Write CSS or styling
- Hardcode colors — the engine layer has no colors
