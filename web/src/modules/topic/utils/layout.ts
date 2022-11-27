import dagre from "dagre";

import { type Edge, type Node } from "../components/Diagram.store";

export type Direction = "TB" | "BT" | "LR" | "RL";
export const minSpaceBetweenNodes = 100;

// mostly from https://reactflow.dev/docs/examples/layout/dagre/
export const layout = (nodes: Node[], edges: Edge[], direction: Direction) => {
  const dagreGraph = new dagre.graphlib.Graph();
  const height = 90; // grab size from node, but how? size adjusts based on input rows

  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction, ranksep: minSpaceBetweenNodes });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.data.width, height: height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - node.data.width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { layoutedNodes, layoutedEdges: edges };
};
