import { apiRequest } from "./apiClient";

// Paths are relative to the existing authenticated client's versioned base URL.
export const fetchPipeSegments = ({ projectId, signal }) =>
  apiRequest({
    url: "pipe-laying/segments/options",
    method: "GET",
    params: { projectId },
    signal,
  });

export const fetchPipeDailyWorks = ({ projectId, signal, page, limit, fromDate, toDate }) =>
  apiRequest({
    url: "pipe-laying/works",
    method: "GET",
    params: { projectId, page, limit, fromDate: fromDate || undefined, toDate: toDate || undefined },
    signal,
  });

export const fetchPipeContractors = ({ type, signal }) => {
  if (!type) throw new Error("Pipe laying contractor type is required.");
  return apiRequest({
    url: "contractors/manage",
    method: "GET",
    params: { type },
    signal,
  });
};

export const createPipeDailyWork = (payload) =>
  apiRequest({
    url: "pipe-laying/works",
    method: "POST",
    data: payload,
  });
