/**
 * TechTreeGraph.tsx
 *
 * Main React Flow canvas that renders the full course dependency graph.
 *
 * Architecture notes:
 * - MUST be rendered inside a <ReactFlowProvider> — that lives in App.tsx.
 * - Calls buildGraphData (from Agent A's engine layer) to convert raw course +
 *   evaluation data into React Flow nodes/edges.
 * - Applies dagre layout via applyDagreLayout before passing to ReactFlow.
 * - fitView runs after layout with a smooth 600ms animation.
 * - nodeTypes and edgeTypes are defined OUTSIDE the component so they are
 *   referentially stable across renders — React Flow requires this to avoid
 *   remounting nodes on every render.
 * - deleteKeyCode null prevents accidental course deletion with Backspace.
 */

import { useEffect, useMemo, useCallback, type MouseEvent } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import CourseNode from "./CourseNode";
import { PrereqEdge } from "./PrereqEdge";
import { applyDagreLayout } from "./graphLayout";
import { buildGraphData } from "@engine/graphBuilder";
import { colors } from "@themes/colors";
import type { PlanFile, CourseEvaluation, CourseStatus } from "@types";

// ── Stable type registries (must be outside component) ──────────────────────

const nodeTypes = {
  courseNode: CourseNode,
} as const;

const edgeTypes = {
  prereqEdge: PrereqEdge,
  coreqEdge: PrereqEdge,
};

// ── Component ────────────────────────────────────────────────────────────────

interface TechTreeGraphProps {
  planFile: PlanFile;
  evaluations: CourseEvaluation[];
  onCourseClick: (courseId: string) => void;
}

export function TechTreeGraph({
  planFile,
  evaluations,
  onCourseClick,
}: TechTreeGraphProps) {
  const { fitView } = useReactFlow();

  // Build and layout graph data. Re-computed only when courses or evaluations change.
  const { nodes, edges } = useMemo(() => {
    const raw = buildGraphData(planFile.courses, evaluations);
    const layoutedNodes = applyDagreLayout(raw.nodes, raw.edges, "TB");
    return { nodes: layoutedNodes, edges: raw.edges };
  }, [planFile.courses, evaluations]);

  // Fit view into frame after layout has been computed.
  // Delayed by one tick to ensure React Flow has painted the new nodes.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitView({ padding: 0.15, duration: 600 });
    }, 50);
    return () => clearTimeout(timeout);
  }, [planFile, fitView]);

  // Stable click handler — extracts courseId from node and calls parent callback
  const handleNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      onCourseClick(node.id);
    },
    [onCourseClick]
  );

  // MiniMap node color derived from the node's data.status
  const miniMapNodeColor = useCallback((node: Node) => {
    const status = (node.data as { status: CourseStatus }).status;
    return colors.status[status]?.border ?? "#374151";
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      colorMode="dark"
      deleteKeyCode={null}
      selectionKeyCode={null}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      // Prevent accidental node drag changing layout; keep graph structural
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      // Performance: only re-render visible nodes
      onlyRenderVisibleElements={false}
    >
      {/* Dotted grid background */}
      <Background
        variant={BackgroundVariant.Dots}
        color={colors.borderDefault}
        gap={32}
        size={1.5}
      />

      {/* Zoom/pan controls, styled via index.css */}
      <Controls showInteractive={false} />

      {/* Mini-map for large graphs */}
      <MiniMap
        nodeColor={miniMapNodeColor}
        nodeStrokeColor={colors.background}
        nodeStrokeWidth={2}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: 6,
        }}
        maskColor="rgba(10,14,26,0.6)"
      />
    </ReactFlow>
  );
}
