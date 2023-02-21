import { Cancel } from "@mui/icons-material";
import { Typography } from "@mui/material";
import _ from "lodash";
import { ComponentType } from "react";
import {
  Background,
  BackgroundVariant,
  type EdgeProps as DefaultEdgeProps,
  type NodeProps as DefaultNodeProps,
} from "reactflow";

import { closeClaimDiagram, connectNodes, deselectNodes } from "../../store/actions";
import { useFilteredDiagram } from "../../store/store";
import { type Edge, type Node } from "../../utils/diagram";
import { type NodeType } from "../../utils/nodes";
import { FlowNode } from "../FlowNode/FlowNode";
import { ScoreEdge } from "../ScoreEdge/ScoreEdge";
import { PositionedCloseButton, StyledReactFlow } from "./Diagram.styles";

const buildNodeComponent = (type: NodeType) => {
  // eslint-disable-next-line react/display-name -- react flow dynamically creates these components without name anyway
  return (props: NodeProps) => {
    return <FlowNode {...props} type={type} />;
  };
};

// this can be generated via `nodeDecorations` but hard to do without the complexity making it hard to follow, so leaving this hardcoded
const nodeTypes: Record<NodeType, ComponentType<NodeProps>> = {
  problem: buildNodeComponent("problem"),
  solution: buildNodeComponent("solution"),
  criterion: buildNodeComponent("criterion"),
  rootClaim: buildNodeComponent("rootClaim"),
  support: buildNodeComponent("support"),
  critique: buildNodeComponent("critique"),
};

const edgeTypes: Record<"ScoreEdge", ComponentType<EdgeProps>> = { ScoreEdge: ScoreEdge };

// react-flow passes exactly DefaultNodeProps but data can be customized
// not sure why, but DefaultNodeProps has xPos and yPos instead of Node's position.x and position.y
export interface NodeProps extends DefaultNodeProps {
  data: Node["data"];
}

export interface EdgeProps extends DefaultEdgeProps {
  // we'll always pass data - why does react-flow make it nullable :(
  // can't figure out how to amend this to make it non-nullable, since react-flow's Edge is defined as a type, not an interface
  data?: Edge["data"];
}

interface DiagramProps {
  diagramId: string;
}

export const Diagram = ({ diagramId }: DiagramProps) => {
  const diagram = useFilteredDiagram(diagramId);

  const nodes = diagram.nodes;
  const edges = diagram.edges;

  const showCloseButton = diagram.type === "claim";
  const closeButton = (
    <PositionedCloseButton onClick={() => closeClaimDiagram()} color="primary">
      <Cancel />
    </PositionedCloseButton>
  );

  const emptyText = <Typography variant="h5">Right-click to create</Typography>;

  return (
    <>
      {showCloseButton && closeButton}

      <StyledReactFlow
        id={diagramId} // need unique ids to use multiple flow instances on the same page
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        minZoom={0.25}
        onPaneClick={deselectNodes}
        onConnect={({ source, target }) => connectNodes(source, target)}
        nodesDraggable={false}
        nodesConnectable={diagram.type !== "claim"} // claim diagram is a tree, so cannot connect existing nodes
      >
        <Background variant={BackgroundVariant.Dots} />
        {_(nodes).isEmpty() && emptyText}
      </StyledReactFlow>
    </>
  );
};
