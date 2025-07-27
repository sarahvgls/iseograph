import styled from "styled-components";
import { Panel } from "@xyflow/react";
import useGraphStore from "../../graph/store.ts";

export const StyledSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

export const StyledSectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 8px;
`;

export const StyledSectionTitleWithButton = ({
  setIsOpen,
  title,
}: {
  setIsOpen: (isOpen: boolean) => void;
  title: string;
}) => {
  return (
    <StyledSectionTitle>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>{title}</div>
        <button
          style={{ border: "none", height: "30px" }}
          onClick={() => {
            setIsOpen(false);
            useGraphStore.setState({ shouldShiftButtons: false });
          }}
        >{`>>`}</button>
      </div>
    </StyledSectionTitle>
  );
};

export const StyledLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
`;

export const BoldStyledLabel = styled(StyledLabel)`
  font-weight: 600;
`;

export const StyledDropdown = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 14px;
`;

export const StyledSlimmDropdown = styled.select`
  width: 100%;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 12px;
`;

export const StyledInputTextField = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 14px;
  margin-bottom: 10px;
`;

export const PrimaryButton = styled.button`
  padding: 10px 16px;
  background-color: #076997;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  width: 100%;
`;

export const SecondaryButton = styled.button`
  padding: 8px 12px;
  background-color: #e9ecef;
  color: #495057;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
`;

export const FlexRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StyledPanel = styled(Panel)`
  pointer-events: none !important;
`;

export const CloseButton = ({ onClose }: { onClose: () => void }) => {
  return (
    <button
      onClick={onClose}
      style={{
        border: "none",
        cursor: "pointer",
        color: "#666",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
      onMouseOut={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      ✕
    </button>
  );
};

export const SettingsBorder = styled.div`
  margin: 20px 0 8px 0px;
  border-left: 4px solid #d6d6d6;
  border-bottom-left-radius: 5px;
  border-top-left-radius: 5px;
  padding-left: 5px;
`;
