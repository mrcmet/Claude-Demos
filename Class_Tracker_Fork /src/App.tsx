/**
 * App.tsx
 *
 * Root application component. Wires all pieces together:
 *   - ThemeProvider  (design system colors)
 *   - ReactFlowProvider (must wrap TechTreeGraph)
 *   - AppShell (layout: sidebar + main)
 *   - TechTreeGraph (main canvas)
 *   - CourseDetailPanel (slide-in right panel)
 *   - ProgramSelector overlay (when no program is selected)
 *
 * Uses Agent A's real hooks — no mock state.
 */

import { useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ThemeProvider, useTheme } from "@themes/themeContext";
import { AppShell } from "@components/layout/AppShell";
import { Sidebar } from "@components/layout/Sidebar";
import { TechTreeGraph } from "@components/graph/TechTreeGraph";
import { CourseDetailPanel } from "@components/panels/CourseDetailPanel";
import { ProgramSelector } from "@components/panels/ProgramSelector";
import { ImportButton } from "@components/controls/ImportButton";
import { CsvImportModal } from "@components/importer/CsvImportModal";
import { GradeEntryModal } from "@components/shared/GradeEntryModal";
import { GpaBar } from "@components/layout/GpaBar";
import { usePlanFile } from "@hooks/usePlanFile";
import { useStudentData } from "@hooks/useStudentData";
import { useCourseStatuses } from "@hooks/useCourseStatuses";
import type { Course, PlanFile } from "@types";

export default function App() {
  return (
    <ThemeProvider>
      {/* ReactFlowProvider MUST wrap TechTreeGraph — never put it inside the component */}
      <ReactFlowProvider>
        <AppInner />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

function AppInner() {
  // ── Agent A hooks ──────────────────────────────────────────────────────────

  const { planFile, loadPlanFile, setPlanFile, error: planError } = usePlanFile();

  const {
    student,
    updateStudent,
    markCourseCompleted,
    markCourseInProgress,
    unmarkCourse,
    loadFromFile,
    exportToFile,
  } = useStudentData();

  // Memoized evaluation of every course status — recomputes when plan or
  // student progress changes; returns [] while either is null.
  const evaluations = useCourseStatuses(planFile, student);

  // ── Local UI state ────────────────────────────────────────────────────────

  /** The course ID currently displayed in the detail panel (null = panel closed) */
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  /** Controls visibility of the CSV import modal */
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  /** Course ID waiting for grade entry before being marked completed */
  const [pendingCompleteId, setPendingCompleteId] = useState<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedCourse =
    planFile?.courses.find((c) => c.id === selectedCourseId) ?? null;

  const selectedEval =
    evaluations.find((e) => e.courseId === selectedCourseId) ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLoadPlan = useCallback(
    async (file: File) => {
      await loadPlanFile(file);
      // Reset program selection when a new plan is loaded
      updateStudent({ selectedProgram: null });
      setSelectedCourseId(null);
    },
    [loadPlanFile, updateStudent]
  );

  /** Called by CsvImportModal when the user confirms the import */
  const handleCsvImport = useCallback(
    (imported: PlanFile) => {
      setPlanFile(imported);
      updateStudent({ selectedProgram: null });
      setSelectedCourseId(null);
      setCsvModalOpen(false);
    },
    [setPlanFile, updateStudent]
  );

  const handleLoadStudent = useCallback(
    async (file: File) => {
      try {
        await loadFromFile(file);
      } catch (err) {
        // loadFromFile surfaces human-readable errors; log and let the UI
        // recover gracefully (the existing student data is preserved).
        console.error("Failed to load student file:", err);
      }
    },
    [loadFromFile]
  );

  const handleStudentNameChange = useCallback(
    (name: string) => updateStudent({ name }),
    [updateStudent]
  );

  const handleProgramSelect = useCallback(
    (programId: string) => {
      updateStudent({ selectedProgram: programId });
      setSelectedCourseId(null);
    },
    [updateStudent]
  );

  const handleCourseClick = useCallback((courseId: string) => {
    // Toggle panel: clicking the same node again closes the panel
    setSelectedCourseId((prev) => (prev === courseId ? null : courseId));
  }, []);

  const handlePanelClose = useCallback(() => setSelectedCourseId(null), []);

  const handleRequestComplete = useCallback((courseId: string) => {
    setPendingCompleteId(courseId);
  }, []);

  const handleGradeConfirm = useCallback((courseId: string, grade: string) => {
    markCourseCompleted(courseId, grade);
    setPendingCompleteId(null);
  }, [markCourseCompleted]);

  const handleGradeCancel = useCallback(() => {
    setPendingCompleteId(null);
  }, []);

  const pendingCourse = pendingCompleteId
    ? (planFile?.courses.find((c) => c.id === pendingCompleteId) ?? null)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            planFile={planFile}
            student={student}
            onLoadPlan={handleLoadPlan}
            onLoadStudent={handleLoadStudent}
            onExport={exportToFile}
            onStudentNameChange={handleStudentNameChange}
            onProgramSelect={handleProgramSelect}
            onOpenCsvImport={() => setCsvModalOpen(true)}
          />
        }
        main={
          <MainArea
            planFile={planFile}
            studentProgram={student.selectedProgram}
            evaluations={evaluations}
            planError={planError}
            gpaData={student.gpaData}
            courses={planFile?.courses ?? []}
            onLoadPlan={handleLoadPlan}
            onCourseClick={handleCourseClick}
            onProgramSelect={handleProgramSelect}
          />
        }
      />

      {/* Slide-in detail panel — positioned fixed, lives outside AppShell */}
      <CourseDetailPanel
        course={selectedCourse}
        evaluation={selectedEval}
        student={student}
        onRequestComplete={handleRequestComplete}
        onMarkInProgress={markCourseInProgress}
        onUnmark={unmarkCourse}
        onClose={handlePanelClose}
      />

      {/* CSV import modal — portal-rendered, outside AppShell layout */}
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImport={handleCsvImport}
      />

      <GradeEntryModal
        open={pendingCompleteId !== null}
        course={pendingCourse}
        onConfirm={handleGradeConfirm}
        onCancel={handleGradeCancel}
      />
    </>
  );
}

// ── MainArea — state-machine for the main canvas ─────────────────────────────

interface MainAreaProps {
  planFile: ReturnType<typeof usePlanFile>["planFile"];
  studentProgram: string | null;
  evaluations: ReturnType<typeof useCourseStatuses>;
  planError: string | null;
  gpaData: Record<string, string> | undefined;
  courses: Course[];
  onLoadPlan: (file: File) => void;
  onCourseClick: (courseId: string) => void;
  onProgramSelect: (programId: string) => void;
}

function MainArea({
  planFile,
  studentProgram,
  evaluations,
  planError,
  gpaData,
  courses,
  onLoadPlan,
  onCourseClick,
  onProgramSelect,
}: MainAreaProps) {
  // State 1: No plan file loaded
  if (!planFile) {
    return <EmptyState onLoad={onLoadPlan} error={planError} />;
  }

  // State 2: Plan loaded, program not yet selected → full-screen selector overlay
  if (!studentProgram) {
    return (
      <div style={{ position: "relative", flex: 1, height: "100%", width: "100%" }}>
        <ProgramSelector planFile={planFile} onSelect={onProgramSelect} />
      </div>
    );
  }

  // State 3: Plan + program selected → render the tech tree graph with GPA bar
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", overflow: "hidden" }}>
      <TechTreeGraph planFile={planFile} evaluations={evaluations} onCourseClick={onCourseClick} />
      <GpaBar gpaData={gpaData} courses={courses} />
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({
  onLoad,
  error,
}: {
  onLoad: (file: File) => void;
  error: string | null;
}) {
  const theme = useTheme();

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 40,
        background: theme.background,
      }}
    >
      {/* Abstract grid decoration */}
      <div
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 20px)",
          gridTemplateRows: "repeat(3, 20px)",
          gap: 5,
          marginBottom: 8,
          opacity: 0.25,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: i === 5 || i === 6
                ? theme.status.available.border
                : theme.borderDefault,
              borderRadius: 2,
            }}
          />
        ))}
      </div>

      <h2
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: theme.textSecondary,
          textAlign: "center",
          letterSpacing: "0.04em",
          lineHeight: 1.2,
        }}
      >
        Load a curriculum plan to begin
      </h2>

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: theme.textMuted,
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.65,
        }}
      >
        Import a JSON curriculum plan file to visualize the course dependency
        graph and track your academic progress.
      </p>

      <div style={{ width: 200 }}>
        <ImportButton label="Load Curriculum" onFile={onLoad} />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            marginTop: 4,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 6,
            padding: "10px 16px",
            fontSize: 12,
            color: "#fca5a5",
            maxWidth: 360,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
