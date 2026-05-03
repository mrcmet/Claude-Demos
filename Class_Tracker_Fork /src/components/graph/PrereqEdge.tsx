/**
 * PrereqEdge.tsx
 *
 * Custom React Flow edge component for prerequisite and co-requisite
 * relationships between course nodes.
 *
 * Visual behaviour:
 * - prerequisite edges (type "prereqEdge"): solid line, colored by target status
 * - co-requisite edges (type "coreqEdge"): dashed, cyan, with a "co-req" label
 * - locked target: dim gray, no glow, strokeWidth 1
 * - animated edges (available target): dash-flow CSS animation
 * - glow layer: blurred wider path underneath the main edge
 *
 * The component is used for BOTH edge types (registered under both names in
 * TechTreeGraph.tsx). The `data.edgeType` field disambiguates at render time.
 */

import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from "@xyflow/react";
import type { Edge, EdgeProps } from "@xyflow/react";
import { colors } from "@themes/colors";
import type { CourseStatus } from "@types";

export interface PrereqEdgeData extends Record<string, unknown> {
  /** The resolved status of the target course — drives color selection */
  targetStatus: CourseStatus;
  /** Edge kind: prereq uses solid line; coreq uses dashed + label */
  edgeType?: "prereqEdge" | "coreqEdge";
}

export type PrereqEdgeType = Edge<PrereqEdgeData, "prereqEdge" | "coreqEdge">;

/**
 * Single component handles both edge types.
 * Registered as both "prereqEdge" and "coreqEdge" in TechTreeGraph nodeTypes.
 */
export function PrereqEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  animated,
  data,
  // markerEnd provided by React Flow for directed arrows
  markerEnd,
}: EdgeProps<PrereqEdgeType>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const targetStatus: CourseStatus = data?.targetStatus ?? "locked";
  const edgeType = data?.edgeType ?? "prereqEdge";
  const isCoreq = edgeType === "coreqEdge";
  const isLocked = targetStatus === "locked";

  // Color tokens for the target status
  const statusTokens = colors.status[targetStatus];
  const strokeColor = isLocked ? "#374151" : statusTokens.border;
  const glowColor = isLocked ? "transparent" : statusTokens.glow;
  const strokeWidth = isLocked ? 1 : isCoreq ? 1.5 : 2;

  // Dash pattern: coreqs always dashed; prereqs get flow-animation dashes
  const strokeDasharray = isCoreq
    ? "6 3"
    : animated
    ? "5 5"
    : undefined;

  const animation =
    animated && !isCoreq ? "dash-flow 1.5s linear infinite" : undefined;

  // Unique SVG filter ID per edge instance to avoid ID collisions
  const filterId = `edge-glow-${id}`;

  return (
    <>
      <defs>
        {!isLocked && (
          <filter
            id={filterId}
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Glow layer — wider blurred path drawn beneath the main stroke */}
      {!isLocked && (
        <path
          d={edgePath}
          stroke={glowColor}
          strokeWidth={6}
          fill="none"
          filter={`url(#${filterId})`}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Main edge path via BaseEdge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          animation,
          transition: "stroke 200ms ease",
        }}
      />

      {/* Co-req label rendered via EdgeLabelRenderer (outside SVG, in DOM) */}
      {isCoreq && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              // Label pill styles
              fontSize: 9,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              color: "#00d4ff",
              background: "rgba(13, 26, 45, 0.92)",
              padding: "2px 5px",
              borderRadius: 3,
              border: "1px solid rgba(0, 212, 255, 0.3)",
              lineHeight: 1.5,
              letterSpacing: "0.03em",
              backdropFilter: "blur(4px)",
            }}
          >
            co-req
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
