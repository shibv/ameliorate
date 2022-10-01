import { Typography } from "@mui/material";
import _ from "lodash";
import { NextPage } from "next";
import { useEffect } from "react";
import { Background, BackgroundVariant, useEdgesState, useNodesState } from "react-flow-renderer";

import { EditableNode } from "../EditableNode/EditableNode";
import { StyledReactFlow } from "./Diagram.styles";

const nodeTypes = { editable: EditableNode };

export type As = "Parent" | "Child";

let nodeId = 0;
const nextNodeId = () => (nodeId++).toString();
let edgeId = 0;
const nextEdgeId = () => (edgeId++).toString();

const Home: NextPage = () => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  const addNode = (toNodeId: string, as: As) => {
    const newNodeId = nextNodeId();

    setNodes((nodes) => {
      const toNode = nodes.find((node) => node.id === toNodeId);
      if (!toNode) throw "toNode not found";

      const yShift = as === "Parent" ? -100 : 100;

      const newNode = {
        id: newNodeId,
        data: {
          label: `text${newNodeId}`,
          addNode: addNode,
        },
        position: { x: toNode.position.x, y: toNode.position.y + yShift },
        type: "editable",
      };

      return nodes.concat(newNode);
    });

    setEdges((edges) => {
      const newEdgeId = nextEdgeId();
      const sourceNode = as === "Parent" ? newNodeId : toNodeId;
      const targetNode = as === "Parent" ? toNodeId : newNodeId;
      const newEdge = { id: newEdgeId, source: sourceNode, target: targetNode };

      return edges.concat(newEdge);
    });
  };

  useEffect(() => {
    setNodes([
      {
        id: nextNodeId(),
        data: {
          label: "text1",
          addNode: addNode,
        },
        position: { x: 250, y: 25 },
        type: "editable",
      },
    ]);
  }, []); // only run the first render

  const deselectNodes = () => {
    setNodes((nodes) => {
      return nodes.map((node) => {
        return { ...node, selected: false };
      });
    });
  };

  const emptyText = <Typography variant="h5">Right-click to create</Typography>;

  return (
    <StyledReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      onPaneClick={deselectNodes}
    >
      <Background variant={BackgroundVariant.Dots} />
      {_(nodes).isEmpty() && emptyText}
    </StyledReactFlow>
  );
};

export default Home;