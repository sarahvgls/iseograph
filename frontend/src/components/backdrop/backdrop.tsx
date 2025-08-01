import { StyledSection } from "../base-components";
import styled from "styled-components";

const InfoBox = styled(StyledSection)`
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  background-color: #f9f9f9;
  padding: 30px;
`;

const StyledHeader = styled.h2`
  text-align: center;
  margin-bottom: 16px;
  color: #333;
`;

export const SettingsBackdrop = ({
  isSettingsOpen,
  setIsSettingsOpen,
  startUpInfo = false,
}: {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  startUpInfo?: boolean;
}) => {
  return (
    <div>
      {isSettingsOpen && (
        <div>
          {startUpInfo && (
            <InfoBox>
              <StyledHeader>
                No protein data has been loaded into the graph.
              </StyledHeader>
              <h3>Please select a new protein here:</h3>
            </InfoBox>
          )}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 999,
            }}
            onClick={() => setIsSettingsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export const LoadingBackdrop = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <div>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1>Loading...</h1>
        </div>
      )}
    </div>
  );
};
