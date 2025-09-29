import { API_ROOT } from "./constants";

export async function ensureCSRFToken() {
  const response = await fetch(`${API_ROOT}get_csrf_token/`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch CSRF token");
  const data = await response.json();
  return data.csrfToken;
}

export const callApiWithParameters = async (
  url: string,
  parameters: Record<
    string,
    string | boolean | string[] | number | File | Record<string, string>
  >,
  responseType: "json" | "blob" = "json",
) => {
  try {
    const csrfToken = await ensureCSRFToken();

    if (!csrfToken) {
      throw new Error("CSRF token not found.");
    }
    const response = await fetch(`${API_ROOT}${url}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(parameters),
    });

    if (responseType === "blob") {
      return await response.blob();
    } else {
      return await response.json();
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export const callApi = async (url: string) => {
  try {
    const response = await fetch(`${API_ROOT}${url}`);

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
