import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";
import {
  findUnitProgressSubprocess,
  getUnitProgressSummary,
} from "../models/unitProgress";
import useUnitProgress from "../hooks/useUnitProgress";
import { showAppAlert } from "../services/alertService";
import { openDirections } from "../services/mapService";
import { submitOmsReviewAction } from "../services/omsReviewService";

const toDisplayText = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const preferredValue =
      value.name ||
      value.label ||
      value.title ||
      value.unitNo ||
      value.nodeName ||
      value.code ||
      value.id;

    if (preferredValue === null || preferredValue === undefined) {
      return fallback;
    }

    return String(preferredValue);
  }

  return fallback;
};

const parseChecklistLocation = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    const primaryLocation = value.updated_location || value.updatedLocation || value;
    const fallbackLocation = value.default_location || value.defaultLocation;
    const candidate = primaryLocation || fallbackLocation;
    const latitude = Number(candidate?.latitude);
    const longitude = Number(candidate?.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  const match = String(value)
    .trim()
    .match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

  if (!match) {
    return null;
  }

  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
  };
};

const useUnitStatusOverviewViewModel = (navigation, route) => {
  const { user, roleAccess } = useAuth();
  const module = route?.params?.module || "OMS";
  const unit = route?.params?.unit || {};
  const unitLabel = toDisplayText(unit.unitNo, `${module}-001`);
  const projectName = toDisplayText(
    route?.params?.projectName || route?.params?.project?.name,
    "IrriTrack"
  );
  const projectId =
    route?.params?.projectId ||
    route?.params?.project?.id ||
    route?.params?.project?.projectId ||
    user?.projectId ||
    "";
  const unitId = unit?.id || route?.params?.unitId || "";
  const workItem = route?.params?.workItem || null;
  const selectedSubmissionId = String(workItem?.submissionId || "").trim();
  const selectedWorkflowProcessId = Number(workItem?.processId) || null;
  const selectedWorkflowSubprocessId = Number(workItem?.subprocessId) || null;
  const initialSubprocessId = route?.params?.initialSubprocessId || null;
  const focusSubprocessId = initialSubprocessId || selectedWorkflowSubprocessId;
  const [hasAppliedInitialFocus, setHasAppliedInitialFocus] = useState(false);
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [expandedProcesses, setExpandedProcesses] = useState({});
  const [workflowStatusOverrides, setWorkflowStatusOverrides] = useState({});
  const [selectedReviewTarget, setSelectedReviewTarget] = useState(null);
  const [imagePreview, setImagePreview] = useState({
    visible: false,
    uri: "",
    title: "",
  });
  const { progress, isLoading, error, refreshProgress } = useUnitProgress({
    projectId,
    unitId,
    enabled: Boolean(projectId && unitId),
  });
  const [selectedSubprocessState, setSelectedSubprocessState] = useState(null);

  useEffect(() => {
    if (roleAccess.canViewUnitStatus) {
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.replace(ROUTES.ROOT.APP_TABS);
  }, [navigation, roleAccess.canViewUnitStatus]);

  useEffect(() => {
    const firstProcessId = progress.processes[0]?.id;

    if (!firstProcessId) {
      setExpandedProcesses({});
      return;
    }

    setExpandedProcesses((currentValue) =>
      progress.processes.some((process) => currentValue[process.id])
        ? currentValue
        : { [firstProcessId]: true }
    );
  }, [progress.processes]);

  useEffect(() => {
    if (
      !focusSubprocessId ||
      hasAppliedInitialFocus ||
      !progress.processes.length
    ) {
      return;
    }

    const match = findUnitProgressSubprocess(progress, focusSubprocessId);

    if (!match) {
      return;
    }

    setSelectedSubprocessState(match);
    setExpandedProcesses({ [match.process.id]: true });
    setHasAppliedInitialFocus(true);
  }, [focusSubprocessId, hasAppliedInitialFocus, progress]);

  useEffect(() => {
    setReviewRemark("");
    setReviewError("");
  }, [selectedSubprocessState?.subprocess?.id]);

  const summary = useMemo(() => getUnitProgressSummary(progress), [progress]);
  const screenTitle = "All Status";
  const selectedSubprocess = selectedSubprocessState?.subprocess || null;
  const selectedProcess = selectedSubprocessState?.process || null;
  const canReviewChecklist = roleAccess.canReviewChecklist;
  const reviewCapabilities = useMemo(
    () => ({
      role: roleAccess.role,
      canVerify: Boolean(roleAccess.canVerifyChecklist),
      canApprove: Boolean(roleAccess.canApproveChecklist),
      canReject: Boolean(roleAccess.canRejectChecklist),
    }),
    [
      roleAccess.canApproveChecklist,
      roleAccess.canRejectChecklist,
      roleAccess.canVerifyChecklist,
      roleAccess.role,
    ]
  );
  const selectedSubprocessDetails = selectedSubprocess?.detailItems || [];
  const selectedSubprocessLocation = useMemo(() => {
    for (const checklist of selectedSubprocess?.checklists || []) {
      const coordinates = parseChecklistLocation(
        checklist?.detail?.rawValue ?? checklist?.rawChecklist?.value
      );

      if (coordinates) {
        return coordinates;
      }
    }

    return null;
  }, [selectedSubprocess]);

  const updateReviewRemark = (value) => {
    setReviewRemark(value);

    if (reviewError) {
      setReviewError("");
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleProcess = (processId) => {
    setExpandedProcesses((currentValue) => ({
      ...currentValue,
      [processId]: !currentValue[processId],
    }));
  };

  const isProcessExpanded = (processId) => Boolean(expandedProcesses[processId]);

  const openSubprocessModal = (process, subprocess) => {
    setSelectedSubprocessState({ process, subprocess });
  };

  const closeSubprocessModal = () => {
    setSelectedSubprocessState(null);
  };

  const openImagePreview = ({ uri = "", title = "" } = {}) => {
    if (!uri) {
      return;
    }

    setImagePreview({
      visible: true,
      uri,
      title,
    });
  };

  const closeImagePreview = () => {
    setImagePreview({
      visible: false,
      uri: "",
      title: "",
    });
  };

  const openSelectedSubprocessDirections = async () => {
    if (!selectedSubprocessLocation) {
      showAppAlert({
        type: "info",
        title: "Location unavailable",
        message: "Directions are not available for this subprocess yet.",
      });
      return;
    }

    await openDirections(
      selectedSubprocessLocation.latitude,
      selectedSubprocessLocation.longitude
    );
  };

  const closeRejectFlow = () => {
    setSelectedReviewTarget(null);
    setReviewRemark("");
    setReviewError("");
  };

  const openRejectFlow = (target) => {
    setSelectedReviewTarget(target);
    setReviewRemark("");
    setReviewError("");
  };

  const submitReview = async ({ decision, process, subprocess = null, remark = "" }) => {
    if (!canReviewChecklist || !process) {
      return;
    }

    if (!selectedSubmissionId) {
      showAppAlert({
        type: "info",
        title: "Workflow unavailable",
        message:
          "Open this item from Work Status to continue with verify, approve, or reject actions.",
      });
      return;
    }

    if (decision === "reject" && !remark.trim()) {
      setReviewError("Comment is required to reject this subprocess.");
      return;
    }

    setIsReviewSubmitting(true);

    try {
      await submitOmsReviewAction({
        action: decision,
        submissionId: selectedSubmissionId,
        remark: remark.trim(),
      });
      setWorkflowStatusOverrides((currentValue) => ({
        ...currentValue,
        [String(subprocess?.id || process.id)]: decision === "reject"
          ? "commented"
          : decision === "verify"
          ? "verified"
          : "approved",
      }));
      await refreshProgress();
      closeRejectFlow();
      showAppAlert({
        type: "success",
        title:
          decision === "approve"
            ? "Approved successfully"
            : decision === "verify"
            ? "Verified successfully"
            : "Rejected successfully",
      });
    } catch (nextError) {
      showAppAlert({
        type: "danger",
        title: "Unable to submit review",
        message:
          nextError?.message ||
          "Review API is not configured yet. Wire the endpoint in omsReviewService.",
      });
      setReviewError(
        nextError?.message ||
          "Review API is not configured yet. Wire the endpoint in omsReviewService."
      );
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  return {
    module,
    unit,
    unitLabel,
    projectName,
    screenTitle,
    canReviewChecklist,
    reviewCapabilities,
    processes: progress.processes,
    summary,
    isLoading,
    error,
    refreshProgress,
    selectedProcess,
    selectedSubprocess,
    selectedSubprocessDetails,
    selectedSubprocessLocation,
    selectedReviewTarget,
    workflowStatusOverrides,
    imagePreview,
    workItem,
    selectedSubmissionId,
    selectedWorkflowProcessId,
    selectedWorkflowSubprocessId,
    reviewRemark,
    reviewError,
    isReviewSubmitting,
    updateReviewRemark,
    submitReview,
    handleBack,
    toggleProcess,
    isProcessExpanded,
    openSubprocessModal,
    closeSubprocessModal,
    openSelectedSubprocessDirections,
    openImagePreview,
    closeImagePreview,
    openRejectFlow,
    closeRejectFlow,
  };
};

export default useUnitStatusOverviewViewModel;
