import { ReactFlow, Controls, type NodeOrigin, Panel } from "@xyflow/react";

// we have to import the React Flow styles for it to work
import "@xyflow/react/dist/style.css";
import useStore, { type RFState } from "./store.ts";
import { shallow } from "zustand/vanilla/shallow";

import SequenceNode from "../components/sequence-node/sequence-node.tsx";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
});

// this places the node origin in the center of a node
const nodeOrigin: NodeOrigin = [0.5, 0.5];

//custom node
const nodeTypes = {
  custom: SequenceNode,
};

const Flow = () => {
  //whenever you use multiple values, you should use shallow to make sure the component only re-renders when one of the values changes
  const { nodes, edges, onNodesChange, onEdgesChange } = useStore(
    selector,
    shallow,
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeOrigin={nodeOrigin}
      fitView
    >
      <Controls showInteractive={false} />
      <Panel position="top-left">
        Proteoform graph visualization with React Flow library
      </Panel>
    </ReactFlow>
  );
};

export default Flow;
