import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { createWithEqualityFn } from "zustand/traditional";

import nodes from "../../../generated/nodes.json";
import edges from "../../../generated/edges.json";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import { theme } from "../theme";
import {
  type layoutModes,
  type NodeTypes,
  nodeTypes,
  nodeWidthModes,
} from "../theme/types.tsx";
import { applyLayout } from "./layout/layout.tsx";

export type RFState = {
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeWidthMode: nodeWidthModes;
  setNodeWidthMode: (nodeWidthMode: nodeWidthModes) => void;
  layoutMode: layoutModes;
  setLayoutMode: (layoutMode: layoutModes) => void;
  isReversedStore: Record<string, boolean>;
  setIsReversedStore: (nodeId: string, isReversed: boolean) => void;
  getIsReversedStore: (nodeId: string) => boolean;
  resetIsReversedStore: () => void;
  updateIsReversed: (nodeId: string, isReversed: boolean) => void;
};

// create nodes of type sequence node for each node in the nodes.json file
const createNodes = (nodes: SequenceNodeProps[]): SequenceNodeProps[] => {
  return nodes.map((node) => ({
    ...node,
    type: nodeTypes.SequenceNode,
    data: {
      sequence: node.data.sequence,
      intensity: node.data.intensity,
      feature: node.data.feature,
      visualWidth: node.data.visualWidth || 0, // default to 0 if not provided
      positionIndex: 0,
      intensityRank: 0,
    },
  }));
};

// ----- create nodes -----
const customNodes: SequenceNodeProps[] = createNodes(
  nodes as SequenceNodeProps[],
);
const customEdges: Edge[] = edges;

// const [layoutedNodes, layoutedEdges] = applyLayout(
//   customNodes,
//   customEdges,
//   theme.layout.nodeWidthMode,
//   theme.layout.mode,
// );

const useGraphStore = createWithEqualityFn<RFState>((set, get) => ({
  nodes: customNodes,
  setNodes: (nodes: Node[]) => {
    set({
      nodes: nodes,
    });
  },
  edges: customEdges,
  nodeWidthMode: theme.layout.nodeWidthMode,
  layoutMode: theme.layout.mode,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  setLayoutMode: (layoutMode: layoutModes) => {
    set({ layoutMode });

    const { nodes, edges } = get();
    const state = get();

    // Apply layout
    const [layoutedNodes, layoutedEdges] = applyLayout(
      nodes,
      edges,
      state.nodeWidthMode,
      layoutMode,
    );

    // Set nodes and edges directly - no need for temporary IDs
    set({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
  },
  setNodeWidthMode: (nodeWidthMode: nodeWidthModes) => {
    set({
      nodeWidthMode: nodeWidthMode,
    });
    const { nodes, edges } = get();
    const state = get();
    const [layoutedNodes, layoutedEdges] = applyLayout(
      nodes,
      edges,
      state.nodeWidthMode,
      state.layoutMode,
    );
    set({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });
  },
  /*setLayoutMode: (layoutMode: layoutModes) => {
      set({
        layoutMode,
      });
      const { nodes, edges } = get();
      const state = get();
      const [layoutedNodes, layoutedEdges] = applyLayout(
        nodes,
        edges,
        state.nodeWidthMode,
        state.layoutMode,
      );
      console.log("nodes that are set:", layoutedNodes);
  
      // console.log("iSreveresedSTore:", get().isReversedStore);
      // console.log("n40", get().getIsReversedStore("n40"));
      //const getIsReversedStore = get().getIsReversedStore;
      // const isReversedStore = stateAfterLayout.isReversedStore;
      // set({
      //   nodes: layoutedNodes.map((node) => {
      //     if (node.type === nodeTypes.SequenceNode && node.id) {
      //       return {
      //         ...node,
      //         data: {
      //           ...node.data,
      //           positionIndex: 0,
      //           intensityRank: 0,
      //           isReversed: getIsReveresedStore(node.id),
      //         },
      //       } as SequenceNodeProps;
      //     } else {
      //       return node; // return the node as is if id is empty
      //     }
      //   }),
      //   edges: layoutedEdges,
      // });
  
      // const updatedNodes = layoutedNodes.map((node) => {
      //   if (node.type === nodeTypes.SequenceNode && node.id) {
      //     const isReversed = getIsReversedStore(node.id);
      //     return {
      //       ...node,
      //       data: {
      //         ...node.data,
      //         isReversed,
      //       },
      //     } as SequenceNodeProps;
      //   }
      //   return { ...node }; // Ensure all nodes are recreated
      // });
  
      console.log("reversedStore", get().isReversedStore);
      // STORE IS WRONG
  
      //manually re render nodes
      let rerenderedNodes: NodeTypes[] = [];
      for (const node of layoutedNodes) {
        let newNode: NodeTypes;
        if (node.type === nodeTypes.SequenceNode && node.id) {
          const newNodeId = node.id + "-rerendered"; // Create a new ID to force React Flow to re-render the node
          newNode = {
            ...node,
            id: newNodeId,
          }; // Ensure a new object is created
          const isReversed = get().getIsReversedStore(node.id) || false;
          newNode.data = {
            ...newNode.data,
            isReversed,
            positionIndex: 0, // reset positionIndex
            intensityRank: 0, // reset intensityRank
          };
        } else {
          newNode = { ...node }; // Ensure all nodes are recreated
        }
        rerenderedNodes.push(newNode);
      }
  
      set({
        nodes: rerenderedNodes,
      });
  
      //change back id
      rerenderedNodes = rerenderedNodes.map((node) => {
        if (
          node.type === nodeTypes.SequenceNode &&
          node.id.endsWith("-rerendered")
        ) {
          return { ...node, id: node.id.replace("-rerendered", "") };
        }
        return node;
      });
  
      set({
        nodes: rerenderedNodes,
        edges: layoutedEdges,
      });
  
      //log nodes that are reveresed:
      for (const rerenderedNode of rerenderedNodes) {
        if (rerenderedNode.data.isReversed === true) {
          console.log("reverse:", rerenderedNode.id);
        }
      }
    },*/
  isReversedStore: Object.fromEntries(
    customNodes.map((node) => [node.id, false]),
  ),
  setIsReversedStore: (nodeId: string, isReversed: boolean) =>
    set((state) => ({
      isReversedStore: {
        ...state.isReversedStore,
        [nodeId]: isReversed,
      },
    })),
  getIsReversedStore: (nodeId: string) =>
    get().isReversedStore[nodeId] || false,
  resetIsReversedStore: () =>
    set({
      isReversedStore: Object.fromEntries(
        customNodes.map((node) => [node.id, false]),
      ),
    }),
  updateIsReversed: (nodeId: string, isReversed: boolean) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId && node.type === nodeTypes.SequenceNode) {
          // it's important to create a new object here, to inform React Flow about the changes
          return { ...node, data: { ...node.data, isReversed } };
        }

        return node;
      }),
    });
  },
}));

console.log(
  "useGraphStore initialized with nodes:",
  useGraphStore.getState().nodes,
);

export default useGraphStore;
