import { shallow } from "zustand/shallow";

import { useIsAnyGraphPartSelected } from "../../view/currentViewStore/store";
import { nodes } from "../utils/edge";
import { findEdgeOrThrow } from "../utils/graph";
import { useTopicStore } from "./store";

export const useIsNodeSelected = (edgeId: string) => {
  const neighborNodes = useTopicStore((state) => {
    try {
      const edge = findEdgeOrThrow(edgeId, state.edges);
      return nodes(edge, state.nodes);
    } catch {
      return [];
    }
  }, shallow);

  return useIsAnyGraphPartSelected(neighborNodes.map((node) => node.id));
};
