import { useCallback } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import type { SequenceNodeProps } from "../../components/sequence-node/sequence-node.props.tsx";
import { focusNextNode, focusPreviousNode } from "./index.tsx";
import { theme } from "../../theme";

// TODO think about using "origin x" to not have moved nodes alter the result

export const useFocusHandlers = (
  nodes: SequenceNodeProps[],
  setFocusedNode: (node: SequenceNodeProps) => void,
) => {
  const { setCenter } = useReactFlow();
  const viewport = useViewport();

  const focusNode = useCallback(
    (node: SequenceNodeProps) => {
      if (theme.debugMode) {
        console.log("Focusing node:", node);
      }
      setFocusedNode(node);
      setCenter(node.position.x, node.position.y, {
        zoom: 1,
        duration: 800,
      });
    },
    [setCenter, setFocusedNode],
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
    [nodes, focusNode, viewport],
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
    [nodes, focusNode, viewport],
  );

  return { focusNode, onFocusNextNode, onFocusPreviousNode };
};
