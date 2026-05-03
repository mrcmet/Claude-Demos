import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Course } from "@types";
import { Modal } from "@components/shared/Modal";
import { useTheme } from "@themes/themeContext";
import { GRADE_ORDER, meetsMinGrade } from "../../engine/gpaCalculator";

interface GradeEntryModalProps {
  open: boolean;
  course: Course | null;
  onConfirm: (courseId: string, grade: string) => void;
  onCancel: () => void;
}

export function GradeEntryModal({
  open,
  course,
  onConfirm,
  onCancel,
}: GradeEntryModalProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredGrade, setHoveredGrade] = useState<string | null>(null);
  const [hoveredAction, setHoveredAction] = useState<"cancel" | "confirm" | null>(
    null
  );

  // Reset selection whenever the modal is reopened or the target course changes.
  useEffect(() => {
    if (open) {
      setSelected(null);
      setHoveredGrade(null);
      setHoveredAction(null);
    }
  }, [open, course?.id]);

  if (!course) {
    return (
      <Modal open={open} onClose={onCancel} title="Record Grade" maxWidth={400} />
    );
  }

  const minGrade = course.minGrade ?? "D";
  const minGradeLabelSuffix = course.minGrade ? "" : " (default)";
  const failsMin = selected !== null && !meetsMinGrade(selected, minGrade);

  const completedBorder = theme.status.completed.border;
  const completedText = theme.status.completed.text;

  const labelStyle: CSSProperties = {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: theme.textMuted,
  };

  const gradeButtonStyle = (grade: string): CSSProperties => {
    const isSelected = selected === grade;
    const isHovered = hoveredGrade === grade;
    if (isSelected) {
      return {
        background: "rgba(0,255,136,0.12)",
        border: `1px solid ${completedBorder}`,
        color: completedText,
        boxShadow: "0 0 8px rgba(0,255,136,0.3)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        textTransform: "none",
        height: 28,
        width: 36,
        borderRadius: 6,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "all 140ms ease",
      };
    }
    return {
      background: theme.panel,
      border: `1px solid ${isHovered ? theme.textMuted : theme.borderDefault}`,
      color: theme.textSecondary,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      textTransform: "none",
      height: 28,
      width: 36,
      borderRadius: 6,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      transition: "all 140ms ease",
    };
  };

  const actionBaseStyle: CSSProperties = {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "8px 18px",
    borderRadius: 6,
    background: "transparent",
    transition: "background 140ms ease, opacity 140ms ease",
  };

  const cancelStyle: CSSProperties = {
    ...actionBaseStyle,
    border: `1px solid ${theme.borderDefault}`,
    color: theme.textMuted,
    cursor: "pointer",
    background:
      hoveredAction === "cancel" ? "rgba(71,85,105,0.12)" : "transparent",
  };

  const confirmDisabled = selected === null;
  const confirmStyle: CSSProperties = {
    ...actionBaseStyle,
    border: `1px solid ${completedBorder}`,
    color: completedText,
    cursor: confirmDisabled ? "not-allowed" : "pointer",
    opacity: confirmDisabled ? 0.35 : 1,
    background:
      !confirmDisabled && hoveredAction === "confirm"
        ? "rgba(0,255,136,0.12)"
        : "transparent",
  };

  return (
    <Modal open={open} onClose={onCancel} title="Record Grade" maxWidth={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: theme.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {course.name}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: completedText,
            }}
          >
            {course.id}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={labelStyle}>
            {course.credits} {course.credits === 1 ? "credit" : "credits"}
          </div>
          <div style={labelStyle}>
            Min Grade: {minGrade} or better{minGradeLabelSuffix}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={labelStyle}>Select Grade</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 36px)",
              gap: 8,
            }}
          >
            {GRADE_ORDER.map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setSelected(grade)}
                onMouseEnter={() => setHoveredGrade(grade)}
                onMouseLeave={() => setHoveredGrade(null)}
                style={gradeButtonStyle(grade)}
                aria-pressed={selected === grade}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {failsMin && (
          <div
            role="alert"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              padding: "10px 12px",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: theme.accent.red,
              lineHeight: 1.4,
            }}
          >
            ⚠ Grade below minimum requirement. Course may need to be retaken.
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 4,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            onMouseEnter={() => setHoveredAction("cancel")}
            onMouseLeave={() => setHoveredAction(null)}
            style={cancelStyle}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={() => {
              if (selected) onConfirm(course.id, selected);
            }}
            onMouseEnter={() => setHoveredAction("confirm")}
            onMouseLeave={() => setHoveredAction(null)}
            style={confirmStyle}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
