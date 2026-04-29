import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";
import {
  fetchOmsSubmissionHistory,
  fetchOmsWorkStatus,
} from "../services/workStatusService";
import useChecklistSections from "./useChecklistSections";
import useUnitProgress from "../hooks/useUnitProgress";
import { findUnitProgressSubprocess } from "../models/unitProgress";
import { submitOmsReviewAction } from "../services/omsReviewService";
import { showAppAlert } from "../services/alertService";

const TAB_STATUS_QUERY = {
  Requests: "",
  Pending: "submitted",
  Verified: "verified",
  Approved: "approved",
  Commented: "rejected",
};

const EMPTY_COUNTS = {
  total: 0,
  submitted: 0,
  verified: 0,
  approved: 0,
  rejected: 0,
};

const toDisplayText = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return String(value.name || value.label || value.title || value.id || fallback);
  }

  return fallback;
};

const normalizeStageLabel = (value = "") =>
  String(value || "")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getTabsForRole = (canReviewChecklist) =>
  canReviewChecklist
    ? ["Requests", "Pending", "Verified", "Approved", "Commented"]
    : ["Requests", "Pending", "Approved", "Commented"];

const getRequestBucket = (item = {}) => {
  const normalizedStatus = String(item?.status || "").trim().toLowerCase();

  if (item?.rejectedAt || item?.rejectionRemark) {
    return "Commented";
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "commented") {
    return "Commented";
  }

  if (item?.approvedAt) {
    return "Approved";
  }

  if (normalizedStatus === "approved") {
    return "Approved";
  }

  if (item?.verifiedAt) {
    return "Verified";
  }

  if (normalizedStatus === "verified") {
    return "Verified";
  }

  if (item?.submittedAt) {
    return "Pending";
  }

  return "Requests";
};

const matchesStageFilter = (item = {}, stageLabel = "All") => {
  if (stageLabel === "All") {
    return true;
  }

  const target = normalizeStageLabel(stageLabel);
  const processLabel = normalizeStageLabel(item?.processName || "");
  const subprocessLabel = normalizeStageLabel(item?.subprocessName || "");

  return (
    processLabel === target ||
    subprocessLabel === target ||
    processLabel.includes(target) ||
    subprocessLabel.includes(target) ||
    target.includes(processLabel) ||
    target.includes(subprocessLabel)
  );
};

const createWorkItem = (item = {}) => ({
  id: item.submissionId || `${item.omsId || "OMS"}-${item.subprocessId || "SUB"}`,
  submissionId: item.submissionId || "",
  projectId: item.projectId || "",
  omsId: item.omsId || "",
  omsName: item.omsName || item.omsId || "",
  processId: Number(item.processId) || null,
  processName: item.processName || "Process",
  subprocessId: Number(item.subprocessId) || null,
  subprocessName: item.subprocessName || "Subprocess",
  subCheckQty: Number(item.subCheckQty) || 0,
  status: String(item.status || "").trim().toLowerCase(),
  submittedAt: item.submittedAt || null,
  verifiedAt: item.verifiedAt || null,
  approvedAt: item.approvedAt || null,
  rejectedAt: item.rejectedAt || null,
  rejectionRemark: item.rejectionRemark || "",
  submittedByName: item.submittedByName || "",
  verifiedByName: item.verifiedByName || "",
  approvedByName: item.approvedByName || "",
  rejectedByName: item.rejectedByName || "",
  requestBucket: getRequestBucket(item),
  rawItem: item,
});

const createEmptyTabData = (tabs = []) =>
  tabs.reduce((acc, tab) => {
    acc[tab] = [];
    return acc;
  }, {});

const resolveCountByTab = ({ tab, counts, roleAccess }) => {
  switch (tab) {
    case "Requests":
      return Number(counts?.total || 0);
    case "Pending":
      return Number(counts?.submitted || 0);
    case "Verified":
      return roleAccess.canReviewChecklist ? Number(counts?.verified || 0) : 0;
    case "Approved":
      return Number(counts?.approved || 0);
    case "Commented":
      return Number(counts?.rejected || 0);
    default:
      return 0;
  }
};

const getWorkflowStatusKey = (item = {}, override = "") => {
  const normalizedOverride = String(override || "").trim().toLowerCase();

  if (normalizedOverride) {
    return normalizedOverride === "rejected" ? "commented" : normalizedOverride;
  }

  const normalizedStatus = String(item?.status || "")
    .trim()
    .toLowerCase();

  if (
    item?.rejectedAt ||
    item?.rejectionRemark ||
    normalizedStatus === "rejected" ||
    normalizedStatus === "commented"
  ) {
    return "commented";
  }

  if (item?.approvedAt || normalizedStatus === "approved") {
    return "approved";
  }

  if (item?.verifiedAt || normalizedStatus === "verified") {
    return "verified";
  }

  if (
    item?.submittedAt ||
    normalizedStatus === "submitted" ||
    normalizedStatus === "completed"
  ) {
    return "submitted";
  }

  return "requests";
};

const useWorkStatusViewModel = (navigation, route) => {
  const { user, roleAccess } = useAuth();
  const module = route?.params?.module || "OMS";
  const project = route?.params?.project || null;
  const projectId = project?.id || project?.projectId || user?.projectId || "";
  const projectName = toDisplayText(
    route?.params?.projectName || project?.name,
    "IrriTrack"
  );
  const stageLabel = String(route?.params?.stageLabel || "All").trim() || "All";
  const zoneName = String(route?.params?.zoneName || "All").trim() || "All";
  const villageName = String(route?.params?.villageName || "All").trim() || "All";
  const tabs = useMemo(
    () => getTabsForRole(roleAccess.canReviewChecklist),
    [roleAccess.canReviewChecklist]
  );
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { sections: processSections } = useChecklistSections({ module });
  const [itemsByTab, setItemsByTab] = useState(() => createEmptyTabData(tabs));
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [pendingHistoryWorkItem, setPendingHistoryWorkItem] = useState(null);
  const [selectedHistoryWorkItem, setSelectedHistoryWorkItem] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState(null);
  const [isSubmissionHistoryLoading, setIsSubmissionHistoryLoading] = useState(false);
  const [submissionHistoryError, setSubmissionHistoryError] = useState("");
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
  const [workflowStatusOverrides, setWorkflowStatusOverrides] = useState({});
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isWorkflowSubmitting, setIsWorkflowSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const requestSequenceRef = useRef(0);
  const selectedSubmissionId = String(selectedWorkItem?.submissionId || "").trim();
  const selectedUnitId = String(selectedWorkItem?.omsId || "").trim();
  const {
    progress: selectedProgress,
    isLoading: isSelectedProgressLoading,
    error: selectedProgressError,
    refreshProgress: refreshSelectedProgress,
  } = useUnitProgress({
    projectId,
    unitId: selectedUnitId,
    enabled: Boolean(
      roleAccess.canReviewChecklist && projectId && selectedUnitId && selectedWorkItem
    ),
  });

  useEffect(() => {
    setItemsByTab(createEmptyTabData(tabs));
  }, [tabs]);

  useEffect(() => {
    setReviewRemark("");
    setReviewError("");
  }, [selectedSubmissionId]);

  useEffect(() => {
    if (!pendingHistoryWorkItem || selectedWorkItem) {
      return;
    }

    setSelectedHistoryWorkItem(pendingHistoryWorkItem);
    setPendingHistoryWorkItem(null);
  }, [pendingHistoryWorkItem, selectedWorkItem]);

  useEffect(() => {
    let isCancelled = false;

    const loadHistory = async () => {
      const nextSubmissionId = String(
        selectedHistoryWorkItem?.submissionId || ""
      ).trim();

      if (!nextSubmissionId) {
        setSubmissionHistory(null);
        setSubmissionHistoryError("");
        setIsSubmissionHistoryLoading(false);
        return;
      }

      setIsSubmissionHistoryLoading(true);
      setSubmissionHistoryError("");

      try {
        const response = await fetchOmsSubmissionHistory(nextSubmissionId);

        if (isCancelled) {
          return;
        }

        setSubmissionHistory(response);
      } catch (nextError) {
        if (isCancelled) {
          return;
        }

        setSubmissionHistory(null);
        setSubmissionHistoryError(
          nextError?.message || "Unable to load submission history right now."
        );
      } finally {
        if (!isCancelled) {
          setIsSubmissionHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [historyRefreshTick, selectedHistoryWorkItem]);

  const resolveProcessRoute = useCallback(
    (item) => {
      const targetProcessId = Number(item?.processId);
      const targetSubprocessId = Number(item?.subprocessId);

      for (const section of processSections) {
        if (
          Number(section.apiProcessId) === targetProcessId &&
          (!targetSubprocessId || !section.subOptions?.length)
        ) {
          return {
            sectionKey: section.key,
            subOptionId: section.subOptions?.[0]?.id,
          };
        }

        for (const subOption of section.subOptions || []) {
          if (
            Number(subOption.apiProcessId || section.apiProcessId) === targetProcessId &&
            Number(subOption.apiSubprocessId) === targetSubprocessId
          ) {
            return {
              sectionKey: section.key,
              subOptionId: subOption.id,
            };
          }
        }
      }

      return null;
    },
    [processSections]
  );

  const loadBoard = useCallback(
    async ({ refresh = false } = {}) => {
      if (!projectId) {
        setItemsByTab(createEmptyTabData(tabs));
        setCounts(EMPTY_COUNTS);
        setError("");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const requestId = requestSequenceRef.current + 1;
      requestSequenceRef.current = requestId;

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      try {
        const responses = await Promise.all(
          tabs.map(async (tab) => {
            const response = await fetchOmsWorkStatus({
              projectId,
              status: TAB_STATUS_QUERY[tab],
              search,
            });

            return {
              tab,
              response,
            };
          })
        );

        if (requestSequenceRef.current !== requestId) {
          return;
        }

        const nextItemsByTab = createEmptyTabData(tabs);
        let nextCounts = EMPTY_COUNTS;

        responses.forEach(({ tab, response }, index) => {
          if (index === 0) {
            nextCounts = {
              ...EMPTY_COUNTS,
              ...(response?.counts || {}),
            };
          }

          nextItemsByTab[tab] = (response?.items || [])
            .map((item) => createWorkItem(item))
            .filter((item) => matchesStageFilter(item, stageLabel));
        });

        setCounts(nextCounts);
        setItemsByTab(nextItemsByTab);
      } catch (nextError) {
        if (requestSequenceRef.current !== requestId) {
          return;
        }

        setError(nextError?.message || "Unable to load work status right now.");
      } finally {
        if (requestSequenceRef.current === requestId) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [projectId, stageLabel, tabs, search]
  );

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const countsByTab = useMemo(
    () =>
      tabs.reduce((acc, tab) => {
        acc[tab] = resolveCountByTab({ tab, counts, roleAccess });
        return acc;
      }, {}),
    [counts, roleAccess, tabs]
  );

  const unitsByTab = useMemo(
    () =>
      tabs.reduce((acc, tab) => {
        acc[tab] = itemsByTab[tab] || [];
        return acc;
      }, {}),
    [itemsByTab, tabs]
  );

  const activeTab = tabs[activeTabIndex] || tabs[0];
  const activeUnits = unitsByTab[activeTab] || [];

  const refresh = useCallback(() => {
    void loadBoard({ refresh: true });
  }, [loadBoard]);

  const selectedProgressMatch = useMemo(
    () =>
      selectedWorkItem?.subprocessId
        ? findUnitProgressSubprocess(selectedProgress, selectedWorkItem.subprocessId)
        : null,
    [selectedProgress, selectedWorkItem]
  );

  const selectedWorkflowStatusKey = useMemo(
    () =>
      getWorkflowStatusKey(
        selectedWorkItem,
        workflowStatusOverrides[selectedSubmissionId] || ""
      ),
    [selectedSubmissionId, selectedWorkItem, workflowStatusOverrides]
  );

  const openWorkItem = useCallback(
    (item) => {
      const displayOmsName = item?.omsName || item?.omsId || "OMS";
      const unit = {
        id: item?.omsId || "",
        unitNo: displayOmsName,
        nodeName: displayOmsName,
      };
      const processRoute = resolveProcessRoute(item);

      if (roleAccess.canReviewChecklist) {
        setSelectedWorkItem(item);
        return;
      }

      navigation.navigate(ROUTES.ROOT.UNIT_STATUS_UPDATE, {
        module,
        unit,
        projectId: projectId || item?.projectId || "",
        projectName,
        sectionKey: processRoute?.sectionKey,
        subOptionId: processRoute?.subOptionId,
        workItem: item,
      });
    },
    [module, navigation, projectId, projectName, resolveProcessRoute, roleAccess.canReviewChecklist]
  );

  const closeWorkItemSheet = useCallback(() => {
    setSelectedWorkItem(null);
    setReviewRemark("");
    setReviewError("");
  }, []);

  const openSubmissionHistory = useCallback(() => {
    if (!selectedWorkItem) {
      return;
    }

    setPendingHistoryWorkItem(selectedWorkItem);
    setSelectedWorkItem(null);
    setReviewRemark("");
    setReviewError("");
  }, [selectedWorkItem]);

  const closeSubmissionHistory = useCallback(() => {
    setSelectedHistoryWorkItem(null);
    setSubmissionHistory(null);
    setSubmissionHistoryError("");
    setIsSubmissionHistoryLoading(false);
  }, []);

  const refreshSubmissionHistory = useCallback(() => {
    if (!selectedHistoryWorkItem) {
      return;
    }

    setHistoryRefreshTick((currentValue) => currentValue + 1);
  }, [selectedHistoryWorkItem]);

  const updateReviewRemark = useCallback((value) => {
    setReviewRemark(value);

    if (reviewError) {
      setReviewError("");
    }
  }, [reviewError]);

  const submitWorkItemAction = useCallback(
    async (action) => {
      const normalizedAction = String(action || "").trim().toLowerCase();

      if (!selectedSubmissionId) {
        return;
      }

      if (normalizedAction === "reject" && !String(reviewRemark || "").trim()) {
        setReviewError("Remark is required to reject this subprocess.");
        return;
      }

      setIsWorkflowSubmitting(true);

      try {
        await submitOmsReviewAction({
          action: normalizedAction,
          submissionId: selectedSubmissionId,
          remark: reviewRemark,
        });

        const nextStatusKey =
          normalizedAction === "reject"
            ? "commented"
            : normalizedAction === "verify"
            ? "verified"
            : "approved";

        setWorkflowStatusOverrides((currentValue) => ({
          ...currentValue,
          [selectedSubmissionId]: nextStatusKey,
        }));
        await Promise.all([refreshSelectedProgress(), loadBoard({ refresh: true })]);
        setReviewRemark("");
        setReviewError("");

        showAppAlert({
          type: "success",
          title:
            normalizedAction === "verify"
              ? "Subprocess Verified"
              : normalizedAction === "approve"
              ? "Subprocess Approved"
              : "Subprocess Rejected",
          message:
            normalizedAction === "verify"
              ? `${selectedWorkItem?.subprocessName || "Subprocess"} was verified successfully.`
              : normalizedAction === "approve"
              ? `${selectedWorkItem?.subprocessName || "Subprocess"} was approved successfully.`
              : `${selectedWorkItem?.subprocessName || "Subprocess"} was sent back with your remark.`,
        });
      } catch (nextError) {
        const message =
          nextError?.message || "Unable to update workflow right now.";

        setReviewError(message);
        showAppAlert({
          type: "danger",
          title: "Workflow update failed",
          message,
        });
      } finally {
        setIsWorkflowSubmitting(false);
      }
    },
    [
      loadBoard,
      refreshSelectedProgress,
      reviewRemark,
      selectedSubmissionId,
      selectedWorkItem,
    ]
  );

  const getUnitSubtitle = useCallback((item) => {
    const parts = [
      item?.submittedByName
        ? `By ${item.submittedByName}`
        : item?.verifiedByName
        ? `By ${item.verifiedByName}`
        : item?.approvedByName
        ? `By ${item.approvedByName}`
        : item?.rejectedByName
        ? `By ${item.rejectedByName}`
        : "",
      item?.subCheckQty ? `${item.subCheckQty} checks` : "",
    ].filter(Boolean);

    return parts.join(" • ");
  }, []);

  const getUnitWorkBucket = useCallback(
    (item) => item?.requestBucket || "Requests",
    []
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    module,
    projectName,
    stageLabel,
    zoneName,
    villageName,
    search,
    setSearch,
    tabs,
    activeTabIndex,
    setActiveTabIndex,
    countsByTab,
    activeUnits,
    unitsByTab,
    isLoading,
    isRefreshing,
    isFetchingMore: false,
    error,
    canReviewChecklist: roleAccess.canReviewChecklist,
    reviewCapabilities: {
      canVerify: Boolean(roleAccess.canVerifyChecklist),
      canApprove: Boolean(roleAccess.canApproveChecklist),
      canReject: Boolean(roleAccess.canRejectChecklist),
    },
    canLoadMore: false,
    loadMore: () => {},
    refresh,
    openWorkItem,
    selectedWorkItem,
    selectedProgressMatch,
    selectedProgress,
    selectedWorkflowStatusKey,
    isSelectedProgressLoading,
    selectedProgressError,
    selectedHistoryWorkItem,
    submissionHistory,
    isSubmissionHistoryLoading,
    submissionHistoryError,
    workflowStatusOverrides,
    reviewRemark,
    reviewError,
    isWorkflowSubmitting,
    closeWorkItemSheet,
    openSubmissionHistory,
    closeSubmissionHistory,
    refreshSubmissionHistory,
    updateReviewRemark,
    submitWorkItemAction,
    refreshSelectedProgress,
    getUnitSubtitle,
    getUnitWorkBucket,
    pagination: null,
    handleBack,
  };
};

export default useWorkStatusViewModel;
