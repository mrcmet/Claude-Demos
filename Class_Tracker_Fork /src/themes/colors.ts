/**
 * Design system color palette for the Curriculum Tech Tree Planner.
 * All components MUST import from this file — never hardcode hex values.
 */

export const colors = {
  /** Deep space — main app background */
  background: "#0a0e1a",
  /** Dark navy — sidebar, panels, overlays */
  surface: "#111827",
  /** Card / panel background */
  panel: "#1a2235",
  /** Default border / divider */
  borderDefault: "#1e2d45",

  /** Primary text */
  textPrimary: "#e2e8f0",
  /** Secondary / label text */
  textSecondary: "#94a3b8",
  /** Muted / placeholder text */
  textMuted: "#475569",

  /**
   * Per-status color tokens.
   * bg     — node background
   * border — node border + edge stroke
   * glow   — box-shadow color (rgba string)
   * text   — course ID label, badge text
   */
  status: {
    completed: {
      bg:     "#0d2b1e",
      border: "#00ff88",
      glow:   "rgba(0,255,136,0.4)",
      text:   "#00ff88",
    },
    in_progress: {
      bg:     "#0d1a2d",
      border: "#00d4ff",
      glow:   "rgba(0,212,255,0.4)",
      text:   "#00d4ff",
    },
    available: {
      bg:     "#0f1a2e",
      border: "#3b82f6",
      glow:   "rgba(59,130,246,0.3)",
      text:   "#60a5fa",
    },
    locked: {
      bg:     "#1a1a24",
      border: "#374151",
      glow:   "transparent",
      text:   "#6b7280",
    },
  },

  /** Accent palette used in action buttons */
  accent: {
    green:  "#00ff88",
    cyan:   "#00d4ff",
    blue:   "#3b82f6",
    red:    "#ef4444",
    orange: "#f59e0b",
  },
} as const;

export type StatusKey = keyof typeof colors.status;

/** Helper — returns the status token object for a given status key */
export function getStatusTokens(status: StatusKey) {
  return colors.status[status];
}
