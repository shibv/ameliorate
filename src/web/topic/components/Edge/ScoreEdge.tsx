import { Box, Typography } from "@mui/material";
import lowerCase from "lodash/lowerCase";
import { EdgeLabelRenderer, getBezierPath } from "reactflow";

import { RelationName } from "../../../../common/edge";
import { openContextMenu } from "../../../common/store/contextMenuActions";
import { setSelectedGraphPart } from "../../store/actions";
import { useIsNodeSelected } from "../../store/edgeHooks";
import { Edge, markerStart } from "../../utils/diagram";
import { EdgeProps } from "../Diagram/Diagram";
import { Spotlight } from "../Diagram/Diagram.styles";
import { EdgeIndicatorGroup } from "../Indicator/EdgeIndicatorGroup";
import { nodeWidthPx } from "../Node/EditableNode.styles";
import { StyledDiv, StyledPath } from "./ScoreEdge.styles";

// copied directly from html generated by react-flow - jank but the package doesn't export its marker definition
export const svgMarkerDefId = "arrow";

const svgMarkerDef = (
  <defs>
    <marker
      id={svgMarkerDefId}
      markerWidth="30"
      markerHeight="30"
      viewBox="-10 -10 20 20"
      markerUnits="strokeWidth"
      orient="auto" // this was auto-start-reverse but that appeared outside the viewbox
      refX="0"
      refY="0"
    >
      <polyline
        stroke="#b1b1b7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
        fill="#b1b1b7"
        points="-5,-4 0,0 -5,4 -5,-4"
      ></polyline>
    </marker>
  </defs>
);

const convertToEdge = (flowEdge: EdgeProps): Edge => {
  return {
    id: flowEdge.id,
    // react-flow makes these nullable but we'll always pass them
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    data: flowEdge.data!,
    label: flowEdge.label! as RelationName,
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- this should never be null?
    selected: flowEdge.selected!,
    // janky, not grabbing from flow edge because flow edge converts this to some URL format that idk how to convert;
    // but this value is currently always constant so it should be fine
    markerStart: markerStart,
    source: flowEdge.source,
    target: flowEdge.target,
    type: "FlowEdge",
  };
};

interface Props {
  inReactFlow: boolean;
}

// base for custom edge taken from https://reactflow.dev/docs/examples/edges/edge-with-button/
export const ScoreEdge = ({ inReactFlow, ...flowEdge }: EdgeProps & Props) => {
  const edge = convertToEdge(flowEdge);

  const isNodeSelected = useIsNodeSelected(edge.id);

  const spotlight: Spotlight = edge.selected ? "primary" : isNodeSelected ? "secondary" : "normal";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: flowEdge.sourceX,
    sourceY: flowEdge.sourceY,
    sourcePosition: flowEdge.sourcePosition,
    targetX: flowEdge.targetX,
    targetY: flowEdge.targetY,
    targetPosition: flowEdge.targetPosition,
  });

  const path = (
    <StyledPath
      id={flowEdge.id}
      style={flowEdge.style}
      className="react-flow__edge-path"
      d={edgePath}
      markerStart={flowEdge.markerStart}
      markerEnd={flowEdge.markerEnd}
      spotlight={spotlight}
    />
  );

  const label = (
    <StyledDiv
      labelX={labelX}
      labelY={labelY}
      onClick={() => setSelectedGraphPart(edge.id)}
      onContextMenu={(event) => openContextMenu(event, { edge })}
      spotlight={spotlight}
    >
      <Typography variant="body1" margin="0">
        {lowerCase(edge.label)}
      </Typography>
      <EdgeIndicatorGroup edge={edge} />
    </StyledDiv>
  );

  // React flow edges are already rendered within an SVG.
  //
  // It seems like it'd be nicer to use two separate components instead of branching in one edge
  // component like this, but it's hard to reuse the path and label across multiple edge components.
  if (inReactFlow) {
    return (
      <>
        {path}

        {/* see for example usage https://reactflow.dev/docs/api/edges/edge-label-renderer/ */}
        <EdgeLabelRenderer>{label}</EdgeLabelRenderer>
      </>
    );
  } else {
    return (
      <>
        {/* hardcoded assuming we're connecting two lined-up nodes that are 100px apart */}
        <Box width={nodeWidthPx} height={100}>
          <svg
            width={nodeWidthPx}
            height={100}
            style={{ position: "absolute", cursor: "default" }}
            className="react-flow__edge selected"
          >
            {svgMarkerDef}

            {path}
          </svg>

          {label}
        </Box>
      </>
    );
  }
};
