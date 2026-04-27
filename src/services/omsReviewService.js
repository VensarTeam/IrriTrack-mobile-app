import { apiRequest } from "./apiClient";

const OMS_REVIEW_STATUS_BY_ACTION = {
  reject: 3,
  approve: 4,
};

export const submitOmsReviewAction = async ({
  action,
  projectId,
  unitId,
  processId,
  remark = "",
} = {}) => {
  const status = OMS_REVIEW_STATUS_BY_ACTION[String(action || "").trim()];

  if (!projectId || !unitId || !processId || !status) {
    throw new Error("Project, OMS, process, or review action is missing.");
  }

  const body = {
    level: "process",
    processId: Number(processId),
    status,
  };

  if (status === 3) {
    if (!String(remark || "").trim()) {
      throw new Error("Comment is required to reject this process.");
    }

    body.comment = String(remark).trim();
  }

  console.log("[OMSReview]", "Submitting review action", {
    projectId,
    omsId: unitId,
    body,
  });

  return apiRequest({
    url: `/api/v1/oms/${projectId}/${unitId}/status`,
    method: "PATCH",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
    },
    data: body,
  });
};
