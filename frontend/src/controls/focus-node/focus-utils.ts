import { useCallback } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { focusNextNode, focusPreviousNode } from "./index.tsx";

export const useFocusHandlers = (
  nodes: SequenceNodeProps[],
  setFocusedNode: (node: SequenceNodeProps) => void,
) => {
  const { setCenter } = useReactFlow();
  const viewport = useViewport();

  const focusNode = useCallback(
    (node: SequenceNodeProps) => {
      setFocusedNode(node);
      setCenter(node.position.x, node.position.y, {
        zoom: 1,
        duration: 800,
      });
    },
    [setCenter],
  );

  const onFocusNextNode = useCallback(
    (focusedNode: SequenceNodeProps | undefined) => {
      const nextNode = focusNextNode(
        focusedNode as SequenceNodeProps,
        nodes,
        viewport,
      );
      if (nextNode) {
        focusNode(nextNode);
      }
    },
    [nodes, focusNode],
  );

  const onFocusPreviousNode = useCallback(
    (focusedNode: SequenceNodeProps | undefined) => {
      const prevNode = focusPreviousNode(
        focusedNode as SequenceNodeProps,
        nodes,
        viewport,
      );
      if (prevNode) {
        focusNode(prevNode);
      }
    },
    [nodes, focusNode],
  );

  return { focusNode, onFocusNextNode, onFocusPreviousNode };
};
