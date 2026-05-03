/**
 * Sidebar.tsx
 *
 * Left panel containing:
 *   - App title ("Tech Tree") + department subtitle
 *   - Inline-editable student name (click → input, Enter/blur to save)
 *   - Program dropdown (when plan is loaded and program is selected)
 *   - Load Curriculum / Import from Spreadsheet / Load Progress import buttons
 *   - Export Progress button
 *   - Progress summary stats
 *   - Legend panel
 *
 * All colors via useTheme(). No hardcoded hex.
 */

import { useState, useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useTheme } from "@themes/themeContext";
import { ImportButton } from "@components/controls/ImportButton";
import { ExportButton } from "@components/controls/ExportButton";
import { LegendPanel } from "@components/controls/LegendPanel";
import { ProgramDropdown } from "@components/panels/ProgramSelector";
import type { PlanFile, StudentData } from "@types";

interface SidebarProps {
  planFile: PlanFile | null;
  student: StudentData;
  onLoadPlan: (file: File) => void;
  onLoadStudent: (file: File) => void;
  onExport: () => void;
  onStudentNameChange: (name: string) => void;
  onProgramSelect: (programId: string) => void;
  /** Opens the CSV-to-PlanFile import modal */
  onOpenCsvImport: () => void;
}

export function Sidebar({
  planFile,
  student,
  onLoadPlan,
  onLoadStudent,
  onExport,
  onStudentNameChange,
  onProgramSelect,
  onOpenCsvImport,
}: SidebarProps) {
  const theme = useTheme();

  // ── Student name inline edit ──────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(student.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    setNameInput(student.name);
    setIsEditingName(true);
    // Focus after render
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [student.name]);

  const commitName = useCallback(() => {
    const trimmed = nameInput.trim();
    const final = trimmed.length > 0 ? trimmed : "Student";
    onStudentNameChange(final);
    setIsEditingName(false);
  }, [nameInput, onStudentNameChange]);

  const handleNameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitName();
      if (e.key === "Escape") {
        setNameInput(student.name);
        setIsEditingName(false);
      }
    },
    [commitName, student.name]
  );

  // ── Progress stats (derived) ──────────────────────────────────────────────
  const completedCount = student.completedCourses.length;
  const inProgressCount = student.inProgressCourses.length;
  const totalCourses = planFile?.courses.length ?? 0;

  const progressPercent =
    totalCourses > 0
      ? Math.round((completedCount / totalCourses) * 100)
      : 0;

  // ── Shared divider ────────────────────────────────────────────────────────
  const Divider = () => (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        background: theme.borderDefault,
        margin: "4px 0",
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme.surface,
        borderRight: `1px solid ${theme.borderDefault}`,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* ── App title ── */}
      <div style={{ flexShrink: 0 }}>
        <h1
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: theme.status.in_progress.text, // cyan accent
            letterSpacing: "0.08em",
            lineHeight: 1,
            marginBottom: 3,
          }}
        >
          TECH TREE
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: theme.textMuted,
            letterSpacing: "0.04em",
          }}
        >
          {planFile
            ? `${planFile.department} · ${planFile.catalogYear}`
            : "Curriculum Planner"}
        </p>
      </div>

      <Divider />

      {/* ── Student name (inline editable) ── */}
      <div style={{ flexShrink: 0 }}>
        <label
          style={{
            display: "block",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 10,
            color: theme.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          Student
        </label>

        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            maxLength={64}
            style={{
              width: "100%",
              background: theme.panel,
              border: `1px solid ${theme.status.in_progress.border}`,
              borderRadius: 5,
              color: theme.textPrimary,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              padding: "5px 9px",
              outline: "none",
              boxShadow: `0 0 6px ${theme.status.in_progress.glow}`,
            }}
            aria-label="Student name"
          />
        ) : (
          <button
            onClick={startEditing}
            aria-label={`Student name: ${student.name}. Click to edit.`}
            title="Click to edit name"
            style={{
              width: "100%",
              background: "transparent",
              border: `1px solid ${theme.borderDefault}`,
              borderRadius: 5,
              color: theme.textPrimary,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              padding: "5px 9px",
              cursor: "text",
              textAlign: "left",
              transition: "border-color 150ms",
              outline: "none",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.borderColor =
                theme.status.in_progress.border)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.borderColor =
                theme.borderDefault)
            }
          >
            {student.name}
          </button>
        )}
      </div>

      {/* ── Program selector (only when plan loaded and program is set) ── */}
      {planFile && student.selectedProgram && (
        <div style={{ flexShrink: 0 }}>
          <label
            style={{
              display: "block",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: theme.textMuted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Program
          </label>
          <ProgramDropdown
            planFile={planFile}
            selectedProgramId={student.selectedProgram}
            onSelect={onProgramSelect}
          />
        </div>
      )}

      {/* ── Progress stats (only when plan is loaded) ── */}
      {planFile && (
        <>
          <Divider />
          <div style={{ flexShrink: 0 }}>
            <label
              style={{
                display: "block",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 10,
                color: theme.textMuted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Progress
            </label>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: theme.borderDefault,
                borderRadius: 2,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background: theme.status.completed.border,
                  borderRadius: 2,
                  transition: "width 400ms ease",
                  boxShadow: `0 0 6px ${theme.status.completed.glow}`,
                }}
              />
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: theme.textMuted,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span>
                <span style={{ color: theme.status.completed.text, fontWeight: 500 }}>
                  {completedCount}
                </span>{" "}
                done
              </span>
              <span>
                <span style={{ color: theme.status.in_progress.text, fontWeight: 500 }}>
                  {inProgressCount}
                </span>{" "}
                active
              </span>
              <span>
                <span style={{ color: theme.textSecondary, fontWeight: 500 }}>
                  {totalCourses}
                </span>{" "}
                total
              </span>
            </div>
          </div>
        </>
      )}

      <Divider />

      {/* ── File controls ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <ImportButton
          label="Load Curriculum"
          onFile={onLoadPlan}
          accept=".json"
        />
        <CsvImportButton onClick={onOpenCsvImport} theme={theme} />
        <ImportButton
          label="Load Progress"
          onFile={onLoadStudent}
          accept=".json"
          disabled={!planFile}
        />
        <ExportButton
          label="Export Progress"
          onClick={onExport}
          disabled={completedCount + inProgressCount === 0}
        />
      </div>

      <Divider />

      {/* ── Legend ── */}
      <div style={{ flexShrink: 0 }}>
        <LegendPanel />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ── Footer ── */}
      <div
        style={{
          fontSize: 10,
          color: theme.textMuted,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.04em",
          paddingTop: 8,
          borderTop: `1px solid ${theme.borderDefault}`,
          flexShrink: 0,
        }}
      >
        v1.0 · catalog {planFile?.catalogYear ?? "—"}
      </div>
    </div>
  );
}

// ── CSV import button ─────────────────────────────────────────────────────────

/**
 * Styled button that opens the CSV import modal.
 * Visually distinct from the JSON ImportButton — uses a spreadsheet icon
 * and the orange accent color to signal a different import pathway.
 */
function CsvImportButton({
  onClick,
  theme,
}: {
  onClick: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 7,
        justifyContent: "flex-start",
        background: "transparent",
        border: `1px solid ${theme.accent.orange}`,
        color: theme.accent.orange,
        borderRadius: 5,
        padding: "7px 11px",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "background 150ms ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(245,158,11,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
      aria-label="Import curriculum from spreadsheet CSV"
    >
      <SpreadsheetIcon />
      Import from Spreadsheet
    </button>
  );
}

function SpreadsheetIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
