import { IconButton } from "../icon";

import styled from "styled-components";

const Container = styled.div`
  padding: 10px;
  display: flex;
  align-items: center;
  position: fixed;
  right: 170px;
  bottom: calc(100vh - 80px);
  width: 45px;
  max-height: 45px;
`;

export const CaptureButton = ({
  toggleCapture,
  testId,
}: {
  toggleCapture: () => void;
  testId?: string;
}) => {
  return (
    <Container>
      <IconButton
        icon={"capture"}
        data-testid={testId || "capture-button"}
        onClick={() => toggleCapture()}
        style={{
          background: "#dfdfdf",
          padding: "8px 8px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      />
    </Container>
  );
};
