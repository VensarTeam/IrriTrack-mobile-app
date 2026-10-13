const roleCode = (value) => String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");

export const getPipeWorkflowActions = (item, user) => {
  const role = roleCode(user?.role);
  const userId = String(user?.id || "");
  const status = item?.workflowStatus || item?.status;
  const engineer = userId && userId === String(item?.assignedEngineerId || "");
  const manager = userId && userId === String(item?.assignedManagerId || "");
  if ((role === "engineer" || role === "manager") && (engineer || manager)) {
    if (status === "submitted") return [
      { key: "verify", label: "Verify" },
      { key: "modify_approved", label: "Need modification" },
      { key: "reject", label: "Need correction" },
    ];
    if (status === "verified") return [
      ...(role === "manager" && manager ? [{ key: "approve", label: "Approve" }] : []),
      { key: "modify_approved", label: "Need modification" },
      { key: "reject", label: "Need correction" },
    ];
    if (status === "modify_request") return [
      { key: "modify_approved", label: "Allow modification" },
      { key: "modify_rejected", label: "Reject modification" },
    ];
  }
  if (role === "supervisor" && userId && userId === String(item?.createdBy || "")) {
    if (["verified", "approved"].includes(status)) {
      return [{ key: "modify_request", label: "Request modification" }];
    }
    if (["modify_approved", "rejected"].includes(status)) {
      return [{ key: "edit_resubmit", label: "Edit & resubmit" }];
    }
  }
  return [];
};


// Offline filters operate on the saved list, which may contain only a server page.
export const filterCachedPipeWorkStatus = (data, { status = "all", search = "" } = {}) => {
  const query = search.trim().toLowerCase();
  return {
    ...data,
    items: (data?.items || []).filter((item) =>
      (status === "all" || (item.workflowStatus || item.status) === status) &&
      (!query || [item.startNode, item.stopNode, item.segmentLabel, item.packageTitle,
        item.processDescription, item.processCode, item.material]
        .some((value) => String(value || "").toLowerCase().includes(query))),
    ),
  };
};

export const getPipeReviewRemark = (detail, status = detail?.workflowStatus) => {
  if (status === "rejected" && detail?.rejectionRemark) return detail.rejectionRemark;
  const action = status === "rejected" ? "rejected" : status === "modify_approved" ? "modify_approved" : null;
  if (!action) return "";
  return [...(detail?.history || [])].reverse().find((entry) => entry.action === action)?.remark || "";
};
