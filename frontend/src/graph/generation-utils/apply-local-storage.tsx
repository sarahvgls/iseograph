import {
  ColorScaleOptions,
  glowMethods,
  intensityMethods,
  labelVisibilities,
  layoutModes,
  localStorageKeys,
  nodeWidthModes,
  settingsKeysToTypes,
} from "../../theme/types.tsx";
import useGraphStore from "../store.ts";

export const applyLocalStorageValues = (
  setSelectedFile: (file: string) => void,
) => {
  for (const key of Object.keys(localStorageKeys)) {
    if (Object.keys(settingsKeysToTypes).includes(key)) {
      //special values
      if (key === localStorageKeys.selectedFile) {
        setSelectedFile(localStorage.getItem(key) || "");
        continue;
      }

      // general values
      const type = settingsKeysToTypes[key];

      if (type === "number") {
        const savedNumericValue = localStorage.getItem(key);
        if (savedNumericValue) {
          const parsedValue = parseInt(savedNumericValue, 10);
          if (!isNaN(parsedValue)) {
            useGraphStore.setState({ [key]: parsedValue });
          } else {
            console.error(`Error parsing local storage value for ${key}`);
          }
        }
      } else if (type === "boolean") {
        const savedBooleanValue = localStorage.getItem(key);
        try {
          if (savedBooleanValue && key === localStorageKeys.isAnimated) {
            // special case: rerendering of edges if animation changes
            useGraphStore
              .getState()
              .setIsAnimated(savedBooleanValue === "true");
          }
          if (savedBooleanValue) {
            useGraphStore.setState({ [key]: savedBooleanValue === "true" });
          }
        } catch (error) {
          console.error(
            `Error parsing local storage value for ${key}: ${error}`,
          );
        }
      } else if (type === "string") {
        const savedStringValue = localStorage.getItem(key);
        if (savedStringValue) {
          useGraphStore.setState({ [key]: savedStringValue });
        }
      } else if (type === "JSON") {
        const savedJSONValue = localStorage.getItem(key);
        if (savedJSONValue) {
          try {
            const parsedJSONValue = JSON.parse(savedJSONValue);
            useGraphStore.setState({ [key]: parsedJSONValue });
          } catch (error) {
            console.error(
              `Error parsing local storage value for ${key}: ${error}`,
            );
          }
        }
      } else if (
        type === nodeWidthModes ||
        type === layoutModes ||
        type === labelVisibilities ||
        type === ColorScaleOptions ||
        type === glowMethods ||
        type === intensityMethods
      ) {
        const savedValue = localStorage.getItem(key);
        if (savedValue && Object.values(type).includes(savedValue)) {
          useGraphStore.setState({ [key]: savedValue });
          if (
            key === localStorageKeys.glowMethod &&
            savedValue === glowMethods.intensity
          ) {
            useGraphStore.setState({ isPeptideMenuFullSize: true });
          }
        } else {
          console.warn(
            `Invalid value for ${key} in local storage: ${savedValue}`,
          );
        }
      } else {
        console.warn(
          `Unexpected type for key ${key}: ${type}. Expected a primitive type or a known enum.`,
        );
      }
    } else {
      console.warn(
        `Key ${key} not found in settingsKeysToTypes. Skipping application.`,
      );
    }
  }
};
