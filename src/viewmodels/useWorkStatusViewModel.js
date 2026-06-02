import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
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
  "Modify Request": "modify_request",
  "Modify Approved": "modify_approved",
};

const EMPTY_COUNTS = {
  total: 0,
  submitted: 0,
  verified: 0,
  approved: 0,
  rejected: 0,
  modifyRequest: 0,
  modifyApproved: 0,
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

const getTabsForRole = (roleAccess = {}) => {
  const baseTabs = roleAccess.canReviewChecklist
    ? ["Submitted", "Pending", "Verified", "Approved", "Commented"]
    : ["Submitted", "Pending", "Approved", "Commented"];

  return roleAccess.canReviewChecklist
    ? [...baseTabs, "Modify Request", "Modify Approved"]
    : [...baseTabs, "Modify Approved"];
};

const getRequestBucket = (item = {}) => {
  const normalizedStatus = String(item?.status || "").trim().toLowerCase();

  if (normalizedStatus === "info") {
    return "Info";
  }

  if (
    normalizedStatus === "7" ||
    normalizedStatus === "modify_approved" ||
    normalizedStatus === "modify approved" ||
    normalizedStatus === "modification_approved" ||
    normalizedStatus === "modification approved"
  ) {
    return "Modify Approved";
  }

  if (
    normalizedStatus === "2" ||
    normalizedStatus === "modify_rejected" ||
    normalizedStatus === "modify rejected" ||
    normalizedStatus === "modification_rejected" ||
    normalizedStatus === "modification rejected"
  ) {
    return "Pending";
  }

  if (
    item?.modifyRequestAt ||
    item?.modify_request_at ||
    normalizedStatus === "6" ||
    normalizedStatus === "modify_request" ||
    normalizedStatus === "modify request" ||
    normalizedStatus === "modification_requested" ||
    normalizedStatus === "modification requested"
  ) {
    return "Modify Request";
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

  if (
    item?.submittedAt ||
    normalizedStatus === "submitted" ||
    normalizedStatus === "completed"
  ) {
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
  modifyRequestAt: item.modifyRequestAt || item.modify_request_at || null,
  modifyApprovedAt:
    item.modifyApprovedAt ||
    item.modify_approved_at ||
    item.modifierStatusAt ||
    item.modifier_status_at ||
    null,
  modifierRemark: item.modifierRemark || item.modifier_remark || "",
  modifierStatusAt: item.modifierStatusAt || item.modifier_status_at || null,
  modifierStatusByName: item.modifierStatusByName || item.modifier_status_by_name || "",
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
    case "Modify Request":
      return Number(
        counts?.modifyRequest ||
          counts?.modify_request ||
          counts?.modificationRequested ||
          counts?.modification_requested ||
          counts?.status6 ||
          0
      );
    case "Modify Approved":
      return Number(
        counts?.modifyApproved ||
          counts?.modify_approved ||
          counts?.modificationApproved ||
          counts?.modification_approved ||
          counts?.status7 ||
          0
      );
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
    item?.modifyRequestAt ||
    item?.modify_request_at ||
    normalizedStatus === "6" ||
    normalizedStatus === "modify_request" ||
    normalizedStatus === "modify request" ||
    normalizedStatus === "modification_requested" ||
    normalizedStatus === "modification requested"
  ) {
    return "modify_request";
  }

  if (
    normalizedStatus === "7" ||
    normalizedStatus === "modify_approved" ||
    normalizedStatus === "modify approved" ||
    normalizedStatus === "modification_approved" ||
    normalizedStatus === "modification approved"
  ) {
    return "modify_approved";
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

const getWorkItemStatusDetails = (item = {}) =>
  [
    item?.submittedByName
      ? {
          key: "submitted",
          stage: "Submitted",
          actorName: item.submittedByName,
          date: formatWorkStatusDate(item.submittedAt),
        }
      : null,
    item?.verifiedByName
      ? {
          key: "verified",
          stage: "Verified",
          actorName: item.verifiedByName,
          date: formatWorkStatusDate(item.verifiedAt),
        }
      : null,
    item?.approvedByName
      ? {
          key: "approved",
          stage: "Approved",
          actorName: item.approvedByName,
          date: formatWorkStatusDate(item.approvedAt),
        }
      : null,
    (item?.modifierStatusAt || item?.modifyApprovedAt)
      ? {
          key: "modify_approved",
          stage: "Modify Approved",
          actorName:
            item.modifierStatusByName || item.approvedByName || "Reviewer",
          date: formatWorkStatusDate(item.modifierStatusAt || item.modifyApprovedAt),
        }
      : null,
    item?.rejectedByName
      ? {
          key: "commented",
          stage: "Commented",
          actorName: item.rejectedByName,
          date: formatWorkStatusDate(item.rejectedAt),
        }
      : null,
  ].filter(Boolean);

const getWorkflowActionItemPatch = (action = "") => {
  const normalizedAction = String(action || "").trim().toLowerCase();
  const now = new Date().toISOString();

  if (normalizedAction === "reject") {
    return {
      status: "rejected",
      requestBucket: "Commented",
      rejectedAt: now,
    };
  }

  if (normalizedAction === "verify") {
    return {
      status: "verified",
      requestBucket: "Verified",
      verifiedAt: now,
    };
  }

  if (normalizedAction === "approve") {
    return {
      status: "approved",
      requestBucket: "Approved",
      approvedAt: now,
    };
  }

  return null;
};

const getModifyRequestItemPatch = (action = "modify_request") => {
  const normalizedAction = String(action || "").trim().toLowerCase();
  const now = new Date().toISOString();

  if (normalizedAction === "modify_approved") {
    return {
      status: "7",
      requestBucket: "Modify Approved",
      modifyApprovedAt: now,
    };
  }

  if (normalizedAction === "modify_rejected") {
    return {
      status: "2",
      requestBucket: "Pending",
      submittedAt: now,
    };
  }

  return {
    status: "6",
    requestBucket: "Modify Request",
    modifyRequestAt: now,
  };
};

const applyWorkflowActionToTabItems = ({
  itemsByTab,
  tabs,
  submissionId,
  action,
} = {}) => {
  const normalizedSubmissionId = String(submissionId || "").trim();
  const patch = getWorkflowActionItemPatch(action);

  if (!normalizedSubmissionId || !patch) {
    return itemsByTab;
  }

  const nextItemsByTab = createEmptyTabData(tabs);
  let updatedItem = null;

  tabs.forEach((tab) => {
    (itemsByTab[tab] || []).forEach((item) => {
      if (String(item?.submissionId || "").trim() !== normalizedSubmissionId) {
        nextItemsByTab[tab].push(item);
        return;
      }

      updatedItem = {
        ...item,
        ...patch,
      };
    });
  });

  if (!updatedItem) {
    return itemsByTab;
  }

  tabs.forEach((tab) => {
    if (tab === "Submitted" || tab === updatedItem.requestBucket) {
      const alreadyExists = nextItemsByTab[tab].some(
        (item) =>
          String(item?.submissionId || "").trim() === normalizedSubmissionId
      );

      if (!alreadyExists) {
        nextItemsByTab[tab].push(updatedItem);
      }
    }
  });

  return nextItemsByTab;
};

const applyModifyRequestToTabItems = ({
  itemsByTab,
  tabs,
  submissionId,
  action = "modify_request",
} = {}) => {
  const normalizedSubmissionId = String(submissionId || "").trim();

  if (!normalizedSubmissionId) {
    return itemsByTab;
  }

  const nextItemsByTab = createEmptyTabData(tabs);
  let updatedItem = null;

  tabs.forEach((tab) => {
    (itemsByTab[tab] || []).forEach((item) => {
      if (String(item?.submissionId || "").trim() !== normalizedSubmissionId) {
        nextItemsByTab[tab].push(item);
        return;
      }

      updatedItem = {
        ...item,
        ...getModifyRequestItemPatch(action),
      };
    });
  });

  if (!updatedItem) {
    return itemsByTab;
  }

  if (tabs.includes(updatedItem.requestBucket)) {
    nextItemsByTab[updatedItem.requestBucket] = [
      ...(nextItemsByTab[updatedItem.requestBucket] || []),
      updatedItem,
    ];
  }

  return nextItemsByTab;
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
    () => getTabsForRole(roleAccess),
    [roleAccess]
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
  const [modifyRequestOverrides, setModifyRequestOverrides] = useState({});
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isWorkflowSubmitting, setIsWorkflowSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const requestSequenceRef = useRef(0);
  const hasFocusedOnceRef = useRef(false);
  const selectedWorkItemRef = useRef(null);
  const selectedProgressRefreshKeyRef = useRef("");
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
    selectedWorkItemRef.current = selectedWorkItem;
  }, [selectedWorkItem]);

  useEffect(() => {
    const refreshKey = [selectedSubmissionId, selectedUnitId].join(":");

    if (!selectedSubmissionId || !selectedUnitId) {
      selectedProgressRefreshKeyRef.current = "";
      return;
    }

    if (selectedProgressRefreshKeyRef.current === refreshKey) {
      return;
    }

    selectedProgressRefreshKeyRef.current = refreshKey;
    void refreshSelectedProgress();
  }, [refreshSelectedProgress, selectedSubmissionId, selectedUnitId]);

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
    async ({ refresh = false, silent = false } = {}) => {
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
        } else if (!silent) {
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
      } else if (!silent) {
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
              forceRefresh: true,
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
            .map((item) => createWorkItem(item));
        });

        Object.values(modifyRequestOverrides).forEach((item) => {
          const submissionId = String(item?.submissionId || "").trim();

          if (!submissionId) {
            return;
          }

          tabs.forEach((tab) => {
            nextItemsByTab[tab] = (nextItemsByTab[tab] || []).filter(
              (tabItem) =>
                String(tabItem?.submissionId || "").trim() !== submissionId
            );
          });
          nextItemsByTab["Modify Request"] = [
            ...(nextItemsByTab["Modify Request"] || []),
            item,
          ];
        });

        setCounts(nextCounts);
        setItemsByTab(nextItemsByTab);
        setWorkflowStatusOverrides({});
        setSelectedWorkItem((currentValue) => {
          const currentSubmissionId = String(
            currentValue?.submissionId || ""
          ).trim();

          if (!currentSubmissionId) {
            return currentValue;
          }

          const latestItem = tabs
            .flatMap((tab) => nextItemsByTab[tab] || [])
            .find(
              (item) =>
                String(item?.submissionId || "").trim() === currentSubmissionId
            );

          return latestItem || currentValue;
        });
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
      modifyRequestOverrides,
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

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return undefined;
      }

      void loadBoard({ silent: true, forceRefresh: true });
      if (selectedWorkItemRef.current) {
        void refreshSelectedProgress();
      }
      return undefined;
    }, [loadBoard, refreshSelectedProgress])
  );

  const countsByTab = useMemo(
    () =>
      tabs.reduce((acc, tab) => {
        if (tab === "Modify Request" || tab === "Modify Approved") {
          const serverCount = resolveCountByTab({ tab, counts, roleAccess });
          acc[tab] = Math.max(serverCount, (itemsByTab[tab] || []).length);
          return acc;
        }

        acc[tab] = resolveCountByTab({ tab, counts, roleAccess });
        return acc;
      }, {}),
    [counts, itemsByTab, roleAccess, tabs]
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
    void loadBoard({ refresh: true, forceRefresh: true });
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
      const isModifyApprovedItem =
        String(item?.requestBucket || "").trim().toLowerCase() ===
        "modify approved";
      const canRectifyCommentedItem =
        isCommentedItem &&
        roleAccess.canEditChecklist &&
        !roleAccess.canReviewChecklist;
      const canEditModifyApprovedItem =
        isModifyApprovedItem &&
        roleAccess.canEditChecklist &&
        !roleAccess.canReviewChecklist;

      if (canRectifyCommentedItem || canEditModifyApprovedItem) {
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

  const requestModification = useCallback(
    async (item, remark = "") => {
      const submissionId = String(item?.submissionId || "").trim();

      if (!submissionId) {
        return;
      }

      setIsWorkflowSubmitting(true);

      try {
        await submitOmsReviewAction({
          action: "modify_request",
          submissionId,
          remark,
        });
      } catch (nextError) {
        const message =
          nextError?.message || "Unable to request modification right now.";

        showAppAlert({
          type: "danger",
          title: "Modify request failed",
          message,
        });
        throw nextError;
      } finally {
        setIsWorkflowSubmitting(false);
      }

      const patchedItem = {
        ...item,
        ...getModifyRequestItemPatch(),
      };

      setModifyRequestOverrides((currentValue) => ({
        ...currentValue,
        [submissionId]: patchedItem,
      }));
      setItemsByTab((currentValue) =>
        applyModifyRequestToTabItems({
          itemsByTab: currentValue,
          tabs,
          submissionId,
          action: "modify_request",
        })
      );
      setSelectedWorkItem((currentValue) =>
        String(currentValue?.submissionId || "").trim() === submissionId
          ? patchedItem
          : currentValue
      );
      showAppAlert({
        type: "success",
        title: "Modify request added",
        message: "This item has been moved to Modify Request.",
      });
    },
    [tabs]
  );

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
    async (action, actionRemark = reviewRemark) => {
      const normalizedAction = String(action || "").trim().toLowerCase();
      const normalizedRemark = String(actionRemark || "").trim();

      if (!selectedSubmissionId) {
        return;
      }

      if (normalizedAction === "reject" && !normalizedRemark) {
        setReviewError("Remark is required to reject this subprocess.");
        return;
      }

      setIsWorkflowSubmitting(true);

      try {
        await submitOmsReviewAction({
          action: normalizedAction,
          submissionId: selectedSubmissionId,
          remark: normalizedRemark,
        });

        const nextStatusKey =
          normalizedAction === "reject"
            ? "commented"
            : normalizedAction === "modify_approved"
            ? "modify_approved"
            : normalizedAction === "modify_rejected"
            ? "submitted"
            : normalizedAction === "verify"
            ? "verified"
            : "approved";

        setWorkflowStatusOverrides((currentValue) => ({
          ...currentValue,
          [selectedSubmissionId]: nextStatusKey,
        }));
        setItemsByTab((currentValue) =>
          applyWorkflowActionToTabItems({
            itemsByTab: currentValue,
            tabs,
            submissionId: selectedSubmissionId,
            action: normalizedAction,
          })
        );
        if (
          normalizedAction === "modify_approved" ||
          normalizedAction === "modify_rejected"
        ) {
          setItemsByTab((currentValue) =>
            applyModifyRequestToTabItems({
              itemsByTab: currentValue,
              tabs,
              submissionId: selectedSubmissionId,
              action: normalizedAction,
            })
          );
          setModifyRequestOverrides((currentValue) => {
            const nextValue = { ...currentValue };
            delete nextValue[selectedSubmissionId];
            return nextValue;
          });
        }
        setSelectedWorkItem((currentValue) => {
          if (
            String(currentValue?.submissionId || "").trim() !==
            selectedSubmissionId
          ) {
            return currentValue;
          }

          const patch =
            normalizedAction === "modify_approved" ||
            normalizedAction === "modify_rejected"
              ? getModifyRequestItemPatch(normalizedAction)
              : getWorkflowActionItemPatch(normalizedAction);
          return patch ? { ...currentValue, ...patch } : currentValue;
        });
        if (
          normalizedAction === "modify_approved" ||
          normalizedAction === "modify_rejected"
        ) {
          await refreshSelectedProgress();
        } else {
          await Promise.all([
            refreshSelectedProgress(),
            loadBoard({ silent: true, forceRefresh: true }),
          ]);
        }
        setReviewRemark("");
        setReviewError("");

        showAppAlert({
          type: "success",
          title:
            normalizedAction === "verify"
              ? "Verified successfully"
              : normalizedAction === "modify_approved"
              ? "Modify request approved"
              : normalizedAction === "modify_rejected"
              ? "Modify request rejected"
              : normalizedAction === "approve"
              ? "Approved successfully"
              : "Rejected successfully",
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
      tabs,
    ]
  );

  const getUnitStatusDetails = useCallback((item) => getWorkItemStatusDetails(item), []);

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
      canModify: Boolean(
        roleAccess.canVerifyChecklist || roleAccess.canApproveChecklist
      ),
      canReviewModifyRequest: Boolean(
        roleAccess.canVerifyChecklist || roleAccess.canApproveChecklist
      ),
      canViewModifyRequestOnly: Boolean(
        roleAccess.canReviewChecklist &&
          !roleAccess.canVerifyChecklist &&
          !roleAccess.canApproveChecklist
      ),
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
    requestModification,
    refreshSelectedProgress,
    getUnitStatusDetails,
    getUnitWorkBucket,
    pagination: null,
    handleBack,
  };
};

export default useWorkStatusViewModel;
