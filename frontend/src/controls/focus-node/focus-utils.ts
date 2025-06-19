import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { focusNextNode, focusPreviousNode } from "./index.tsx";
import { theme } from "../../theme";
import { nodeTypes, type NodeTypes } from "../../theme/types.tsx";

export const useFocusHandlers = (
  nodes: NodeTypes[],
  setFocusedNode: (node: SequenceNodeProps) => void,
) => {
  const { setCenter, getInternalNode, setNodes, getNodes } = useReactFlow();

  const focusNode = useCallback(
    (node: NodeTypes) => {
      if (node.type !== nodeTypes.SequenceNode) {
        console.warn("Node is not a custom sequence node:", node);
        return null;
      }
      if (theme.debugMode) {
        console.log("Focusing node:", node);
      }
      setFocusedNode(node as SequenceNodeProps);
      const internalNode = getInternalNode(node.id);
      if (!internalNode) {
        return null;
      }

      const absPosition = internalNode?.internals.positionAbsolute;
      const correctedPosition = {
        x: absPosition.x + (internalNode.measured.width ?? 0) / 2,
        y: absPosition.y + (internalNode.measured.height ?? 0) / 2,
      };

      setCenter(correctedPosition.x, correctedPosition.y, {
        zoom: 1,
        duration: 800,
      });
      if (theme.debugMode) {
        console.log("Set center to:", correctedPosition);
      }
    },
    [setCenter, setFocusedNode, getInternalNode],
  );

  const onFocusNextNode = useCallback(
    (focusedNode: SequenceNodeProps | undefined) => {
      const nextNode = focusNextNode(focusedNode as SequenceNodeProps, nodes);
      if (nextNode) {
        setNodes(
          getNodes().map((node) => {
            node.selected = node.id === nextNode.id;
            return node;
          }),
        );

        focusNode(nextNode);
      }
    },
    [nodes, focusNode, getInternalNode],
  );

  const onFocusPreviousNode = useCallback(
    (focusedNode: SequenceNodeProps | undefined) => {
      const prevNode = focusPreviousNode(
        focusedNode as SequenceNodeProps,
        nodes,
      );
      if (prevNode) {
        setNodes(
          getNodes().map((node) => {
            node.selected = node.id === prevNode.id;
            return node;
          }),
        );

        focusNode(prevNode);
      }
    },
    [nodes, focusNode],
  );

  return { focusNode, onFocusNextNode, onFocusPreviousNode };
};
