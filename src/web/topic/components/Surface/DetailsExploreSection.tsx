import { School } from "@mui/icons-material";
import { ListItem, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";

import { useExploreNodes } from "../../store/graphPartHooks";
import { GraphPart, isNode } from "../../utils/graph";
import { AddNodeButton } from "../Node/AddNodeButton";
import { EditableNode } from "../Node/EditableNode";

interface Props {
  graphPart: GraphPart;
}

// make work for topic (when no graphPart is passed)
export const DetailsExploreSection = ({ graphPart }: Props) => {
  const { questions, facts, sources } = useExploreNodes(graphPart.id);

  const exploreNodes = [...questions, ...facts, ...sources];
  const partType = isNode(graphPart) ? graphPart.type : graphPart.label;

  return (
    <>
      <ListItem disablePadding={false}>
        <ListItemIcon>
          <School />
        </ListItemIcon>
        <ListItemText primary="Exploration" />
      </ListItem>

      {/* spacing is the amount that centers the add buttons above the columns */}
      <Stack direction="row" justifyContent="center" alignItems="center" marginBottom="8px">
        <AddNodeButton
          fromPartId={graphPart.id}
          as="child"
          toNodeType="question"
          relation={{
            child: "question",
            name: "asksAbout",
            parent: partType,
          }}
          selectNewNode={false}
        />
        <AddNodeButton
          fromPartId={graphPart.id}
          as="child"
          toNodeType="fact"
          relation={{
            child: "fact",
            name: "relevantFor",
            parent: partType,
          }}
          selectNewNode={false}
        />
        <AddNodeButton
          fromPartId={graphPart.id}
          as="child"
          toNodeType="source"
          relation={{
            child: "source",
            name: "relevantFor",
            parent: partType,
          }}
          selectNewNode={false}
        />
      </Stack>

      <Stack
        direction="row"
        justifyContent="center"
        alignItems="stretch"
        flexWrap="wrap"
        useFlexGap
        spacing="2px"
      >
        {exploreNodes.length > 0 ? (
          exploreNodes.map((exploreNode) => (
            <EditableNode key={exploreNode.id} node={exploreNode} supplemental />
          ))
        ) : (
          <Typography>No explore nodes yet!</Typography>
        )}
      </Stack>
    </>
  );
};