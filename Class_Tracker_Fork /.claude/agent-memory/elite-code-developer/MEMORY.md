# Project Memory — Curriculum Tech Tree Planner

## Project Identity
- **Name**: Curriculum Tech Tree Planner (Class_Tracker)
- **Stack**: React + TypeScript + Vite, React Flow (@xyflow/react), dagre layout, Framer Motion
- **Architecture**: No backend — localStorage + JSON file import/export only
- **Test framework**: Vitest (`vitest`, `@vitest/ui`, `jsdom` environment)
- **Path aliases**: `@types`, `@engine`, `@storage`, `@hooks`, `@components`, `@themes`, `@data`

## Agent Ownership Split
- **Agent A (me)**: `src/types/`, `src/engine/`, `src/storage/`, `src/hooks/`, `src/data/`
- **Agent B**: `src/components/`, `src/themes/`, `index.html`, `vite.config.ts`, `package.json`
- **Critical**: Never touch Agent B's files. Never import React components. No CSS.

## Type Contract (Agent B depends on these)
- `CourseStatus = "completed" | "in_progress" | "available" | "locked"`
- `GraphEdge.data.targetStatus: CourseStatus` — required by PrereqEdge for edge coloring
- `GraphEdge.animated = true` ONLY when target status is `"available"`
- `GraphNode.type` must be `"courseNode"` (literal string for React Flow routing)
- All types re-exported from `src/types/index.ts` — consumers import from barrel only

## Key Design Decisions
- **Set-based lookups**: completedCourses/inProgressCourses are stored as arrays in StudentData but always converted to `Set<string>` inside engine functions for O(1) lookup
- **Co-req semantics**: satisfied if coreq course is EITHER completed OR in-progress (same-semester enrollment is valid)
- **Unknown prereq rule types**: treated as satisfied (graceful degradation, not an error)
- **Cross-plan prereq references**: silently skipped in graphBuilder (no crash)
- **Coreq edge deduplication**: graphBuilder deduplicates bidirectional coreq declarations using lexicographic pair key
- **localStorage key**: `"class_tracker_student_v1"` — versioned to allow future migration

## File Map
- `src/engine/ruleUtils.ts` — `extractCourseIdsFromRule()` used by graphBuilder; kept separate to avoid circular imports
- `src/engine/prereqEvaluator.ts` — pure, `evaluatePrereqRule(rule, Set<string>)`
- `src/engine/coreqEvaluator.ts` — pure, `evaluateCoreqs(ids[], completed Set, inProgress Set)`
- `src/engine/statusResolver.ts` — orchestrates both evaluators, `resolveAllStatuses(courses, student)`
- `src/engine/graphBuilder.ts` — `buildGraphData(courses, evaluations)` → `{ nodes, edges }`
- `src/storage/localStorage.ts` — key `class_tracker_student_v1`, validates on load
- `src/storage/fileImport.ts` — `importPlanFile(File)`, `importStudentFile(File)` — throw human-readable errors
- `src/storage/fileExport.ts` — `exportStudentData(data)` triggers browser download
- `src/storage/csvImport.ts` — `importFromCsv(File, {department, catalogYear})` → `CsvImportResult` (PlanFile + errors + warnings)
- `src/hooks/useStudentData.ts` — hydrates from localStorage on mount, persists every mutation
- `src/hooks/usePlanFile.ts` — plan file NOT persisted; now exposes `setPlanFile(PlanFile)` for CSV import path
- `src/hooks/useCourseStatuses.ts` — `useMemo` wrapper around `resolveAllStatuses`
- `src/data/sample-bsme-2026.json` — 22 courses, BSME program, has "any", "choose", 2 coreq pairs
- `src/components/importer/CsvImportModal.tsx` — 3-step modal (Upload → Metadata → Results); uses `@components/shared/Modal`
- `src/components/importer/templateDownload.ts` — `downloadCsvTemplate()` — pure DOM download, no React

## CSV Importer Notes
- papaparse + @types/papaparse installed as dependencies
- `importFromCsv` uses `Papa.parse` with `header: true, skipEmptyLines: true`; never throws — always returns result object
- Rows with blank `id` or `id` starting with `#` are skipped (not errors)
- `program` column: grouped by value into one Program per unique ID; blank program cells are omitted from all programs
- No program column → single default Program `{ id: "PROGRAM", name: "Degree Program", requiredCourses: [...all] }`
- `useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>` pattern needed when passing ref to sub-component props typed as `RefObject<HTMLInputElement>` (React 18 useState returns `null` in ref, strict mode)
- `CsvImportButton` lives at bottom of Sidebar.tsx with its own `SpreadsheetIcon` SVG; styled with `theme.accent.orange` to visually distinguish from JSON import

## Agent B — UI Layer Notes
- `ReactFlowProvider` wraps `AppInner` in App.tsx — NOT inside TechTreeGraph
- `nodeTypes`/`edgeTypes` must be defined OUTSIDE component for referential stability (React Flow requirement)
- `CourseNode` wrapped in `React.memo` — critical for perf with 20+ nodes
- Hover effects CSS-only in `src/index.css` `.course-node:hover` — no React state for hover
- CSS custom properties `--node-glow` / `--node-glow-soft` set inline so CSS hover rule picks up correct glow per status
- Import `@xyflow/react/dist/base.css` (NOT full stylesheet) — we override all visuals
- All colors from `src/themes/colors.ts` — `getStatusTokens(status)` helper available
- `React.ReactNode` → always import as `import type { ReactNode } from "react"` (not `React.ReactNode`)
- `@types` alias → `src/types/index.ts` barrel; use `import type { ... } from "@types"` in components
- `buildGraphData` imported only in `TechTreeGraph.tsx` — no other component should touch engine layer
- App.tsx now uses real Agent A hooks (usePlanFile, useStudentData, useCourseStatuses) — no mock state

## docs/ Directory Contents
- `docs/course-catalog-template.csv` — 3 comment rows + header + 14 CS example rows covering all prereq_type scenarios
- `docs/spreadsheet-setup-guide.md` — 6-section Google Sheets setup guide (column ref, dropdowns, prereq cheat sheet, export steps, tips)
- `docs/export-to-json.gs` — Google Apps Script: `onOpen()` menu, full PlanFile JSON output, Drive-based download dialog
- `docs/plan-file-template.json` — Annotated JSON template for manual authoring
- `docs/import-research.md` — Compares 5 import approaches (GAS, PapaParse, Node CLI, Claude API, published CSV)

## CSV Column Order (matches GS COL_ constants, 0-based)
A=id, B=name, C=credits, D=prereq_type, E=prereq_courses, F=prereq_count, G=corequisites, H=min_grade, I=terms, J=description, K=program

## Apps Script Key Design Notes
- Download: creates file in DriveApp, shows modal HTML dialog with download link (GAS cannot push browser downloads directly)
- Programs built from `program` column grouping; blank → "DEFAULT" program ID
- `choose` prereq_count: defaults to 1 with Logger.log warning if blank/invalid (does not abort row)
- Terms: invalid values silently dropped; empty result falls back to ["Fall","Spring"]
- First run requires OAuth authorization for DriveApp.createFile() scope

## Sample Data Summary
22 courses: MATH101/201/301/302, PHYS101/201, CHEM101, ENGR101, STAT300 (any rule), ME201-ME220, ME301-ME320, ME401, ME490, ME450/ME451 (coreq pair), ME461 (choose rule)
- Entry: MATH101, PHYS101 (coreq MATH101), ENGR101, CHEM101
- Coreq pairs: (PHYS101↔MATH101), (PHYS201↔MATH201), (ME450↔ME451)
- Any rule: STAT300 accepts MATH201 OR MATH301
- Choose rule: ME461 requires 1-of-3 from [ME310, ME401, ME320]
