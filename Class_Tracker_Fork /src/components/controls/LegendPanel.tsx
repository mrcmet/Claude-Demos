/**
 * LegendPanel.tsx
 *
 * Compact visual legend showing the four course status colors.
 * Displayed at the bottom of the sidebar. Pure presentational component.
 */

import { useTheme } from "@themes/themeContext";
import type { CourseStatus } from "@types";

const LEGEND_ITEMS: Array<{ status: CourseStatus; label: string }> = [
  { status: "completed",   label: "Completed"   },
  { status: "in_progress", label: "In Progress" },
  { status: "available",   label: "Available"   },
  { status: "locked",      label: "Locked"      },
];

export function LegendPanel() {
  const theme = useTheme();

  return (
    <div
      role="complementary"
      aria-label="Course status legend"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <h3
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: 10,
          color: theme.textMuted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        Legend
      </h3>

      {LEGEND_ITEMS.map(({ status, label }) => {
        const s = theme.status[status];
        return (
          <div
            key={status}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Status color dot */}
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: s.border,
                flexShrink: 0,
                // Subtle glow on the dot
                boxShadow: status !== "locked" ? `0 0 5px ${s.glow}` : undefined,
              }}
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: theme.textSecondary,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
