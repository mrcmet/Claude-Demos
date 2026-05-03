# Agent B Plan — UI Layer (Scaffold · Components · Graph · App)

## Your Role
You are Agent B. You own everything the user sees: the Vite scaffold, all React components, the game-like visual design, and the final `App.tsx` wiring. Agent A publishes `src/types/index.ts` first — use those types in your components. Build with mock data initially, swap to Agent A's real hooks at integration time.

## Project Context
Curriculum Tech Tree Planner — looks and feels like a **sci-fi strategy game** (think Stellaris/Cyberpunk dark UI), not academic software. React Flow renders the course dependency graph. Framer Motion handles entrance animations. All colors come from the design system defined below — never hardcode hex values in components.

## Design System

### Color Palette — create as `src/themes/colors.ts`
```typescript
export const colors = {
  background: "#0a0e1a",   // deep space
  surface: "#111827",       // dark navy
  panel: "#1a2235",         // card/panel bg
  borderDefault: "#1e2d45",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textMuted: "#475569",

  status: {
    completed:   { bg: "#0d2b1e", border: "#00ff88", glow: "rgba(0,255,136,0.4)",   text: "#00ff88" },
    in_progress: { bg: "#0d1a2d", border: "#00d4ff", glow: "rgba(0,212,255,0.4)",   text: "#00d4ff" },
    available:   { bg: "#0f1a2e", border: "#3b82f6", glow: "rgba(59,130,246,0.3)",  text: "#60a5fa" },
    locked:      { bg: "#1a1a24", border: "#374151", glow: "transparent",            text: "#6b7280" },
  },
} as const;

export type StatusKey = keyof typeof colors.status;
```

### Typography — add to `index.html` as Google Fonts link
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

- `'Rajdhani'` — course names, headings, sidebar title (geometric, game-like)
- `'Inter'` — body text, labels, descriptions (clean, readable)
- `'JetBrains Mono'` — course IDs, codes, version numbers (monospace, techy)

### Node Visual Spec
```
Size:          180px × 90px
Border-radius: 8px
Border:        2px solid [status.border]
Background:    [status.bg]
Box-shadow:    0 0 14px [status.glow], 0 0 28px [status.glow at 50% opacity]
Opacity:       1.0 (0.65 for locked)

Layout inside node:
  Top-left:      Course ID     — JetBrains Mono, 11px, [status.text]
  Center:        Course name   — Rajdhani 700, 14px, #e2e8f0
  Bottom-right:  Credits pill  — "3 cr", 10px, bg #1e2d45, text #94a3b8
  Bottom-left:   Term offered  — first term, 9px, #475569
  Locked only:   Lock SVG icon — centered, 20px, #6b7280

Hover (CSS only, no React state):
  transform: scale(1.04)
  box-shadow enhanced (glow intensity ×1.8)
  transition: 150ms ease-out
  cursor: pointer

React Flow Handles:
  top (target) and bottom (source)
  style={{ opacity: 0 }} — invisible but functional for edge routing
```

### Edge Visual Spec
```
Prereq edges (solid):
  - strokeWidth: 2
  - color: colors.status[targetStatus].border
  - Glow layer beneath: strokeWidth 6, blur filter, same color at 25% opacity
  - animated: true → CSS stroke-dashoffset flow animation, 2s linear infinite

Coreq edges (dashed):
  - strokeDasharray: "6 3"
  - strokeWidth: 1.5
  - color: #00d4ff at 60% opacity
  - small "co-req" label pill at midpoint

Locked target edges:
  - color: #374151
  - no glow
  - strokeWidth: 1
```

### Animation Specs
```css
/* In-progress pulse (applied to in_progress nodes) */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 14px rgba(0,212,255,0.4), 0 0 28px rgba(0,212,255,0.2); }
  50%       { box-shadow: 0 0 20px rgba(0,212,255,0.7), 0 0 40px rgba(0,212,255,0.35); }
}
animation: pulse-glow 2s ease-in-out infinite;

/* Edge flow (applied to animated edges) */
@keyframes dash-flow {
  to { stroke-dashoffset: -20; }
}
stroke-dasharray: 5 5;
animation: dash-flow 1.5s linear infinite;
```

Framer Motion entrance for CourseNode:
```typescript
initial={{ scale: 0.85, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: "spring", stiffness: 400, damping: 25 }}
```

---

## Files You Own

```
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
package.json
src/main.tsx
src/index.css
src/App.tsx
src/themes/colors.ts
src/themes/themeContext.tsx
src/components/graph/TechTreeGraph.tsx
src/components/graph/CourseNode.tsx
src/components/graph/PrereqEdge.tsx
src/components/graph/graphLayout.ts
src/components/panels/CourseDetailPanel.tsx
src/components/panels/ProgramSelector.tsx
src/components/panels/StudentEditor.tsx
src/components/layout/AppShell.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Header.tsx
src/components/controls/ImportButton.tsx
src/components/controls/ExportButton.tsx
src/components/controls/LegendPanel.tsx
src/components/shared/StatusBadge.tsx
src/components/shared/Modal.tsx
```

---

## Implementation Order

### STEP 1 — Vite Scaffold

```bash
npm create vite@latest . -- --template react-ts
npm install @xyflow/react @dagrejs/dagre framer-motion
npm install -D vitest @vitest/ui @testing-library/react jsdom
```

**`vite.config.ts`**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@types": path.resolve(__dirname, "src/types"),
      "@engine": path.resolve(__dirname, "src/engine"),
      "@storage": path.resolve(__dirname, "src/storage"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@components": path.resolve(__dirname, "src/components"),
      "@themes": path.resolve(__dirname, "src/themes"),
      "@data": path.resolve(__dirname, "src/data"),
    },
  },
  test: {
    environment: "jsdom",
  },
});
```

**`src/index.css`**
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body {
  background: #0a0e1a;
  color: #e2e8f0;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* React Flow base styles — structural only, NO default visuals */
@import '@xyflow/react/dist/base.css';

/* Override React Flow canvas background */
.react-flow {
  background: #0a0e1a;
}

/* Dark theme React Flow controls */
.react-flow__controls {
  background: #111827;
  border: 1px solid #1e2d45;
  border-radius: 6px;
  overflow: hidden;
}
.react-flow__controls-button {
  background: transparent;
  border-bottom-color: #1e2d45;
  color: #94a3b8;
  fill: #94a3b8;
}
.react-flow__controls-button:hover {
  background: #1a2235;
  color: #e2e8f0;
  fill: #e2e8f0;
}
```

---

### STEP 2 — Theme Files

**`src/themes/colors.ts`** — Full color constant object shown in Design System above.

**`src/themes/themeContext.tsx`**
```typescript
import { createContext, useContext } from "react";
import { colors } from "./colors";

const ThemeContext = createContext(colors);
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>
);
export const useTheme = () => useContext(ThemeContext);
```

---

### STEP 3 — Dagre Layout Helper

**`src/components/graph/graphLayout.ts`**

```typescript
import Dagre from "@dagrejs/dagre";
import type { GraphNode, GraphEdge } from "@types";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 90;

export function applyDagreLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: "TB" | "LR" = "TB"
): GraphNode[] {
  const g = new Dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, ranksep: 100, nodesep: 60, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  Dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}
```

---

### STEP 4 — CourseNode (game-like custom node)

**`src/components/graph/CourseNode.tsx`**

```typescript
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { useTheme } from "@themes/themeContext";
import type { CourseStatus } from "@types";
import type { Course, CourseEvaluation } from "@types";

interface CourseNodeData {
  course: Course;
  status: CourseStatus;
  evaluation: CourseEvaluation;
}

function CourseNode({ data }: { data: CourseNodeData }) {
  const theme = useTheme();
  const s = theme.status[data.status];
  const isLocked = data.status === "locked";
  const isInProgress = data.status === "in_progress";

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`course-node ${data.status} ${isInProgress ? "pulsing" : ""}`}
        style={{
          width: 180,
          height: 90,
          background: s.bg,
          border: `2px solid ${s.border}`,
          borderRadius: 8,
          boxShadow: `0 0 14px ${s.glow}, 0 0 28px ${s.glow.replace("0.4", "0.2").replace("0.3", "0.15")}`,
          opacity: isLocked ? 0.65 : 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 10px",
          position: "relative",
          cursor: "pointer",
          transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
        }}
      >
        {/* Course ID — top left */}
        <span style={{
          position: "absolute", top: 7, left: 9,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, color: s.text, letterSpacing: "0.05em",
        }}>
          {data.course.id}
        </span>

        {/* Course Name — center */}
        {isLocked ? (
          <LockIcon />
        ) : (
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700, fontSize: 14,
            color: "#e2e8f0", textAlign: "center",
            lineHeight: 1.2, maxWidth: 160,
          }}>
            {data.course.name}
          </span>
        )}

        {/* Credits — bottom right */}
        <span style={{
          position: "absolute", bottom: 6, right: 8,
          fontFamily: "'Inter', sans-serif",
          fontSize: 9, color: "#94a3b8",
          background: "#1e2d45",
          padding: "1px 5px", borderRadius: 3,
        }}>
          {data.course.credits} cr
        </span>

        {/* Term — bottom left */}
        <span style={{
          position: "absolute", bottom: 7, left: 9,
          fontFamily: "'Inter', sans-serif",
          fontSize: 9, color: "#475569",
        }}>
          {data.course.termsOffered[0] ?? ""}
        </span>
      </motion.div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default memo(CourseNode);
```

Add to `src/index.css`:
```css
.course-node:hover {
  transform: scale(1.04);
  box-shadow: 0 0 22px var(--node-glow), 0 0 44px var(--node-glow-soft) !important;
}

.course-node.pulsing {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 14px rgba(0,212,255,0.4), 0 0 28px rgba(0,212,255,0.2); }
  50%       { box-shadow: 0 0 22px rgba(0,212,255,0.7), 0 0 44px rgba(0,212,255,0.35); }
}
```

---

### STEP 5 — PrereqEdge (custom edge with glow)

**`src/components/graph/PrereqEdge.tsx`**

```typescript
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { colors } from "@themes/colors";
import type { CourseStatus } from "@types";

interface PrereqEdgeData {
  targetStatus: CourseStatus;
  edgeType: "prereqEdge" | "coreqEdge";
}

export function PrereqEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  animated, data,
}: EdgeProps<PrereqEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const targetStatus = data?.targetStatus ?? "locked";
  const edgeType = data?.edgeType ?? "prereqEdge";
  const color = colors.status[targetStatus].border;
  const isLocked = targetStatus === "locked";
  const isCoreq = edgeType === "coreqEdge";
  const glowColor = isLocked ? "transparent" : colors.status[targetStatus].glow;

  return (
    <>
      <defs>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow layer */}
      {!isLocked && (
        <path
          d={edgePath}
          stroke={glowColor}
          strokeWidth={6}
          fill="none"
          filter={`url(#glow-${id})`}
        />
      )}

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isLocked ? "#374151" : color,
          strokeWidth: isLocked ? 1 : 2,
          strokeDasharray: isCoreq ? "6 3" : animated ? "5 5" : "none",
          animation: animated ? "dash-flow 1.5s linear infinite" : undefined,
        }}
      />

      {/* Co-req label */}
      {isCoreq && (
        <EdgeLabelRenderer>
          <div style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 9,
            fontFamily: "'Inter', sans-serif",
            color: "#00d4ff",
            background: "rgba(13,26,45,0.9)",
            padding: "2px 5px",
            borderRadius: 3,
            border: "1px solid rgba(0,212,255,0.3)",
            pointerEvents: "none",
          }}>
            co-req
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

Add to `src/index.css`:
```css
@keyframes dash-flow {
  to { stroke-dashoffset: -20; }
}
```

---

### STEP 6 — TechTreeGraph (main canvas)

**`src/components/graph/TechTreeGraph.tsx`**

```typescript
import { useEffect, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, useReactFlow } from "@xyflow/react";
import { CourseNode } from "./CourseNode";
import { PrereqEdge } from "./PrereqEdge";
import { applyDagreLayout } from "./graphLayout";
import { buildGraphData } from "@engine/graphBuilder";
import { colors } from "@themes/colors";
import type { PlanFile, CourseEvaluation } from "@types";

const nodeTypes = { courseNode: CourseNode };
const edgeTypes = { prereqEdge: PrereqEdge, coreqEdge: PrereqEdge };

interface TechTreeGraphProps {
  planFile: PlanFile;
  evaluations: CourseEvaluation[];
  onCourseClick: (courseId: string) => void;
}

export function TechTreeGraph({ planFile, evaluations, onCourseClick }: TechTreeGraphProps) {
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const raw = buildGraphData(planFile.courses, evaluations);
    const layoutedNodes = applyDagreLayout(raw.nodes, raw.edges, "TB");
    return { nodes: layoutedNodes, edges: raw.edges };
  }, [planFile.courses, evaluations]);

  useEffect(() => {
    // Fit view after layout computed
    const timeout = setTimeout(() => fitView({ padding: 0.15, duration: 600 }), 50);
    return () => clearTimeout(timeout);
  }, [planFile, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      colorMode="dark"
      deleteKeyCode={null}
      onNodeClick={(_, node) => onCourseClick(node.id)}
      fitView
    >
      <Background variant="dots" color="#1e2d45" gap={32} size={1.5} />
      <Controls />
      <MiniMap
        nodeColor={(n) => colors.status[(n.data as any).status]?.border ?? "#374151"}
        nodeStrokeColor="#0a0e1a"
        style={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 6 }}
      />
    </ReactFlow>
  );
}
```

**IMPORTANT:** This component must be rendered inside a `<ReactFlowProvider>` (add that in `App.tsx`).

---

### STEP 7 — CourseDetailPanel (slide-in from right)

**`src/components/panels/CourseDetailPanel.tsx`**

```typescript
interface CourseDetailPanelProps {
  course: Course | null;
  evaluation: CourseEvaluation | null;
  student: StudentData;
  onMarkCompleted: (id: string) => void;
  onMarkInProgress: (id: string) => void;
  onUnmark: (id: string) => void;
  onClose: () => void;
}
```

Visual: `position: fixed`, `right: 0`, `top: 0`, `height: 100%`, `width: 320px`, `background: #111827`, `border-left: 1px solid #1e2d45`, `z-index: 100`.

Animation: CSS `transform: translateX(100%)` → `translateX(0)`, 250ms ease-out, triggered by `course !== null`.

Content layout:
1. **Header** — row with Course ID (JetBrains Mono, status color), close button (×, top-right)
2. **Course name** — Rajdhani 700, 18px, #e2e8f0
3. **StatusBadge** — current status pill
4. **Meta row** — credits + terms offered, small gray text
5. **Prerequisites section** — heading "Prerequisites", then for each prereq course: course ID + green ✓ or red ✗ based on completedCourses. Show rule type label: "Must complete all:" / "Must complete one of:" / "Complete N of:"
6. **Co-requisites section** — same pattern, but cyan ○ if in_progress (since that satisfies it)
7. **Description** — if course.description exists, italic gray text
8. **Action buttons** row at bottom:
   - "Mark Completed" — disabled if locked, primary green styling
   - "Mark In Progress" — disabled if completed, primary cyan styling
   - "Remove" — only shown if completed or in_progress, secondary styling

Button styling (dark game look):
```css
background: transparent;
border: 1px solid [status color];
color: [status color];
padding: 8px 14px;
border-radius: 5px;
font-family: 'Rajdhani', sans-serif;
font-weight: 700;
letter-spacing: 0.05em;
cursor: pointer;
transition: background 150ms;
```
On hover: `background: [status color at 15% opacity]`.

---

### STEP 8 — ProgramSelector

**`src/components/panels/ProgramSelector.tsx`**

Two modes:
1. **Full-screen overlay** — when no program selected yet. Dark overlay, centered card grid. Heading: "Select Your Program" in Rajdhani. Each program card: program name, course count, hover glow border. Clicking a card calls `onSelect(program.id)`.
2. **Compact dropdown** — rendered in Sidebar when a program is already selected. Shows current program name with a down-chevron. Click to open a simple dropdown with all programs listed.

---

### STEP 9 — Layout Components

**`src/components/layout/AppShell.tsx`**
```typescript
interface AppShellProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
}
```
Full-height flex row. Sidebar: `width: 260px, flexShrink: 0`. Main: `flex: 1, overflow: hidden`.

**`src/components/layout/Sidebar.tsx`**
```
Background: #111827
Border-right: 1px solid #1e2d45
Padding: 16px

Contents (top to bottom):
  - App title: "Tech Tree" (Rajdhani 700, 22px, #00d4ff)
  - Subtitle: department name if plan loaded, gray
  - Divider
  - Student name (editable inline: click → input field, Enter to save)
  - Program selector dropdown (if plan loaded)
  - Divider
  - "Load Curriculum" ImportButton
  - "Load Progress" ImportButton
  - "Export Progress" ExportButton (disabled if no student data)
  - Divider
  - LegendPanel
```

**`src/components/layout/Header.tsx`** — Minimal top bar if needed (can be omitted if Sidebar is sufficient).

---

### STEP 10 — Controls and Shared Components

**`src/components/controls/ImportButton.tsx`**
```typescript
interface ImportButtonProps {
  label: string;
  onFile: (file: File) => void;
  accept?: string; // default ".json"
}
```
Hidden `<input type="file">` + styled button. Click button → trigger input. Return selected file via `onFile`.

**`src/components/controls/ExportButton.tsx`**
```typescript
interface ExportButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
```

**`src/components/controls/LegendPanel.tsx`**

Four rows, each: colored dot (`12px circle, bg = status.border`) + label text. Labels: "Completed", "In Progress", "Available", "Locked". Compact, subtle.

**`src/components/shared/StatusBadge.tsx`**
```typescript
interface StatusBadgeProps {
  status: CourseStatus;
  size?: "sm" | "md"; // default "md"
}
```
Pill with `background: status.bg`, `border: 1px solid status.border`, `color: status.text`. Text = status string with underscores replaced by spaces.

**`src/components/shared/Modal.tsx`**
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}
```
Fixed-position backdrop (`rgba(0,0,0,0.7)`), centered card. Click backdrop → close. Used for StudentEditor.

---

### STEP 11 — App.tsx (Integration)

```typescript
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ThemeProvider } from "@themes/themeContext";
import { AppShell } from "@components/layout/AppShell";
import { Sidebar } from "@components/layout/Sidebar";
import { TechTreeGraph } from "@components/graph/TechTreeGraph";
import { CourseDetailPanel } from "@components/panels/CourseDetailPanel";
import { ProgramSelector } from "@components/panels/ProgramSelector";

// --- MOCK DATA (delete when Agent A's hooks are available) ---
import type { StudentData, PlanFile } from "@types";
const defaultStudent: StudentData = {
  name: "Student",
  selectedProgram: null,
  catalogYear: "2026",
  completedCourses: [],
  inProgressCourses: [],
  version: "1.0",
};
// --- END MOCK ---

export default function App() {
  // Replace with Agent A's real hooks:
  // const { planFile, loadPlanFile } = usePlanFile();
  // const { student, markCourseCompleted, markCourseInProgress, unmarkCourse, ... } = useStudentData();
  // const evaluations = useCourseStatuses(planFile, student);
  const [planFile, setPlanFile] = useState<PlanFile | null>(null);
  const [student, setStudent] = useState<StudentData>(defaultStudent);
  const evaluations = []; // will come from useCourseStatuses

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const selectedCourse = planFile?.courses.find(c => c.id === selectedCourseId) ?? null;
  const selectedEval = evaluations.find((e: any) => e.courseId === selectedCourseId) ?? null;

  return (
    <ThemeProvider>
      <ReactFlowProvider>
        <AppShell
          sidebar={
            <Sidebar
              planFile={planFile}
              student={student}
              onLoadPlan={(file) => { /* call usePlanFile's loadPlanFile */ }}
              onLoadStudent={(file) => { /* call useStudentData's loadFromFile */ }}
              onExport={() => { /* call useStudentData's exportToFile */ }}
              onStudentNameChange={(name) => setStudent(s => ({ ...s, name }))}
              onProgramSelect={(id) => setStudent(s => ({ ...s, selectedProgram: id }))}
            />
          }
          main={
            !planFile ? (
              <EmptyState onLoad={(file) => { /* loadPlanFile */ }} />
            ) : !student.selectedProgram ? (
              <ProgramSelector
                planFile={planFile}
                onSelect={(id) => setStudent(s => ({ ...s, selectedProgram: id }))}
              />
            ) : (
              <TechTreeGraph
                planFile={planFile}
                evaluations={evaluations}
                onCourseClick={setSelectedCourseId}
              />
            )
          }
        />
        <CourseDetailPanel
          course={selectedCourse}
          evaluation={selectedEval}
          student={student}
          onMarkCompleted={(id) => { /* markCourseCompleted(id) */ }}
          onMarkInProgress={(id) => { /* markCourseInProgress(id) */ }}
          onUnmark={(id) => { /* unmarkCourse(id) */ }}
          onClose={() => setSelectedCourseId(null)}
        />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

function EmptyState({ onLoad }: { onLoad: (file: File) => void }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, color: "#475569",
    }}>
      <span style={{ fontFamily: "'Rajdhani'", fontSize: 24, color: "#94a3b8" }}>
        Load a curriculum plan to begin
      </span>
      <ImportButton label="Load Curriculum" onFile={onLoad} />
    </div>
  );
}
```

---

## Integration Checklist (when Agent A's hooks are ready)

- [ ] Replace mock `planFile` state with `usePlanFile()` hook
- [ ] Replace mock `student` state with `useStudentData()` hook
- [ ] Replace `evaluations = []` with `useCourseStatuses(planFile, student)`
- [ ] Wire all stub comments to real hook functions
- [ ] Delete `src/mocks/` directory
- [ ] Test with `src/data/sample-bsme-2026.json`

---

## Do NOT:
- Write prerequisite evaluation logic (Agent A owns `src/engine/`)
- Call localStorage directly (use Agent A's hooks from `src/hooks/`)
- Import from `src/engine/` in components — only import from `src/hooks/`
- Import `buildGraphData` directly in components — only `TechTreeGraph.tsx` should use it
- Hardcode hex color values — always import from `src/themes/colors.ts`
