import { apiRequest } from "./apiClient";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && typeof value !== "undefined"),
  );

export const fetchPipeDashboardStatus = ({ projectId, signal }) =>
  apiRequest({ url: "pipe-laying/status", method: "GET", params: { projectId }, signal });

export const fetchPipeSegments = ({ projectId, material, signal }) =>
  apiRequest({ url: "pipe-laying/segments/options", method: "GET", params: cleanParams({ projectId, material }), signal });

export const fetchPipeDailyWorks = ({ signal, ...params }) =>
  apiRequest({ url: "pipe-laying/works", method: "GET", params: cleanParams(params), signal });

export const fetchPipeWorkFilterOptions = ({ signal, ...params }) =>
  apiRequest({ url: "pipe-laying/works/filter-options", method: "GET", params: cleanParams(params), signal });

export const fetchPipeContractors = ({ type = "PIPE_NETWORK_LAYING", signal }) =>
  apiRequest({ url: "contractors", method: "GET", params: { type }, signal });

export const createPipeDailyWork = (payload) =>
  apiRequest({ url: "pipe-laying/works", method: "POST", data: payload });

export const updatePipeDailyWork = (workId, payload) =>
  apiRequest({ url: `pipe-laying/works/${workId}`, method: "PATCH", data: payload });

export const deletePipeDailyWork = (workId) =>
  apiRequest({ url: `pipe-laying/works/${workId}`, method: "DELETE" });

export const fetchPipeChecklistProcesses = ({ signal } = {}) =>
  apiRequest({ url: "pipe-laying-checklist/processes", method: "GET", signal });

export const fetchPipeChecklistMasters = ({ material, processCode, signal }) =>
  apiRequest({
    url: "pipe-laying-checklist/masters",
    method: "GET",
    params: cleanParams({ material, processCode }),
    signal,
  });

export const createPipeChecklistPackage = (payload) =>
  apiRequest({ url: "pipe-laying-checklist/packages", method: "POST", data: payload });

export const fetchPipeChecklistPackages = ({ signal, ...params }) =>
  apiRequest({
    url: "pipe-laying-checklist/packages",
    method: "GET",
    params: cleanParams(params),
    signal,
  });

export const submitPipeChecklist = ({ payload, files = {} }) => {
  const fileEntries = Object.entries(files).flatMap(([checklistId, value]) => {
    const uris = Array.isArray(value) ? value : [value];
    return uris.filter(Boolean).map((uri) => [checklistId, uri]);
  });
  if (!fileEntries.length) {
    return apiRequest({ url: "pipe-laying-checklist/submissions", method: "POST", data: payload });
  }

  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  fileEntries.forEach(([checklistId, uri]) => {
    const name = String(uri).split("/").pop()?.split("?")[0] || `${checklistId}.jpg`;
    form.append(String(checklistId), { uri, name, type: "image/jpeg" });
  });
  return apiRequest({
    url: "pipe-laying-checklist/submissions",
    method: "POST",
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const fetchPipeWorkStatus = ({ signal, ...params }) =>
  apiRequest({
    url: "pipe-laying-checklist/request-status",
    method: "GET",
    params: cleanParams(params),
    signal,
  });

export const fetchPipeSubmission = ({ submissionId, signal }) =>
  apiRequest({ url: `pipe-laying-checklist/submissions/${submissionId}`, method: "GET", signal });

export const updatePipeSubmissionWorkflow = ({ submissionId, action, remark }) =>
  apiRequest({
    url: `pipe-laying-checklist/submissions/${submissionId}/workflow-status`,
    method: "PATCH",
    data: cleanParams({ action, remark }),
  });
