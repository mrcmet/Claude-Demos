/**
 * CourseNode.tsx
 *
 * Custom React Flow node component for a single course in the tech tree.
 *
 * Design notes:
 * - Wrapped in React.memo to prevent re-renders when unrelated state changes.
 * - Framer Motion entrance animation: spring scale-in.
 * - Hover effects are CSS-only (index.css .course-node:hover) — zero React
 *   state for hover to keep performance optimal at 20+ nodes.
 * - CSS custom properties (--node-glow, --node-glow-soft) are set inline so
 *   the CSS hover rule can intensify the correct glow color per status.
 * - All colors come from useTheme() — never hardcoded.
 */

import { memo } from "react";
import type { CSSProperties } from "react";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { useTheme } from "@themes/themeContext";
import type { CourseStatus } from "@types";
import type { Course, CourseEvaluation } from "@types";

export interface CourseNodeData {
  course: Course;
  status: CourseStatus;
  evaluation: CourseEvaluation;
}

interface CourseNodeProps {
  data: CourseNodeData;
  /** Whether the node is selected in React Flow (passed automatically) */
  selected?: boolean;
}

/** Invisible React Flow handle style — functional but not rendered */
const hiddenHandle: CSSProperties = { opacity: 0, pointerEvents: "none" };

function CourseNodeComponent({ data, selected }: CourseNodeProps) {
  const theme = useTheme();
  const s = theme.status[data.status];
  const isLocked = data.status === "locked";
  const isInProgress = data.status === "in_progress";

  // Derive soft glow variant for hover CSS property
  const glowSoft = s.glow
    .replace("0.4", "0.2")
    .replace("0.3", "0.15")
    .replace("transparent", "transparent");

  // Selected state adds an extra ring highlight
  const selectedRing = selected
    ? `0 0 0 2px ${theme.textPrimary}`
    : undefined;

  const boxShadow = [
    `0 0 14px ${s.glow}`,
    `0 0 28px ${glowSoft}`,
    ...(selectedRing ? [selectedRing] : []),
  ].join(", ");

  return (
    <>
      {/* Target handle — top edge, receives edges from prerequisite courses */}
      <Handle
        type="target"
        position={Position.Top}
        style={hiddenHandle}
      />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`course-node${isInProgress ? " pulsing" : ""}`}
        style={{
          // Node dimensions
          width: 180,
          height: 90,
          // Status-driven colors
          background: s.bg,
          border: `2px solid ${s.border}`,
          borderRadius: 8,
          boxShadow,
          // Locked courses appear dimmed
          opacity: isLocked ? 0.65 : 1,
          // Layout
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 10px",
          position: "relative",
          cursor: "pointer",
          // CSS hover needs transition on the element
          transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
          // Pass glow colors as CSS custom properties for hover rule in index.css
          "--node-glow": s.glow,
          "--node-glow-soft": glowSoft,
        } as CSSProperties}
      >
        {/* ── Course ID — top-left ── */}
        <span
          aria-label={`Course ID: ${data.course.id}`}
          style={{
            position: "absolute",
            top: 7,
            left: 9,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: s.text,
            letterSpacing: "0.05em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {data.course.id}
        </span>

        {/* ── Center content: course name or lock icon ── */}
        {isLocked ? (
          <LockIcon />
        ) : (
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: theme.textPrimary,
              textAlign: "center",
              lineHeight: 1.25,
              maxWidth: 156,
              // Clamp to 2 lines
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              userSelect: "none",
            }}
          >
            {data.course.name}
          </span>
        )}

        {/* ── Credits pill — bottom-right ── */}
        <span
          aria-label={`${data.course.credits} credits`}
          style={{
            position: "absolute",
            bottom: 6,
            right: 8,
            fontFamily: "'Inter', sans-serif",
            fontSize: 9,
            color: theme.textSecondary,
            background: theme.borderDefault,
            padding: "1px 5px",
            borderRadius: 3,
            lineHeight: 1.6,
            userSelect: "none",
          }}
        >
          {data.course.credits} cr
        </span>

        {/* ── First offered term — bottom-left ── */}
        {data.course.termsOffered.length > 0 && (
          <span
            style={{
              position: "absolute",
              bottom: 7,
              left: 9,
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              color: theme.textMuted,
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {data.course.termsOffered[0]}
          </span>
        )}
      </motion.div>

      {/* Source handle — bottom edge, sends edges to dependent courses */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={hiddenHandle}
      />
    </>
  );
}

/** Padlock SVG shown in the center of locked nodes instead of the course name */
function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6b7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const CourseNode = memo(CourseNodeComponent);
CourseNode.displayName = "CourseNode";

export default CourseNode;
