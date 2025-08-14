import styled from "styled-components";

export const MenuStackContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  pointer-events: none;
  gap: 15px;
`;

export const GraphContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
`;

export const GraphSection = styled.div<{
  isTop?: boolean;
  isDualMode?: boolean;
}>`
  flex: 1;
  position: relative;
  border-bottom: ${(props) =>
    props.isDualMode && props.isTop ? "8px solid #ccc" : "none"};
  display: ${(props) => (!props.isDualMode && !props.isTop ? "none" : "block")};
`;

export const GraphLabel = styled.div<{ isDualMode?: boolean }>`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
  z-index: 50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  display: ${(props) => (props.isDualMode ? "block" : "none")};
`;

export const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
`;
