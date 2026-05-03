/**
 * graphLayout.ts
 *
 * Applies a Dagre directed-graph layout to a set of React Flow nodes and edges.
 * Returns a new nodes array with real { x, y } positions calculated from the
 * dependency hierarchy. Edges are not mutated — dagre only needs them for rank
 * assignment.
 *
 * Why Dagre?
 * ----------
 * React Flow does not provide automatic layout. Dagre is the standard choice
 * for directed acyclic graphs (prerequisite chains) because it produces clean
 * "top-to-bottom" or "left-to-right" rank-based layouts that mirror how
 * academic curriculum maps are traditionally drawn.
 *
 * Layout parameters are intentionally generous (ranksep/nodesep) to prevent
 * node overlap with the 180×90px course nodes and give the glow effects room.
 */

import Dagre from "@dagrejs/dagre";
import type { GraphNode, GraphEdge } from "@types";

/** Fixed node dimensions matching CourseNode.tsx visual spec */
const NODE_WIDTH = 180;
const NODE_HEIGHT = 90;

/**
 * Computes dagre layout positions for all nodes.
 *
 * @param nodes     - GraphNode array (positions will be replaced)
 * @param edges     - GraphEdge array (read-only; used for rank computation)
 * @param direction - "TB" (top→bottom, default) or "LR" (left→right)
 * @returns         - New nodes array with updated position values
 */
export function applyDagreLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: "TB" | "LR" = "TB"
): GraphNode[] {
  if (nodes.length === 0) return nodes;

  const g = new Dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    ranksep: 100,  // vertical spacing between ranks (rows)
    nodesep: 60,   // horizontal spacing between nodes in the same rank
    marginx: 40,
    marginy: 40,
  });
  // Required by dagre: suppress default edge label function
  g.setDefaultEdgeLabel(() => ({}));

  // Register nodes with their pixel dimensions
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Register edges (dagre ignores edge data; only uses source/target for ranks)
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  // Dagre centers nodes at (x, y) — convert to top-left origin for React Flow
  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) {
      // Node not in graph (isolated, no edges) — dagre may not compute position
      return node;
    }
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}
