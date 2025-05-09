import {
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { createWithEqualityFn } from "zustand/traditional";

import nodes from "../../../generated/nodes.json";
import edges from "../../../generated/edges.json";

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
};

const useStore = createWithEqualityFn<RFState>((set, get) => ({
  nodes: nodes,
  //[
  // {
  //   id: "root",
  //   type: "custom",
  //   data: {
  //     sequence:
  //       "React Flow Mind123456789101112131415161718192021222324252627282930",
  //     intensity: 4,
  //   },
  //   position: { x: 0, y: -100 },
  // },
  // {
  //   id: "root2",
  //   type: "custom",
  //   data: { sequence: "React Flow", intensity: 2 },
  //   position: { x: 100, y: 0 },
  // },
  // {
  //   id: "root3",
  //   type: "custom",
  //   data: { sequence: "React Flow", intensity: 2 },
  //   position: { x: 200, y: 0 },
  // },
  // {
  //   id: "root4",
  //   type: "custom",
  //   data: { sequence: "React Flow", intensity: 2 },
  //   position: { x: 300, y: 0 },
  // },
  // {
  //   id: "root5",
  //   type: "custom",
  //   data: { sequence: "React Flow", intensity: 2 },
  //   position: { x: 400, y: 0 },
  // },
  //],
  edges: edges,
  //[
  //   {
  //     id: "e1-2",
  //     source: "root",
  //     target: "root2",
  //     type: "custom",
  //   },
  //   {
  //     id: "e2-3",
  //     source: "root2",
  //     target: "root3",
  //     type: "custom",
  //   },
  //   {
  //     id: "e3-4",
  //     source: "root3",
  //     target: "root4",
  //     type: "custom",
  //   },
  //   {
  //     id: "e4-5",
  //     source: "root4",
  //     target: "root5",
  //     type: "custom",
  //   },
  // ],
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
}));

export default useStore;
