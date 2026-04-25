import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";
import {
  findUnitProgressSubprocess,
  getUnitProgressSummary,
} from "../models/unitProgress";
import useUnitProgress from "../hooks/useUnitProgress";
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
  const initialSubprocessId = route?.params?.initialSubprocessId || null;
  const [hasAppliedInitialFocus, setHasAppliedInitialFocus] = useState(false);
  const [reviewRemark, setReviewRemark] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
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
    if (
      !initialSubprocessId ||
      hasAppliedInitialFocus ||
      !progress.processes.length
    ) {
      return;
    }

    const match = findUnitProgressSubprocess(progress, initialSubprocessId);

    if (!match) {
      return;
    }

    setSelectedSubprocessState(match);
    setHasAppliedInitialFocus(true);
  }, [hasAppliedInitialFocus, initialSubprocessId, progress]);

  useEffect(() => {
    setReviewRemark("");
    setReviewError("");
  }, [selectedSubprocessState?.subprocess?.id]);

  const summary = useMemo(() => getUnitProgressSummary(progress), [progress]);
  const screenTitle = roleAccess.canReviewChecklist ? "Review" : "All Status";
  const selectedSubprocess = selectedSubprocessState?.subprocess || null;
  const selectedProcess = selectedSubprocessState?.process || null;
  const canReviewChecklist = roleAccess.canReviewChecklist;
  const selectedSubprocessDetails = selectedSubprocess?.detailItems || [];

  const updateReviewRemark = (value) => {
    setReviewRemark(value);

    if (reviewError) {
      setReviewError("");
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const openSubprocessModal = (process, subprocess) => {
    setSelectedSubprocessState({ process, subprocess });
  };

  const closeSubprocessModal = () => {
    setSelectedSubprocessState(null);
  };

  const submitReview = async (decision) => {
    if (!canReviewChecklist || !selectedSubprocess) {
      return;
    }

    if (decision === "reject" && !reviewRemark.trim()) {
      setReviewError("Comment is required to reject this subprocess.");
      return;
    }

    setIsReviewSubmitting(true);

    try {
      await submitOmsReviewAction({
        action: decision,
        module,
        projectId,
        unitId,
        processId: selectedProcess?.id || null,
        subprocessId: selectedSubprocess.id,
        remark: reviewRemark.trim(),
      });
    } catch (nextError) {
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
    processes: progress.processes,
    summary,
    isLoading,
    error,
    refreshProgress,
    selectedProcess,
    selectedSubprocess,
    selectedSubprocessDetails,
    reviewRemark,
    reviewError,
    isReviewSubmitting,
    updateReviewRemark,
    submitReview,
    handleBack,
    openSubprocessModal,
    closeSubprocessModal,
  };
};

export default useUnitStatusOverviewViewModel;
