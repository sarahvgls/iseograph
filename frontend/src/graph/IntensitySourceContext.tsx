// IntensitySourceContext.tsx
import React, { createContext, useContext } from "react";

interface IntensitySourceContextValue {
  currentIntensitySource: string;
  isSecondaryGraph?: boolean;
}

const IntensitySourceContext = createContext<IntensitySourceContextValue>({
  currentIntensitySource: "",
  isSecondaryGraph: false,
});

export const useIntensitySource = () => useContext(IntensitySourceContext);

export const IntensitySourceProvider: React.FC<{
  children: React.ReactNode;
  intensitySource: string;
  isSecondaryGraph?: boolean;
}> = ({ children, intensitySource, isSecondaryGraph = false }) => {
  return (
    <IntensitySourceContext.Provider
      value={{
        currentIntensitySource: intensitySource,
        isSecondaryGraph,
      }}
    >
      {children}
    </IntensitySourceContext.Provider>
  );
};
