// ----- functions for layouting nodes and edges -----
import { type Edge, type InternalNode } from "@xyflow/react";
import {
  layoutModes,
  nodeTypes,
  type NodeTypes,
  nodeWidthModes,
} from "../../theme/types.tsx";
import Dagre from "@dagrejs/dagre";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { theme } from "../../theme";
import { applySnakeLayout } from "./snake-layout.tsx";
import useGraphStore from "../store.ts";

const applyBasicLayoutDagre = (
  nodes: NodeTypes[],
  edges: Edge[],
  nodeWidthMode: nodeWidthModes,
  options: { direction: string },
): [NodeTypes[], Edge[]] => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction,
    ranksep: 60,
    nodesep: 50,
    align: "UL",
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => {
    if (node.type !== nodeTypes.SequenceNode) {
      return;
    }
    const sequence: string = node.data.sequence as string;
    const sequenceLength = sequence.length * 12 + 100; // 12 is the approximated width of each character, plus 50px on each side

    g.setNode(node.id, {
      ...node,
      width:
        nodeWidthMode === nodeWidthModes.Collapsed
          ? theme.offsets.largeWidth
          : sequenceLength,
      height: theme.offsets.defaultLength,
    });
  });

  Dagre.layout(g);

  return [
    nodes.map((node) => {
      if (node.type !== nodeTypes.SequenceNode) {
        return node;
      }
      const position = g.node(node.id);
      //let sequence = "";

      try {
        // take the x coordinate from dagre layout but adjust y coordinate later
        //sequence = node.data.sequence as string;
      } catch (error) {
        console.error("Error in layouting node:", node.id, error);
        return node; // return original node if layout fails
      }

      return {
        ...node,
        position: { x: position.x, y: 0 },
      } as SequenceNodeProps;
    }),
    edges,
  ];
};

function addSymmetricalOffsetForVariations(
  nodes: NodeTypes[],
  edges: Edge[],
): [NodeTypes[], Edge[]] {
  const spacing = theme.debugMode
    ? theme.offsets.debugYSpacingBetweenNodes
    : theme.offsets.defaultYSpacingBetweenNodes; // vertical distance between variations
  const sourceToTargets: Record<
    string,
    { positionId: number; targets: string[] }
  > = {};

  edges.forEach(({ source, target }) => {
    if (!sourceToTargets[source]) {
      sourceToTargets[source] = { positionId: -1, targets: [] };
    }
    if (!sourceToTargets[target]) {
      sourceToTargets[target] = { positionId: -1, targets: [] };
    }
    sourceToTargets[source].targets.push(target);
  });

  const firstSequenceNode = nodes.find(
    (node) => node.type === nodeTypes.SequenceNode,
  );
  if (!firstSequenceNode) {
    console.warn("No sequence node found, skipping layout adjustment.");
    return [nodes, edges];
  }
  let parentIdStack = [firstSequenceNode.id];
  sourceToTargets[firstSequenceNode.id].positionId = 0;

  // loop through all nodes and assign positionId
  while (parentIdStack.length > 0) {
    for (const parent of parentIdStack) {
      //remove parent from stack
      parentIdStack = parentIdStack.filter((id) => id !== parent);

      const children = sourceToTargets[parent].targets;
      if (children.length === 0) break;
      for (const childId of children) {
        sourceToTargets[childId].positionId =
          sourceToTargets[parent].positionId + 1;
        if (!parentIdStack.includes(childId)) {
          parentIdStack.push(childId);
        }
      }
    }
  }

  const alteredNodes = nodes.map((node) => {
    const parent = Object.entries(sourceToTargets).find(([, targets]) =>
      targets.targets.includes(node.id),
    );
    if (!parent) return node;

    const siblings = parent[1].targets;
    // sort siblings by node.data.intensity
    siblings.sort(
      (a, b) =>
        ((nodes.find((n) => n.id === b)?.data.intensity as number) ?? 0) -
        ((nodes.find((n) => n.id === a)?.data.intensity as number) ?? 0),
    );
    const intensityIndex = siblings.indexOf(node.id);
    const positionIndex = sourceToTargets[node.id].positionId;

    const yOffset = (intensityIndex - (siblings.length - 1) / 2) * spacing;
    const xOffset = theme.offsets.useXOffset ? intensityIndex * 50 : 0;

    return {
      ...node,
      position: {
        x: node.position.x + xOffset,
        y: node.position.y + yOffset,
      },
      data: {
        ...node.data,
        positionIndex: positionIndex,
        intensityRank: intensityIndex,
      },
    };
  });
  return [alteredNodes, edges];
}

export const applyLayout = (
  nodes: NodeTypes[],
  edges: Edge[],
  nodeWidthMode: nodeWidthModes,
  layoutMode: layoutModes,
  getInternalNode: ((id: string) => InternalNode | undefined) | null,
): [NodeTypes[], Edge[]] => {
  console.log("Applying layout with ndoe mode:", nodeWidthMode);
  useGraphStore.getState().resetIsReversedStore();

  // remove groups and reset layouting properties
  let filteredNodes = nodes
    .filter((node) => node.type === nodeTypes.SequenceNode)
    .map((node) => ({
      ...node,
      parentId: undefined,
      extent: undefined,
      data: {
        ...node.data,
        positionIndex: 0,
        intensityRank: 0,
        isReversed: false, // Reset isReversed
      },
    }));

  let [layoutedNodes, layoutedEdges] = applyBasicLayoutDagre(
    filteredNodes,
    edges,
    nodeWidthMode,
    {
      direction: theme.layout.basic.direction,
    },
  );

  [layoutedNodes, layoutedEdges] = addSymmetricalOffsetForVariations(
    layoutedNodes,
    layoutedEdges,
  );
  console.log("Layouted nodes after basic layout:", layoutedNodes);

  if (layoutMode == layoutModes.Snake) {
    [layoutedNodes, layoutedEdges] = applySnakeLayout(
      layoutedNodes,
      layoutedEdges,
      getInternalNode,
    );
  }

  const getIsReversedStore = useGraphStore.getState().getIsReversedStore;
  layoutedNodes = layoutedNodes.map((node) => {
    if (node.type === nodeTypes.SequenceNode) {
      const isReversed = getIsReversedStore(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          isReversed,
        },
      };
    }
    return node;
  });

  return [layoutedNodes, layoutedEdges];
};
