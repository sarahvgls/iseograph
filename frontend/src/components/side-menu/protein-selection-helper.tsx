import { callApi } from "../../helper/api-call.ts";

export const getFileNames = async (
  setFileNames: (names: string[]) => void,
): Promise<string[]> => {
  const response = await callApi("api/get_available_files/");
  if (!response.success) {
    console.error("Failed to fetch file names");
    return [];
  } else {
    const names = response.data || [];

    setFileNames(names);
    return names;
  }
};
