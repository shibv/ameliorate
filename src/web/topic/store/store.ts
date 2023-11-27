import { temporal } from "zundo";
import { devtools, persist } from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";

import { claimRelationNames } from "../../../common/edge";
import {
  Diagram,
  Edge,
  Node,
  Score,
  buildNode,
  filterHiddenComponents,
  findGraphPart,
  findNode,
} from "../utils/diagram";
import { apiSyncer } from "./apiSyncerMiddleware";
import { migrate } from "./migrate";
import { getClaimTree, getTopicDiagram } from "./utils";

export interface PlaygroundTopic {
  id: undefined; // so we can check this to see if the store topic is a playground topic
  title: string;
  description: string;
}

export type UserTopic = Omit<PlaygroundTopic, "id"> & {
  id: number;
  creatorName: string;
};

export type StoreTopic = UserTopic | PlaygroundTopic;

// TODO: probably better to put userScores into a separate store (it doesn't seem necessary to
// couple scores with the nodes/edges, and we'd be able to avoid triggering score comparators by
// non-score-related changes), but a separate store will create the problem of separate undos/redos,
// and the need for another apiSyncer middleware? So it'll be nontrivial.
export type UserScores = Record<string, Record<string, Score>>; // userScores[:username][:graphPartId]

/**
 * If we're on the playground, hardcode "me." as the username. This:
 * - allows us to still use the userScores object in the store
 * - indicates that the scores are the creator's
 * - indicates that the user is not a real user, since "." is not a valid username character
 */
export const playgroundUsername = "me.";

export interface TopicStoreState {
  topic: StoreTopic;
  nodes: Node[];
  edges: Edge[];
  userScores: UserScores;
  activeTableProblemId: string | null;
  activeClaimTreeId: string | null;
  showImpliedEdges: boolean;
}

export const initialState: TopicStoreState = {
  topic: { id: undefined, title: "", description: "" },
  nodes: [buildNode({ type: "problem" })],
  edges: [],
  userScores: {},
  activeTableProblemId: null,
  activeClaimTreeId: null,
  showImpliedEdges: true,
};

// should probably be "topic-playground-storage" but don't know how to migrate
export const topicStorePlaygroundName = "diagram-storage";

// create atomic selectors for usage outside of store/ dir
// this is only exported to allow actions to be extracted to a separate file
export const useTopicStore = createWithEqualityFn<TopicStoreState>()(
  apiSyncer(
    temporal(
      persist(
        devtools(() => initialState),
        {
          name: topicStorePlaygroundName,
          version: 18,
          migrate: migrate,
          skipHydration: true,
        }
      )
    )
  ),
  Object.is // using `createWithEqualityFn` so that we can do shallow or deep diffs in hooks that return new arrays/objects so that we can avoid extra renders
);

export const useTopicDiagram = (): Diagram => {
  return useTopicStore((state) => {
    const topicGraph = { nodes: state.nodes, edges: state.edges };
    const topicDiagram = getTopicDiagram(topicGraph);
    const claimEdges = state.edges.filter((edge) => claimRelationNames.includes(edge.label));
    return filterHiddenComponents(topicDiagram, claimEdges, state.showImpliedEdges);
  });
};

export const useClaimTree = (arguedDiagramPartId: string): Diagram => {
  return useTopicStore((state) => {
    const topicGraph = { nodes: state.nodes, edges: state.edges };
    return getClaimTree(topicGraph, arguedDiagramPartId);
  });
};

export const useActiveArguedDiagramPart = () => {
  return useTopicStore((state) => {
    if (!state.activeClaimTreeId) return null;

    return findGraphPart(state.activeClaimTreeId, state.nodes, state.edges);
  });
};

export const useActiveTableProblemNode = () => {
  return useTopicStore((state) => {
    if (!state.activeTableProblemId) return null;

    return findNode(state.activeTableProblemId, state.nodes);
  });
};

export const useIsTableActive = () => {
  return useTopicStore(
    (state) => state.activeClaimTreeId === null && state.activeTableProblemId !== null
  );
};

export const useClaimTreesWithExplicitClaims = () => {
  return useTopicStore((state) => {
    const rootNodes = state.nodes.filter(
      (node) => node.type === "rootClaim" && state.edges.some((edge) => edge.source === node.id)
    );

    return rootNodes.map(
      (node) => [node.data.arguedDiagramPartId, node.data.label] as [string, string]
    );
  });
};

export const useShowImpliedEdges = () => {
  return useTopicStore((state) => state.showImpliedEdges);
};
