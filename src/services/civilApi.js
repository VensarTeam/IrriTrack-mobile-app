import { apiRequest } from "./apiClient";
export const fetchCivilRegister = async ({ projectId, signal }) => {
  const data = await apiRequest({ url: `civil-structure/${encodeURIComponent(projectId)}`, method: "GET", signal });
  if (!data || data.projectId !== projectId || !Array.isArray(data.groups)) throw new Error("Civil status response is unavailable. Please retry.");
  return data;
};
