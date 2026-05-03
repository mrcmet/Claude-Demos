/**
 * CourseDetailPanel.tsx
 *
 * Slide-in panel from the right edge that shows full details for a selected
 * course: status, prerequisites tree, co-requisites, credits, terms, and
 * action buttons to mutate the student's progress.
 *
 * Animation: CSS transform translateX(0) / translateX(100%), 250ms ease-out.
 * No Framer Motion needed here — simple CSS transition is sufficient.
 *
 * All colors from theme — no hardcoded hex values.
 */

import { useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "@themes/themeContext";
import { StatusBadge } from "@components/shared/StatusBadge";
import type { Course, CourseEvaluation, StudentData, CourseStatus } from "@types";

interface CourseDetailPanelProps {
  course: Course | null;
  evaluation: CourseEvaluation | null;
  student: StudentData;
  onRequestComplete: (id: string) => void;
  onMarkInProgress: (id: string) => void;
  onUnmark: (id: string) => void;
  onClose: () => void;
}

export function CourseDetailPanel({
  course,
  evaluation,
  student,
  onRequestComplete,
  onMarkInProgress,
  onUnmark,
  onClose,
}: CourseDetailPanelProps) {
  const theme = useTheme();
  const isOpen = course !== null;
  const status: CourseStatus = evaluation?.status ?? "locked";
  const completedSet = new Set(student.completedCourses);
  const inProgressSet = new Set(student.inProgressCourses);

  const handleClose = useCallback(() => onClose(), [onClose]);

  // ── Button factory ────────────────────────────────────────────────────────

  function ActionButton({
    label,
    accent,
    onClick,
    disabled = false,
  }: {
    label: string;
    accent: string;
    onClick: () => void;
    disabled?: boolean;
  }) {
    const disabledStyle: CSSProperties = disabled
      ? { opacity: 0.35, cursor: "not-allowed" }
      : { cursor: "pointer" };

    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          flex: 1,
          background: "transparent",
          border: `1px solid ${accent}`,
          color: accent,
          padding: "8px 10px",
          borderRadius: 5,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          transition: "background 150ms ease",
          ...disabledStyle,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.background =
              accent.startsWith("rgba")
                ? accent
                : hexToRgba(accent, 0.15);
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        {label}
      </button>
    );
  }

  // ── Prereq status indicator ───────────────────────────────────────────────

  function CourseRef({
    courseId,
    type = "prereq",
  }: {
    courseId: string;
    type?: "prereq" | "coreq";
  }) {
    // coreqs are satisfied if in-progress OR completed
    const effectiveSatisfied =
      type === "coreq"
        ? completedSet.has(courseId) || inProgressSet.has(courseId)
        : completedSet.has(courseId);

    const icon = effectiveSatisfied ? "✓" : type === "coreq" ? "○" : "✗";
    const iconColor = effectiveSatisfied
      ? theme.status.completed.text
      : theme.status.locked.text;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: theme.textSecondary,
          background: theme.panel,
          border: `1px solid ${theme.borderDefault}`,
          borderRadius: 4,
          padding: "2px 7px",
          marginRight: 4,
          marginBottom: 4,
        }}
      >
        <span style={{ color: iconColor, fontFamily: "inherit" }}>{icon}</span>
        {courseId}
      </span>
    );
  }

  // ── Prereq section builder ────────────────────────────────────────────────

  function PrereqSection() {
    if (!course) return null;
    const rule = course.prerequisites;

    if (rule.type === "none") {
      return (
        <p style={{ fontSize: 12, color: theme.textMuted, fontStyle: "italic" }}>
          No prerequisites required.
        </p>
      );
    }

    let ruleLabel = "";
    let courseIds: string[] = [];

    if (rule.type === "all") {
      ruleLabel = "Must complete all:";
      courseIds = rule.courses;
    } else if (rule.type === "any") {
      ruleLabel = "Must complete at least one of:";
      courseIds = rule.courses;
    } else if (rule.type === "choose") {
      ruleLabel = `Must complete ${rule.count} of:`;
      courseIds = rule.courses;
    }

    return (
      <>
        <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6, letterSpacing: "0.03em" }}>
          {ruleLabel}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {courseIds.map((id) => (
            <CourseRef
              key={id}
              courseId={id}
              type="prereq"
            />
          ))}
        </div>
      </>
    );
  }

  // ── Coreq section builder ─────────────────────────────────────────────────

  function CoreqSection() {
    if (!course || course.corequisites.length === 0) return null;
    return (
      <>
        <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6, letterSpacing: "0.03em" }}>
          Must be taking concurrently:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {course.corequisites.map((id) => (
            <CourseRef key={id} courseId={id} type="coreq" />
          ))}
        </div>
      </>
    );
  }

  // ── Panel content ─────────────────────────────────────────────────────────

  const panelContent = course ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "16px 16px 12px",
          borderBottom: `1px solid ${theme.borderDefault}`,
          flexShrink: 0,
        }}
      >
        <div>
          <span
            style={{
              display: "block",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: theme.status[status].text,
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            {course.id}
          </span>
          <h2
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: theme.textPrimary,
              lineHeight: 1.2,
              maxWidth: 240,
            }}
          >
            {course.name}
          </h2>
        </div>
        <button
          onClick={handleClose}
          aria-label="Close course detail"
          style={{
            background: "transparent",
            border: "none",
            color: theme.textMuted,
            cursor: "pointer",
            fontSize: 22,
            lineHeight: 1,
            padding: "2px 4px",
            borderRadius: 4,
            flexShrink: 0,
            marginLeft: 8,
            transition: "color 120ms",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = theme.textPrimary)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = theme.textMuted)
          }
        >
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Status badge */}
        <StatusBadge status={status} />

        {/* Meta row: credits + terms */}
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 12,
            color: theme.textSecondary,
          }}
        >
          <span>
            <span style={{ color: theme.textMuted, fontSize: 10, letterSpacing: "0.05em" }}>
              CREDITS{" "}
            </span>
            {course.credits}
          </span>
          {course.minGrade && (
            <span>
              <span style={{ color: theme.textMuted, fontSize: 10, letterSpacing: "0.05em" }}>
                MIN GRADE{" "}
              </span>
              {course.minGrade}
            </span>
          )}
          {course.termsOffered.length > 0 && (
            <span>
              <span style={{ color: theme.textMuted, fontSize: 10, letterSpacing: "0.05em" }}>
                OFFERED{" "}
              </span>
              {course.termsOffered.join(", ")}
            </span>
          )}
        </div>

        {/* Prerequisites */}
        <SectionBlock title="Prerequisites" theme={theme}>
          <PrereqSection />
        </SectionBlock>

        {/* Co-requisites (only shown if the course has any) */}
        {course.corequisites.length > 0 && (
          <SectionBlock title="Co-Requisites" theme={theme}>
            <CoreqSection />
          </SectionBlock>
        )}

        {/* Description */}
        {course.description && (
          <SectionBlock title="Description" theme={theme}>
            <p
              style={{
                fontSize: 12,
                color: theme.textSecondary,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {course.description}
            </p>
          </SectionBlock>
        )}

        {/* Unmet requirements warning */}
        {evaluation && evaluation.unmetPrereqs.length + evaluation.unmetCoreqs.length > 0 && status === "locked" && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 11,
              color: "#fca5a5",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#ef4444" }}>LOCKED</strong>
            {evaluation.unmetPrereqs.length > 0 && (
              <div>Missing prerequisites: {evaluation.unmetPrereqs.join(", ")}</div>
            )}
            {evaluation.unmetCoreqs.length > 0 && (
              <div>Missing co-requisites: {evaluation.unmetCoreqs.join(", ")}</div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons — pinned to bottom */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${theme.borderDefault}`,
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <ActionButton
          label="Completed"
          accent={theme.status.completed.text}
          onClick={() => onRequestComplete(course.id)}
          disabled={status === "locked" || status === "completed"}
        />
        <ActionButton
          label="In Progress"
          accent={theme.status.in_progress.text}
          onClick={() => onMarkInProgress(course.id)}
          disabled={status === "completed" || status === "in_progress"}
        />
        {(status === "completed" || status === "in_progress") && (
          <ActionButton
            label="Remove"
            accent={theme.textMuted}
            onClick={() => onUnmark(course.id)}
          />
        )}
      </div>
    </div>
  ) : null;

  return (
    <div
      role="complementary"
      aria-label="Course details"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100%",
        width: 320,
        background: theme.surface,
        borderLeft: `1px solid ${theme.borderDefault}`,
        zIndex: 100,
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 250ms ease-out",
        boxShadow: isOpen ? "-8px 0 32px rgba(0,0,0,0.5)" : "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {panelContent}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionBlock({
  title,
  children,
  theme,
}: {
  title: string;
  children: ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <div>
      <h3
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          color: theme.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Convert a #rrggbb hex string to rgba(r,g,b,a) */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
