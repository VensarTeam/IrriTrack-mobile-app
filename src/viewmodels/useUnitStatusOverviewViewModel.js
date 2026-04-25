import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  findUnitProgressSubprocess,
  getUnitProgressSummary,
} from "../models/unitProgress";
import useUnitProgress from "../hooks/useUnitProgress";

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
  const { user } = useAuth();
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
  const { progress, isLoading, error, refreshProgress } = useUnitProgress({
    projectId,
    unitId,
    enabled: Boolean(projectId && unitId),
  });
  const [selectedSubprocessState, setSelectedSubprocessState] = useState(null);

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

  const summary = useMemo(() => getUnitProgressSummary(progress), [progress]);

  const handleBack = () => {
    navigation.goBack();
  };

  const openSubprocessModal = (process, subprocess) => {
    setSelectedSubprocessState({ process, subprocess });
  };

  const closeSubprocessModal = () => {
    setSelectedSubprocessState(null);
  };

  return {
    module,
    unit,
    unitLabel,
    projectName,
    processes: progress.processes,
    summary,
    isLoading,
    error,
    refreshProgress,
    selectedProcess: selectedSubprocessState?.process || null,
    selectedSubprocess: selectedSubprocessState?.subprocess || null,
    handleBack,
    openSubprocessModal,
    closeSubprocessModal,
  };
};

export default useUnitStatusOverviewViewModel;
