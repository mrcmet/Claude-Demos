import type { Course } from "@types";
import { useTheme } from "@themes/themeContext";
import { calculateGpa } from "../../engine/gpaCalculator";

interface GpaBarProps {
  gpaData: Record<string, string> | undefined;
  courses: Course[];
}

export function GpaBar({ gpaData, courses }: GpaBarProps) {
  const theme = useTheme();
  const result = calculateGpa(gpaData ?? {}, courses);

  if (result === null) return null;

  const { gpa, creditCount } = result;
  const fillPercent = Math.max(0, Math.min(100, (gpa / 4.0) * 100));
  const completedBorder = theme.status.completed.border;
  const completedText = theme.status.completed.text;

  return (
    <div
      style={{
        height: 44,
        background: theme.surface,
        borderTop: `1px solid ${theme.borderDefault}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          color: theme.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        GPA
      </span>

      <div
        style={{
          flex: 1,
          maxWidth: 280,
          height: 6,
          background: theme.borderDefault,
          borderRadius: 3,
          overflow: "hidden",
        }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={gpa}
      >
        <div
          style={{
            width: `${fillPercent}%`,
            height: "100%",
            background: completedBorder,
            borderRadius: 3,
            transition: "width 500ms ease",
            boxShadow: "0 0 8px rgba(0,255,136,0.35)",
          }}
        />
      </div>

      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          fontWeight: 600,
          color: completedText,
        }}
      >
        {gpa.toFixed(2)}
      </span>

      <span
        style={{
          color: theme.textMuted,
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        ·
      </span>

      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: theme.textMuted,
        }}
      >
        {creditCount} cr earned
      </span>
    </div>
  );
}
