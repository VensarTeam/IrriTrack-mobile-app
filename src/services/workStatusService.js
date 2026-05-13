import { API_ENDPOINTS, buildApiEndpointPath } from "../config/env";
import { apiRequest } from "./apiClient";
import {
  getCachedOmsWorkStatus,
  saveCachedOmsWorkStatus,
} from "./workStatusOfflineStore";

const createEmptyWorkStatusResponse = () => ({
  counts: {
    total: 0,
    submitted: 0,
    verified: 0,
    approved: 0,
    rejected: 0,
  },
  items: [],
});

const shouldFallbackToCachedWorkStatus = (error) =>
  error?.code === "NETWORK_ERROR" ||
  error?.status === 0 ||
  error?.message === "Network Error";

const normalizeWorkStatusResponse = (response) => {
  const payload =
    response && typeof response === "object" ? response : createEmptyWorkStatusResponse();

  return {
    counts: {
      ...createEmptyWorkStatusResponse().counts,
      ...(payload.counts || {}),
    },
    items: Array.isArray(payload.items) ? payload.items : [],
  };
};

const createEmptySubmissionHistoryResponse = () => ({
  submissionId: "",
  currentStatus: "",
  rejectionCount: 0,
  history: [],
});

const normalizeSubmissionHistoryResponse = (response) => {
  const payload =
    response && typeof response === "object"
      ? response
      : createEmptySubmissionHistoryResponse();

  return {
    submissionId: String(payload.submissionId || "").trim(),
    currentStatus: String(payload.currentStatus || "").trim().toLowerCase(),
    rejectionCount: Number(payload.rejectionCount) || 0,
    history: Array.isArray(payload.history) ? payload.history : [],
  };
};

const fetchWorkStatus = async ({ params, forceRefresh = false }) => {
  const headers = {
    Accept: "*/*",
  };

  if (forceRefresh) {
    headers["Cache-Control"] = "no-cache, no-store, max-age=0";
    headers.Pragma = "no-cache";
    headers.Expires = "0";
  }

  return apiRequest({
    url: API_ENDPOINTS.omsRequestStatus,
    method: "GET",
    headers,
    params,
  });
};

export const fetchOmsWorkStatus = async ({
  projectId,
  status = "",
  search = "",
  ownerUserId = "",
  saveToCache = true,
  fallbackToCache = true,
  forceRefresh = false,
} = {}) => {
  if (!projectId) {
    return createEmptyWorkStatusResponse();
  }

  const params = {
    projectId,
  };

  if (String(status || "").trim()) {
    params.status = String(status).trim();
  }

  if (String(search || "").trim()) {
    params.search = String(search).trim();
  }

  if (forceRefresh) {
    params._ = Date.now();
  }

  try {
    const response = normalizeWorkStatusResponse(
      await fetchWorkStatus({ params, forceRefresh })
    );

    if (saveToCache && !String(search || "").trim()) {
      await saveCachedOmsWorkStatus({
        ownerUserId,
        projectId,
        status,
        response,
      });
    }

    return response;
  } catch (error) {
    if (!fallbackToCache || !shouldFallbackToCachedWorkStatus(error)) {
      throw error;
    }

    return getCachedOmsWorkStatus({
      ownerUserId,
      projectId,
      status,
      search,
    });
  }
};

export const fetchOmsSubmissionHistory = async (submissionId = "") => {
  const normalizedSubmissionId = String(submissionId || "").trim();

  if (!normalizedSubmissionId) {
    return createEmptySubmissionHistoryResponse();
  }

  const response = await apiRequest({
    url: buildApiEndpointPath(API_ENDPOINTS.omsSubmissionHistory, {
      submissionId: normalizedSubmissionId,
    }),
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  return normalizeSubmissionHistoryResponse(response);
};
