import {
  ReactFlow,
  type NodeOrigin,
  Panel,
  type NodeMouseHandler,
} from "@xyflow/react";

// we have to import the React Flow styles for it to work
import "@xyflow/react/dist/style.css";
import useGraphStore, { type RFState } from "./store.ts";
import { shallow } from "zustand/vanilla/shallow";

import SequenceNode from "../components/sequence-node/sequence-node.tsx";
import { useCallback, useState } from "react";
import type { SequenceNodeProps } from "../components/sequence-node/sequence-node.props.tsx";
import GraphControls from "./controls.tsx";
import { useFocusHandlers } from "../controls/focus-node/focus-utils.ts";
import { layoutModes, nodeTypes, nodeWidthModes } from "../theme/types.tsx";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  nodeWidthMode: state.nodeWidthMode,
  setNodeWidthMode: state.setNodeWidthMode,
  layoutMode: state.layoutMode,
  setLayoutMode: state.setLayoutMode,
});

// this places the node origin in the center of a node
const nodeOrigin: NodeOrigin = [0.5, 0.5];
const myNodeTypes = {
  [nodeTypes.SequenceNode]: SequenceNode,
};

const Flow = () => {
  //whenever you use multiple values, you should use shallow to make sure the component only re-renders when one of the values changes
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    nodeWidthMode,
    setNodeWidthMode,
    layoutMode,
    setLayoutMode,
  } = useGraphStore(selector, shallow);
  const [focusedNode, setFocusedNode] = useState<SequenceNodeProps>();
  const { focusNode, onFocusNextNode, onFocusPreviousNode } = useFocusHandlers(
    nodes,
    setFocusedNode,
  );

  const toggleNodeWidthMode = () => {
    setNodeWidthMode(
      nodeWidthMode === nodeWidthModes.Collapsed
        ? nodeWidthModes.Expanded
        : nodeWidthModes.Collapsed,
    );
  };

  const toggleSnakeLayout = () => {
    console.log("Toggle snake layout", layoutMode);
    setLayoutMode(
      layoutMode === layoutModes.Basic ? layoutModes.Snake : layoutModes.Basic,
    );
  };

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      focusNode(node as SequenceNodeProps);
    },
    [focusNode],
  );

  const fitViewOptions = {
    minZoom: 0.4,
    maxZoom: 1,
    nodes: nodes.slice(0, 3),
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={myNodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeOrigin={nodeOrigin}
      minZoom={0.05}
      width={100}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={fitViewOptions}
    >
      <GraphControls
        onFocusNextNode={() => onFocusNextNode(focusedNode)}
        onFocusPreviousNode={() => onFocusPreviousNode(focusedNode)}
        onFocusCurrentNode={() => {
          if (focusedNode) {
            focusNode(focusedNode);
          }
        }}
        toggleNodeWidthMode={() => {
          void toggleNodeWidthMode();
        }}
        toggleSnakeLayout={() => {
          void toggleSnakeLayout();
        }}
      />
      <Panel position="top-left">
        Proteoform graph visualization with React Flow library
      </Panel>
      {/* TODO add Zoom settings here after tailwind and shadcn configuration*/}
    </ReactFlow>
  );
};

export default Flow;
