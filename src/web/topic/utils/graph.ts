import { MarkerType } from "reactflow";
import { v4 as uuid } from "uuid";

import { RelationName } from "../../../common/edge";
import { errorWithData } from "../../../common/errorHandling";
import { composedRelations } from "./edge";
import { FlowNodeType } from "./node";

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface Node {
  id: string;
  data: {
    label: string;
    notes: string;
    arguedDiagramPartId?: string;
    showing: boolean;
    newlyAdded: boolean; // jank to allow focusing nodes after adding them
  };
  type: FlowNodeType;
}

export interface ProblemNode extends Node {
  type: "problem";
}

interface BuildProps {
  id?: string;
  label?: string;
  notes?: string;
  type: FlowNodeType;
  arguedDiagramPartId?: string;
}
export const buildNode = ({ id, label, notes, type, arguedDiagramPartId }: BuildProps): Node => {
  const node = {
    id: id ?? uuid(),
    data: {
      label: label ?? `new node`,
      notes: notes ?? "",
      arguedDiagramPartId: arguedDiagramPartId,
      showing: true,
      newlyAdded: false,
    },
    type: type,
  };

  return node;
};

// assumes that we always want to point from child to parent
export const markerStart = { type: MarkerType.ArrowClosed, width: 30, height: 30 };

export type RelationDirection = "parent" | "child";

export interface Edge {
  id: string;
  data: {
    arguedDiagramPartId?: string;
    notes: string;
  };
  label: RelationName;
  markerStart: { type: MarkerType; width: number; height: number };
  /**
   * id of the source graph part. Can be a node or an edge, but most UI edge operations only work
   * with node sources.
   *
   * It seems like there might be value in having a SuperEdge type that can point to edges, so that
   * regular edges can be distinguished. But that sounds like a lot of work and it's hard to tell
   * that it'd be worth it.
   */
  source: string; // source === parent if arrows point from bottom to top
  /**
   * id of the target graph part. Can be a node or an edge, but most UI edge operations only work
   * with node targets.
   *
   * It seems like there might be value in having a SuperEdge type that can point to edges, so that
   * regular edges can be distinguished. But that sounds like a lot of work and it's hard to tell
   * that it'd be worth it.
   */
  target: string; // target === child if arrows point from bottom to top
  type: "FlowEdge";
}

interface BuildEdgeProps {
  id?: string;
  notes?: string;
  sourceId: string;
  targetId: string;
  relation: RelationName;
  arguedDiagramPartId?: string;
}
export const buildEdge = ({
  id,
  notes,
  sourceId,
  targetId,
  relation,
  arguedDiagramPartId,
}: BuildEdgeProps): Edge => {
  return {
    id: id ?? uuid(),
    data: {
      arguedDiagramPartId: arguedDiagramPartId,
      notes: notes ?? "",
    },
    label: relation,
    markerStart: markerStart,
    source: sourceId,
    target: targetId,
    type: "FlowEdge" as const,
  };
};

export type GraphPart = Node | Edge;
export type GraphPartType = "node" | "edge";

export const possibleScores = ["-", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
export type Score = typeof possibleScores[number];

export const findNode = (nodeId: string, nodes: Node[]) => {
  const node = nodes.find((node) => node.id === nodeId);
  if (!node) throw errorWithData("node not found", nodeId, nodes);

  return node;
};

export const findEdge = (edgeId: string, edges: Edge[]) => {
  const edge = edges.find((edge) => edge.id === edgeId);
  if (!edge) throw errorWithData("edge not found", edgeId, edges);

  return edge;
};

export const findGraphPart = (graphPartId: string, nodes: Node[], edges: Edge[]) => {
  const graphPart = [...nodes, ...edges].find((graphPart) => graphPart.id === graphPartId);
  if (!graphPart) throw errorWithData("graph part not found", graphPartId, nodes, edges);

  return graphPart;
};

export const isNode = (graphPart: GraphPart): graphPart is Node => {
  if (graphPart.type !== "FlowEdge") return true;
  return false;
};

export const getNodesComposedBy = (node: Node, topicGraph: Graph) => {
  return composedRelations.flatMap((composedRelation) => {
    const composingEdges = topicGraph.edges.filter((edge) => {
      return edge.source === node.id && edge.label === composedRelation.name;
    });

    const potentialComposedNodes = composingEdges.map((edge) =>
      findNode(edge.target, topicGraph.nodes)
    );

    return potentialComposedNodes
      .filter((node) => node.type === composedRelation.child)
      .map((node) => node);
  });
};