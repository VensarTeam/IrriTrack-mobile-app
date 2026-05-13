import { API_ENDPOINTS, buildApiEndpointPath } from "../config/env";
import { apiRequest } from "./apiClient";

export const submitOmsReviewAction = async ({
  action,
  submissionId,
  remark = "",
} = {}) => {
  const normalizedAction = String(action || "").trim().toLowerCase();

  if (!submissionId || !normalizedAction) {
    throw new Error("Submission or workflow action is missing.");
  }

  const body = {
    action: normalizedAction,
  };

  if (normalizedAction === "reject") {
    if (!String(remark || "").trim()) {
      throw new Error("Remark is required to reject this submission.");
    }

    body.remark = String(remark).trim();
  }

  console.log("[OMSReview]", "Submitting workflow action", {
    submissionId,
    body,
  });

  return apiRequest({
    url: buildApiEndpointPath(API_ENDPOINTS.omsSubmissionWorkflowStatus, {
      submissionId,
    }),
    method: "PATCH",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    data: body,
  });
};
