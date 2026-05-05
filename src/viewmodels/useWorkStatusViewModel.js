import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";
import {
  fetchOmsSubmissionHistory,
  fetchOmsWorkStatus,
} from "../services/workStatusService";
import { getCachedOmsWorkStatus } from "../services/workStatusOfflineStore";
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

const findProgressSubprocessMatch = (
  progress = { processes: [] },
  { subprocessId = null, processName = "", subprocessName = "" } = {}
) => {
  const normalizedSubprocessId = String(subprocessId || "").trim();

  if (normalizedSubprocessId) {
    const directMatch = findUnitProgressSubprocess(progress, normalizedSubprocessId);

    if (directMatch) {
      return directMatch;
    }
  }

  const normalizedProcessName = normalizeStageLabel(processName);
  const normalizedSubprocessName = normalizeStageLabel(subprocessName);

  if (!normalizedSubprocessName) {
    return null;
  }

  for (const process of progress.processes || []) {
    const matchesProcess =
      !normalizedProcessName ||
      normalizeStageLabel(process.name) === normalizedProcessName;

    if (!matchesProcess) {
      continue;
    }

    const subprocess = (process.subprocesses || []).find(
      (item) => normalizeStageLabel(item.name) === normalizedSubprocessName
    );

    if (subprocess) {
      return {
        process,
        subprocess,
      };
    }
  }

  return null;
};

const getTabsForRole = (canReviewChecklist) =>
  canReviewChecklist
    ? ["Submitted", "Pending", "Verified", "Approved", "Commented"]
    : ["Submitted", "Pending", "Approved", "Commented"];

const getRequestBucket = (item = {}) => {
  const normalizedStatus = String(item?.status || "").trim().toLowerCase();

  if(normalizedStatus === "info"){
    return "Info";
  }

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

  return "Submitted";
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
  id:
    item.submissionId ||
    item.submission_id ||
    `${item.unitId || item.unit_id || item.omsUnitId || item.oms_unit_id || item.omsId || item.oms_id || "OMS"}-${item.subprocessId || item.subprocess_id || item.subProcessId || "SUB"}`,
  submissionId: item.submissionId || item.submission_id || "",
  projectId: item.projectId || item.project_id || "",
  unitId:
    item.unitId ||
    item.unit_id ||
    item.omsUnitId ||
    item.oms_unit_id ||
    item.omsId ||
    item.oms_id ||
    "",
  omsId: item.omsId || item.oms_id || "",
  omsName:
    item.omsName ||
    item.oms_name ||
    item.nodeNo ||
    item.node_no ||
    item.omsId ||
    item.oms_id ||
    "",
  processId: Number(item.processId || item.process_id || item.processID) || null,
  processName: item.processName || item.process_name || "Process",
  subprocessId:
    Number(item.subprocessId || item.subprocess_id || item.subProcessId) || null,
  subprocessName: item.subprocessName || item.subprocess_name || "Subprocess",
  subCheckQty: Number(item.subCheckQty || item.sub_check_qty) || 0,
  status: String(item.status || item.current_status || "").trim().toLowerCase(),
  submittedAt: item.submittedAt || item.submitted_at || null,
  verifiedAt: item.verifiedAt || item.verified_at || null,
  approvedAt: item.approvedAt || item.approved_at || null,
  rejectedAt: item.rejectedAt || item.rejected_at || null,
  rejectionRemark: item.rejectionRemark || item.rejection_remark || "",
  submittedByName: item.submittedByName || item.submitted_by_name || "",
  verifiedByName: item.verifiedByName || item.verified_by_name || "",
  approvedByName: item.approvedByName || item.approved_by_name || "",
  rejectedByName: item.rejectedByName || item.rejected_by_name || "",
  requestBucket: getRequestBucket(item),
  rawItem: item,
});

const createEmptyTabData = (tabs = []) =>
  tabs.reduce((acc, tab) => {
    acc[tab] = [];
    return acc;
  }, {});

const createSupervisorOfflineCounts = (commentedItems = []) => ({
  ...EMPTY_COUNTS,
  rejected: commentedItems.length,
});

const resolveCountByTab = ({ tab, counts, roleAccess }) => {
  switch (tab) {
    case "Submitted":
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
    if (normalizedOverride === "rejected") {
      return "commented";
    }

    if (normalizedOverride === "info") {
      return "info";
    }

    return normalizedOverride;
  }

  const normalizedStatus = String(item?.status || "")
    .trim()
    .toLowerCase();

  if (normalizedStatus === "info") {
    return "info";
  }

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

  return "submitted";
};

const formatWorkStatusDate = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

const getWorkItemActorSummary = (item = {}) => {
  const requestBucket = String(item?.requestBucket || "").trim().toLowerCase();

  if (requestBucket === "commented" && item?.rejectedByName) {
    return {
      label: `Commented by ${item.rejectedByName}`,
      date: formatWorkStatusDate(item.rejectedAt),
    };
  }

  if (requestBucket === "approved" && item?.approvedByName) {
    return {
      label: `Approved by ${item.approvedByName}`,
      date: formatWorkStatusDate(item.approvedAt),
    };
  }

  if (requestBucket === "verified" && item?.verifiedByName) {
    return {
      label: `Verified by ${item.verifiedByName}`,
      date: formatWorkStatusDate(item.verifiedAt),
    };
  }

  if (
    (requestBucket === "pending" ||
      requestBucket === "submitted" ||
      requestBucket === "requests" ||
      requestBucket === "info") &&
    item?.submittedByName
  ) {
    return {
      label: `Submitted by ${item.submittedByName}`,
      date: formatWorkStatusDate(item.submittedAt),
    };
  }

  if (item?.submittedByName) {
    return {
      label: `Submitted by ${item.submittedByName}`,
      date: formatWorkStatusDate(item.submittedAt),
    };
  }

  if (item?.verifiedByName) {
    return {
      label: `Verified by ${item.verifiedByName}`,
      date: formatWorkStatusDate(item.verifiedAt),
    };
  }

  if (item?.approvedByName) {
    return {
      label: `Approved by ${item.approvedByName}`,
      date: formatWorkStatusDate(item.approvedAt),
    };
  }

  if (item?.rejectedByName) {
    return {
      label: `Commented by ${item.rejectedByName}`,
      date: formatWorkStatusDate(item.rejectedAt),
    };
  }

  return {
    label: "",
    date: "",
  };
};

const useWorkStatusViewModel = (navigation, route) => {
  const { user, roleAccess } = useAuth();
  const module = route?.params?.module || "OMS";
  const project = route?.params?.project || null;
  const projectId = project?.id || project?.projectId || user?.projectId || "";
  const ownerUserId = String(user?.id || user?.mobile || "").trim();
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
  const [isOnline, setIsOnline] = useState(true);
  const [hasResolvedNetworkState, setHasResolvedNetworkState] = useState(false);
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
  const selectedUnitId = String(
    selectedWorkItem?.unitId || selectedWorkItem?.omsId || ""
  ).trim();
  const {
    progress: selectedProgress,
    isLoading: isSelectedProgressLoading,
    error: selectedProgressError,
    refreshProgress: refreshSelectedProgress,
  } = useUnitProgress({
    projectId,
    unitId: selectedUnitId,
    enabled: Boolean(projectId && selectedUnitId && selectedWorkItem),
  });

  useEffect(() => {
    const updateOnlineState = (networkState = {}) => {
      setIsOnline(
        Boolean(networkState.isConnected) &&
          networkState.isInternetReachable !== false
      );
      setHasResolvedNetworkState(true);
    };

    const unsubscribe = NetInfo.addEventListener(updateOnlineState);
    void NetInfo.fetch()
      .then(updateOnlineState)
      .catch(() => {
        setHasResolvedNetworkState(true);
      });

    return () => {
      unsubscribe?.();
    };
  }, []);

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
      if (!hasResolvedNetworkState) {
        return;
      }

      if (!projectId) {
        setItemsByTab(createEmptyTabData(tabs));
        setCounts(EMPTY_COUNTS);
        setError("");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const isSupervisorOfflineMode =
        !isOnline &&
        roleAccess.canEditChecklist &&
        !roleAccess.canReviewChecklist;

      if (isSupervisorOfflineMode) {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        try {
          const commentedResponse = await getCachedOmsWorkStatus({
            ownerUserId,
            projectId,
            status: TAB_STATUS_QUERY.Commented,
            search,
          });

          const nextItemsByTab = createEmptyTabData(tabs);
          const commentedItems = (commentedResponse?.items || [])
            .map((item) => createWorkItem(item))
            .filter((item) => matchesStageFilter(item, stageLabel));

          nextItemsByTab.Commented = commentedItems;
          setItemsByTab(nextItemsByTab);
          setCounts(createSupervisorOfflineCounts(commentedItems));
        } catch (nextError) {
          setItemsByTab(createEmptyTabData(tabs));
          setCounts(EMPTY_COUNTS);
          setError(
            nextError?.message ||
              "Unable to load offline commented work items right now."
          );
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }

        return;
      }

      if (!isOnline) {
        setItemsByTab(createEmptyTabData(tabs));
        setCounts(EMPTY_COUNTS);
        setError(
          "Network unavailable. Please check your connection and try again."
        );
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
              ownerUserId,
              saveToCache:
                roleAccess.canEditChecklist &&
                !roleAccess.canReviewChecklist &&
                tab === "Commented",
              fallbackToCache: false,
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
    [
      hasResolvedNetworkState,
      isOnline,
      ownerUserId,
      projectId,
      roleAccess.canEditChecklist,
      roleAccess.canReviewChecklist,
      stageLabel,
      tabs,
      search,
    ]
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
      selectedWorkItem
        ? findProgressSubprocessMatch(selectedProgress, {
            subprocessId: selectedWorkItem.subprocessId,
            processName: selectedWorkItem.processName,
            subprocessName: selectedWorkItem.subprocessName,
          })
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
      const isCommentedItem =
        String(item?.requestBucket || "").trim().toLowerCase() === "commented";
      const canRectifyCommentedItem =
        isCommentedItem &&
        roleAccess.canEditChecklist &&
        !roleAccess.canReviewChecklist;

      if (canRectifyCommentedItem) {
        const resolvedRoute = resolveProcessRoute(item);

        if (resolvedRoute) {
          navigation.navigate(ROUTES.ROOT.UNIT_STATUS_UPDATE, {
            module,
            unit: {
              id: item?.unitId || "",
              unitNo: item?.omsName || item?.omsId || "",
              omsId: item?.omsId || "",
              projectId: item?.projectId || projectId || "",
            },
            unitId: item?.unitId || "",
            projectId: item?.projectId || projectId || "",
            projectName,
            sectionKey: resolvedRoute.sectionKey,
            subOptionId: resolvedRoute.subOptionId,
            workItem: item,
          });
          return;
        }
      }

      setSelectedWorkItem(item);
    },
    [
      module,
      navigation,
      projectId,
      projectName,
      resolveProcessRoute,
      roleAccess.canEditChecklist,
      roleAccess.canReviewChecklist,
    ]
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
    const actorSummary = getWorkItemActorSummary(item);
    const parts = [
      actorSummary.label,
      actorSummary.date,
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
