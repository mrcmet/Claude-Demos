/**
 * StatusBadge.tsx
 *
 * Pill badge that visually communicates a course's enrollment status.
 * Uses the design system color tokens — no hardcoded colors.
 */

import { useTheme } from "@themes/themeContext";
import type { CourseStatus } from "@types";

interface StatusBadgeProps {
  status: CourseStatus;
  /** "sm" for compact inline use, "md" (default) for panel display */
  size?: "sm" | "md";
}

/** Human-readable labels for each status value */
const STATUS_LABELS: Record<CourseStatus, string> = {
  completed:   "Completed",
  in_progress: "In Progress",
  available:   "Available",
  locked:      "Locked",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const theme = useTheme();
  const s = theme.status[status];
  const label = STATUS_LABELS[status];

  const isSm = size === "sm";

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSm ? 4 : 6,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        borderRadius: 20,
        padding: isSm ? "2px 8px" : "4px 12px",
        fontSize: isSm ? 10 : 12,
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        // Subtle glow on the badge itself
        boxShadow: status !== "locked" ? `0 0 6px ${s.glow}` : undefined,
      }}
    >
      {/* Status indicator dot */}
      <span
        aria-hidden="true"
        style={{
          width: isSm ? 5 : 6,
          height: isSm ? 5 : 6,
          borderRadius: "50%",
          background: s.border,
          flexShrink: 0,
          // In-progress gets a subtle pulse
          animation: status === "in_progress"
            ? "pulse-glow 2s ease-in-out infinite"
            : undefined,
        }}
      />
      {label}
    </span>
  );
}
