import { apiRequest } from "./apiClient";
import {
  getCachedOmsWorkStatus,
  saveCachedOmsWorkStatus,
} from "./workStatusOfflineStore";

const WORK_STATUS_API_PATHS = ["/api/v1/oms/request-status", "/oms/request-status"];
const SUBMISSION_HISTORY_API_PATHS = [
  (submissionId) => `/api/v1/oms/submissions/${submissionId}/history`,
  (submissionId) => `/oms/submissions/${submissionId}/history`,
];

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

const fetchWithFallbackPaths = async ({ params }) => {
  let lastNotFoundError = null;

  for (const path of WORK_STATUS_API_PATHS) {
    try {
      return await apiRequest({
        url: path,
        method: "GET",
        headers: {
          Accept: "*/*",
        },
        params,
      });
    } catch (error) {
      if (error?.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastNotFoundError || new Error("Unable to fetch work status.");
};

export const fetchOmsWorkStatus = async ({
  projectId,
  status = "",
  search = "",
  ownerUserId = "",
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

  try {
    const response = normalizeWorkStatusResponse(
      await fetchWithFallbackPaths({ params })
    );

    if (!String(search || "").trim()) {
      await saveCachedOmsWorkStatus({
        ownerUserId,
        projectId,
        status,
        response,
      });
    }

    return response;
  } catch (error) {
    if (!shouldFallbackToCachedWorkStatus(error)) {
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

  let lastNotFoundError = null;

  for (const buildPath of SUBMISSION_HISTORY_API_PATHS) {
    try {
      const response = await apiRequest({
        url: buildPath(normalizedSubmissionId),
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      return normalizeSubmissionHistoryResponse(response);
    } catch (error) {
      if (error?.status === 404) {
        lastNotFoundError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastNotFoundError || new Error("Unable to fetch submission history.");
};
